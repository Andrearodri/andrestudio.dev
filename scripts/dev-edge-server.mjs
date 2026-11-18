#!/usr/bin/env node
/**
 * Servidor local de desenvolvimento com suporte ao pacote estático (build/public + _headers)
 * e roteamento direto para as Cloudflare Pages Functions (/api/auditor-ia e /api/auditor-lead).
 * Zero dependências externas (Node.js 24+).
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequest as onAuditorIaRequest } from '../functions/api/auditor-ia.js';
import { onRequest as onAuditorLeadRequest } from '../functions/api/auditor-lead.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'build', 'public');
const PORT = Number(process.env.PORT || 8765);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function loadLocalEnv() {
  const envPath = path.join(ROOT, '.env');
  const localEnv = { ...process.env };
  if (!existsSync(envPath)) return localEnv;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eqIdx = trimmed.indexOf('=');
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !(key in localEnv)) {
      localEnv[key] = val;
    }
  }
  return localEnv;
}

function parseHeadersRules() {
  const headersPath = path.join(PUBLIC_DIR, '_headers');
  const rules = [];
  if (!existsSync(headersPath)) return rules;
  let currentPattern = null;
  let currentMap = {};
  for (const raw of readFileSync(headersPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (!raw.startsWith(' ') && !raw.startsWith('\t') && !line.includes(':')) {
      if (currentPattern) rules.push([currentPattern, currentMap]);
      currentPattern = line;
      currentMap = {};
    } else if (currentPattern && line.includes(':')) {
      const idx = line.indexOf(':');
      currentMap[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  if (currentPattern) rules.push([currentPattern, currentMap]);
  return rules;
}

function matchHeaders(rules, reqPath) {
  const out = {};
  for (const [pattern, hdrs] of rules) {
    if (pattern === '/*' || (pattern.endsWith('*') && reqPath.startsWith(pattern.slice(0, -1))) || reqPath === pattern) {
      Object.assign(out, hdrs);
    }
  }
  return out;
}

async function handleApiRoute(req, res, url, handler, env) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
  }
  const webReq = new Request(url.toString(), {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : body
  });
  const webRes = await handler({ request: webReq, env });
  const resHeaders = {};
  webRes.headers.forEach((v, k) => {
    resHeaders[k] = v;
  });
  res.writeHead(webRes.status, resHeaders);
  const buf = Buffer.from(await webRes.arrayBuffer());
  res.end(buf);
}

const env = loadLocalEnv();
const headerRules = parseHeadersRules();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const reqPath = decodeURIComponent(url.pathname);

  if (reqPath === '/api/auditor-ia') {
    await handleApiRoute(req, res, url, onAuditorIaRequest, env);
    return;
  }
  if (reqPath === '/api/auditor-lead') {
    await handleApiRoute(req, res, url, onAuditorLeadRequest, env);
    return;
  }

  let candidate = path.normalize(path.join(PUBLIC_DIR, reqPath.replace(/^\/+/, '')));
  if (!candidate.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(candidate).catch(() => null);
    if (stat?.isDirectory()) {
      candidate = path.join(candidate, 'index.html');
    }
    const data = await fs.readFile(candidate);
    const ext = path.extname(candidate).toLowerCase();
    const secHeaders = matchHeaders(headerRules, reqPath);
    res.writeHead(200, {
      ...secHeaders,
      'content-type': MIME_TYPES[ext] || 'application/octet-stream'
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    const notFound = await fs.readFile(path.join(PUBLIC_DIR, '404.html')).catch(() => '404 Not Found');
    res.end(notFound);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`AndreStudio Edge Dev Server ativo em http://127.0.0.1:${PORT}`);
});
