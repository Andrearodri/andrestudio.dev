// Cloudflare Pages Function: POST /api/auditor-ia
// 100% Web Standard APIs (zero dependências nativas Node).

import { runFinancialAudit } from '../../ferramentas/auditor-ia/financial-engine.mjs';
import {
  PayloadValidationError,
  buildBusinessEngineeringPrompts,
  buildContingencyAnalysis,
  sanitizeAuditPayload,
  validateAnalysisSchema
} from '../../ferramentas/auditor-ia/fallback-analyst.mjs';

const MAX_BODY_BYTES = 32 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 12;
const AI_TIMEOUT_MS = 9000;

const memoryRateMap = new Map();

function pruneMemoryRateMap(now) {
  if (memoryRateMap.size <= 1500) return;
  for (const [key, entry] of memoryRateMap.entries()) {
    if (now > entry.resetAt) {
      memoryRateMap.delete(key);
    }
  }
  while (memoryRateMap.size > 2000) {
    const oldestKey = memoryRateMap.keys().next().value;
    if (!oldestKey) break;
    memoryRateMap.delete(oldestKey);
  }
}

async function checkRateLimit(ip, env) {
  const safeIp = String(ip || 'local').slice(0, 80);
  const now = Date.now();
  const bucketKey = `auditor-ia:${safeIp}`;

  if (env?.RATE_LIMIT_KV && typeof env.RATE_LIMIT_KV.get === 'function' && typeof env.RATE_LIMIT_KV.put === 'function') {
    try {
      const raw = await env.RATE_LIMIT_KV.get(bucketKey);
      let entry = raw ? JSON.parse(raw) : null;
      if (!entry || now > entry.resetAt) {
        entry = { count: 1, resetAt: now + RATE_WINDOW_MS };
      } else {
        entry.count += 1;
      }
      await env.RATE_LIMIT_KV.put(bucketKey, JSON.stringify(entry), { expirationTtl: 600 });
      return {
        allowed: entry.count <= RATE_MAX_REQUESTS,
        remaining: Math.max(0, RATE_MAX_REQUESTS - entry.count),
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
      };
    } catch {
      // Fallback para controle em memória se o KV oscilar
    }
  }

  pruneMemoryRateMap(now);
  let entry = memoryRateMap.get(bucketKey);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_WINDOW_MS };
  } else {
    entry.count += 1;
  }
  memoryRateMap.set(bucketKey, entry);

  return {
    allowed: entry.count <= RATE_MAX_REQUESTS,
    remaining: Math.max(0, RATE_MAX_REQUESTS - entry.count),
    retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
  };
}

function isAllowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (host === 'andrestudio.dev.br' || host === 'www.andrestudio.dev.br') return true;
    if (host.endsWith('.pages.dev') || host === 'localhost' || host === '127.0.0.1') return true;
    return false;
  } catch {
    return false;
  }
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders
    }
  });
}

async function fetchWithTimeout(url, options, timeoutMs = AI_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiProvider(apiKey, modelId, systemPrompt, userPrompt) {
  const model = modelId || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}`);
  }
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const validated = validateAnalysisSchema(text);
  if (!validated) {
    throw new Error('Schema JSON inválido retornado pelo Gemini');
  }
  return { analysis: validated, provider: 'gemini', model };
}

async function callOpenAiProvider(apiKey, modelId, systemPrompt, userPrompt) {
  const model = modelId || 'gpt-4o-mini';
  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}`);
  }
  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content || '';
  const validated = validateAnalysisSchema(text);
  if (!validated) {
    throw new Error('Schema JSON inválido retornado pela OpenAI');
  }
  return { analysis: validated, provider: 'openai', model };
}

async function callWorkersAiProvider(aiBinding, modelId, systemPrompt, userPrompt) {
  const model = modelId || '@cf/meta/llama-3.1-8b-instruct';
  const response = await aiBinding.run(model, {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.35,
    max_tokens: 1800
  });
  const candidate = response?.response ?? response?.result ?? response;
  const validated = validateAnalysisSchema(candidate);
  if (!validated) {
    throw new Error('Schema JSON inválido retornado pelo Workers AI');
  }
  return { analysis: validated, provider: 'cloudflare-workers-ai', model };
}

function localAnalysis(auditResult, sanitizedInput) {
  return {
    analysis: buildContingencyAnalysis(auditResult, sanitizedInput),
    meta: {
      mode: 'contingency',
      provider: 'local-deterministic',
      model: 'business-rules-v1'
    }
  };
}

