// Cloudflare Pages Function: POST /api/auditor-lead
// Captura enxuta de lead para liberar a planilha .xlsx completa + encaminhamento opcional para KV/D1/Webhook.

import { extractBrPhoneDigits, formatPhoneMaskBr } from '../../data/brandConfig.mjs';
import { parsePtBrNumber } from '../../ferramentas/auditor-ia/financial-engine.mjs';
import { sanitizeFreeText } from '../../ferramentas/auditor-ia/fallback-analyst.mjs';

const MAX_LEAD_BYTES = 8 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_LEADS = 8;

const leadRateMap = new Map();

function isAllowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === 'andrestudio.dev.br' ||
      host === 'www.andrestudio.dev.br' ||
      host.endsWith('.pages.dev') ||
      host === 'localhost' ||
      host === '127.0.0.1';
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

function checkLeadRateLimit(ip) {
  const safeIp = String(ip || 'local').slice(0, 80);
  const now = Date.now();
  if (leadRateMap.size > 1500) {
    for (const [k, entry] of leadRateMap.entries()) {
      if (now > entry.resetAt) leadRateMap.delete(k);
    }
  }
  let entry = leadRateMap.get(safeIp);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_WINDOW_MS };
  } else {
    entry.count += 1;
  }
  leadRateMap.set(safeIp, entry);
  return {
    allowed: entry.count <= RATE_MAX_LEADS,
    retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
  };
}

export async function onRequestPost(context) {
  const { request, env = {} } = context;

  if (!isAllowedOrigin(request)) {
    return jsonResponse({ ok: false, error: 'Origem não autorizada.' }, 403);
  }

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkLeadRateLimit(ip);
  if (!rate.allowed) {
    return jsonResponse(
      { ok: false, error: 'Muitas tentativas seguidas. Aguarde alguns minutos.' },
      429,
      { 'retry-after': String(rate.retryAfterSec) }
    );
  }

  let rawText = '';
  try {
    rawText = await request.text();
  } catch {
    return jsonResponse({ ok: false, error: 'Erro ao ler dados enviados.' }, 400);
  }

  if (new TextEncoder().encode(rawText).byteLength > MAX_LEAD_BYTES) {
    return jsonResponse({ ok: false, error: 'Dados excedem o tamanho permitido.' }, 413);
  }

  let body;
  try {
    body = JSON.parse(rawText);
  } catch {
    return jsonResponse({ ok: false, error: 'JSON inválido.' }, 400);
  }

  const name = sanitizeFreeText(body?.name || '', 80);
  const company = sanitizeFreeText(body?.company || '', 100);
  const whatsappDigits = extractBrPhoneDigits(body?.whatsapp || '');

  if (name.length < 2) {
    return jsonResponse({ ok: false, error: 'Informe seu nome com pelo menos 2 caracteres.' }, 400);
  }
  if (company.length < 2) {
    return jsonResponse({ ok: false, error: 'Informe o nome da sua empresa ou ramo de atuação.' }, 400);
  }
  if (whatsappDigits.length < 10 || whatsappDigits.length > 11) {
    return jsonResponse({ ok: false, error: 'Informe um WhatsApp brasileiro válido com DDD (10 ou 11 dígitos).' }, 400);
  }

  const createdAt = new Date().toISOString();
  const leadId = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const record = {
    id: leadId,
    createdAt,
    name,
    company,
    whatsappDigits,
    whatsappFormatted: formatPhoneMaskBr(whatsappDigits),
    nicheLabel: sanitizeFreeText(body?.nicheLabel || 'PME', 80),
    moduleId: ['whatsapp', 'pricing', 'automation'].includes(body?.moduleId) ? body.moduleId : 'whatsapp',
    monthlyLeakageBRL: body?.monthlyLeakageBRL === null ? null : Math.max(0, parsePtBrNumber(body?.monthlyLeakageBRL, 0)),
    projection12mBRL: body?.projection12mBRL === null ? null : Math.max(0, parsePtBrNumber(body?.projection12mBRL, 0))
  };

  const persistedTargets = [];

  if (env?.LEADS_KV && typeof env.LEADS_KV.put === 'function') {
    try {
      await env.LEADS_KV.put(`lead:${createdAt}:${leadId}`, JSON.stringify(record), { expirationTtl: 15552000 });
      persistedTargets.push('kv');
    } catch {
      // Nunca bloqueia o download do visitante
    }
  }

  if (env?.DB && typeof env.DB.prepare === 'function') {
    try {
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS auditor_leads (id TEXT PRIMARY KEY, created_at TEXT, name TEXT, company TEXT, whatsapp TEXT, niche TEXT, module_id TEXT, monthly_leakage_brl REAL, projection_12m_brl REAL)'
      ).run();
      await env.DB.prepare(
        'INSERT INTO auditor_leads (id, created_at, name, company, whatsapp, niche, module_id, monthly_leakage_brl, projection_12m_brl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        record.id,
        record.createdAt,
        record.name,
        record.company,
        record.whatsappDigits,
        record.nicheLabel,
        record.moduleId,
        record.monthlyLeakageBRL,
        record.projection12mBRL
      ).run();
      persistedTargets.push('d1');
    } catch {
      // Nunca bloqueia o download do visitante
    }
  }

  if (env?.LEAD_WEBHOOK_URL && String(env.LEAD_WEBHOOK_URL).startsWith('https://')) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(record),
        signal: controller.signal
      });
      persistedTargets.push('webhook');
    } catch {
      // Nunca bloqueia o download do visitante
    } finally {
      clearTimeout(timer);
    }
  }

  return jsonResponse({
    ok: true,
    leadId,
    persistedTargets
  });
}

export async function onRequest({ request, env }) {
  if (request.method === 'POST') {
    return onRequestPost({ request, env });
  }
  return jsonResponse({ ok: false, error: 'Método não permitido. Utilize POST.' }, 405, { allow: 'POST' });
}

export function __resetLeadRateLimitForTests() {
  leadRateMap.clear();
}