async function resolveAnalysisWithAdapters(auditResult, sanitizedInput, env = {}) {
  if (auditResult.details.isTargetMathematicallyInfeasible) {
    return localAnalysis(auditResult, sanitizedInput);
  }
  const { systemPrompt, userPrompt } = buildBusinessEngineeringPrompts(auditResult, sanitizedInput);
  const preferred = String(env.AI_PROVIDER || '').trim().toLowerCase();
  const modelId = String(env.AI_MODEL_ID || '').trim();

  const geminiKey = String(env.GEMINI_API_KEY || (preferred === 'gemini' ? env.AI_API_KEY : '') || '').trim();
  const openaiKey = String(env.OPENAI_API_KEY || (preferred === 'openai' ? env.AI_API_KEY : '') || '').trim();
  const hasWorkersAi = Boolean(env?.AI && typeof env.AI.run === 'function');

  const attempts = [];
  if (preferred === 'openai' && openaiKey) attempts.push(() => callOpenAiProvider(openaiKey, modelId, systemPrompt, userPrompt));
  if (preferred === 'workers-ai' && hasWorkersAi) attempts.push(() => callWorkersAiProvider(env.AI, modelId, systemPrompt, userPrompt));
  if (geminiKey) attempts.push(() => callGeminiProvider(geminiKey, modelId, systemPrompt, userPrompt));
  if (openaiKey && preferred !== 'openai') attempts.push(() => callOpenAiProvider(openaiKey, modelId, systemPrompt, userPrompt));
  if (hasWorkersAi && preferred !== 'workers-ai') attempts.push(() => callWorkersAiProvider(env.AI, modelId, systemPrompt, userPrompt));

  for (const attempt of attempts) {
    try {
      const res = await attempt();
      return {
        analysis: res.analysis,
        meta: {
          mode: 'ai',
          provider: res.provider,
          model: res.model
        }
      };
    } catch {
      // Tenta o próximo provedor ou cai suavemente no motor analítico local
    }
  }

  return localAnalysis(auditResult, sanitizedInput);
}

export async function onRequestPost(context) {
  const { request, env = {} } = context;

  if (!isAllowedOrigin(request)) {
    return jsonResponse({ ok: false, error: 'Origem não autorizada para esta API.' }, 403);
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader && Number.parseInt(contentLengthHeader, 10) > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'Payload excede o limite de 32 KB.' }, 413);
  }

  const contentType = String(request.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return jsonResponse({ ok: false, error: 'Content-Type deve ser application/json.' }, 415);
  }

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = await checkRateLimit(ip, env);
  if (!rate.allowed) {
    return jsonResponse(
      { ok: false, error: 'Limite de auditorias por minuto atingido. Aguarde alguns instantes e tente novamente.' },
      429,
      { 'retry-after': String(rate.retryAfterSec) }
    );
  }

  let rawText = '';
  try {
    rawText = await request.text();
  } catch {
    return jsonResponse({ ok: false, error: 'Não foi possível ler o corpo da requisição.' }, 400);
  }

  if (new TextEncoder().encode(rawText).byteLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'Payload excede o limite de 32 KB.' }, 413);
  }

  let rawBody;
  try {
    rawBody = JSON.parse(rawText);
  } catch {
    return jsonResponse({ ok: false, error: 'JSON malformado na requisição.' }, 400);
  }

  let sanitized;
  try {
    sanitized = sanitizeAuditPayload(rawBody);
  } catch (err) {
    const status = err instanceof PayloadValidationError ? err.status : 400;
    return jsonResponse({ ok: false, error: err.message || 'Dados inválidos.' }, status);
  }

  const audit = runFinancialAudit(sanitized);
  const { analysis, meta } = await resolveAnalysisWithAdapters(audit, sanitized, env);

  return jsonResponse({
    ok: true,
    audit,
    analysis,
    meta
  }, 200, {
    'x-ratelimit-remaining': String(rate.remaining)
  });
}

export async function onRequest({ request, env }) {
  if (request.method === 'POST') {
    return onRequestPost({ request, env });
  }
  return jsonResponse({ ok: false, error: 'Método não permitido. Utilize POST.' }, 405, { allow: 'POST' });
}

export function __resetRateLimitForTests() {
  memoryRateMap.clear();
}
