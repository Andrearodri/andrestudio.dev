#!/usr/bin/env node
/**
 * Checagem estática de sintaxe/tipos, conformidade CSP, compatibilidade Cloudflare Edge
 * e auditoria de lazy-loading / tamanho de bundles.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'build', 'public');

async function walkFiles(dir, ignoreDirs = new Set(['.git', 'node_modules', 'build', 'assets', 'portfolio', 'demo', 'blog', 'cases'])) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walkFiles(fullPath, ignoreDirs));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

async function checkSyntaxAndTypes() {
  const files = await walkFiles(ROOT);
  const codeFiles = files.filter((f) => /\.(js|mjs|cjs|ts)$/.test(f));

  for (const file of codeFiles) {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  }

  // Checa importação TypeScript nativa (Node 24 type-stripping) nos contratos .ts
  for (const tsRel of ['data/brandConfig.ts', 'data/projectData.ts']) {
    const mod = await import(pathToFileURL(path.join(ROOT, tsRel)).href);
    assert.ok(Object.keys(mod).length > 0, `${tsRel} deve exportar símbolos válidos`);
  }

  console.log(`Syntax & Typecheck: PASS (${codeFiles.length} arquivos JS/MJS/CJS/TS validados)`);
}

async function checkEdgeFunctions() {
  const fnDir = path.join(ROOT, 'functions', 'api');
  const entries = await fs.readdir(fnDir);
  const fnFiles = entries.filter((name) => name.endsWith('.js'));
  assert.ok(fnFiles.length >= 2, 'functions/api deve conter auditor-ia.js e auditor-lead.js');

  for (const file of fnFiles) {
    const full = path.join(fnDir, file);
    const src = await fs.readFile(full, 'utf8');
    assert.doesNotMatch(src, /from\s+['"]node:/, `${file}: proibido import nativo node:* no Edge`);
    assert.doesNotMatch(src, /\bBuffer\b/, `${file}: proibido uso de Buffer no Cloudflare Edge`);
    assert.doesNotMatch(src, /\bprocess\.env\b/, `${file}: use context.env em vez de process.env no Edge`);
  }

  console.log(`Cloudflare Edge Runtime check: PASS (${fnFiles.length} rotas Web API puras)`);
}

async function checkPublicHtmlAndCsp() {
  const htmlFiles = [];
  async function collectHtml(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await collectHtml(full);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlFiles.push(full);
      }
    }
  }
  await collectHtml(PUBLIC_DIR);
  assert.ok(htmlFiles.length > 0, 'build/public deve existir; rode build-public.py antes');

  let jsonLdCount = 0;
  for (const htmlFile of htmlFiles) {
    const rel = path.relative(PUBLIC_DIR, htmlFile);
    const html = await fs.readFile(htmlFile, 'utf8');

    // Detecta handlers inline proibidos pela CSP em tags HTML
    const inlineEventMatch = html.match(/<[a-zA-Z][^>]*\s+on(?:click|change|submit|input|keypress|load|error)\s*=/i);
    assert.equal(inlineEventMatch, null, `Handler inline detectado em ${rel}: ${inlineEventMatch?.[0]}`);
    if (rel === 'index.html' || rel.startsWith('ferramentas/')) {
      const anyInlineEvent = html.match(/<[a-zA-Z][^>]*\s+on[a-z]+\s*=/i);
      assert.equal(anyInlineEvent, null, `Handler inline detectado em ${rel}: ${anyInlineEvent?.[0]}`);
    }

    // Audita todos os <script>
    const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    for (const match of scriptMatches) {
      const attrs = match[1] || '';
      const body = (match[2] || '').trim();
      const hasSrc = /\bsrc\s*=/.test(attrs);
      const isJsonLd = /type\s*=\s*['"]application\/ld\+json['"]/i.test(attrs);
      if (isJsonLd) {
        const parsed = JSON.parse(body);
        assert.ok(parsed && typeof parsed === 'object', `JSON-LD inválido em ${rel}`);
        jsonLdCount += 1;
      } else {
        assert.ok(hasSrc, `Script inline proibido pela CSP em ${rel}`);
        assert.equal(body, '', `Tag <script src> não deve conter código inline em ${rel}`);
      }
    }
  }

  // Confirma schemas exigidos na página principal
  const indexHtml = await fs.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  const indexLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(indexLdMatch, 'index.html deve possuir JSON-LD');
  const indexLd = JSON.parse(indexLdMatch[1]);
  const types = (indexLd['@graph'] || []).map((node) => node['@type']);
  for (const expectedType of ['ProfessionalService', 'EducationalOrganization', 'SoftwareApplication', 'Person']) {
    assert.ok(types.includes(expectedType), `Schema.org ${expectedType} ausente em index.html`);
  }

  console.log(`CSP & JSON-LD HTML audit: PASS (${htmlFiles.length} HTMLs, ${jsonLdCount} JSON-LDs válidos)`);
}

async function checkBundlesAndLazyLoading() {
  const auditorDir = path.join(PUBLIC_DIR, 'ferramentas', 'auditor-ia');
  const appSource = await fs.readFile(path.join(auditorDir, 'app.mjs'), 'utf8');

  assert.doesNotMatch(
    appSource,
    /^\s*import\s+[^;]*?from\s+['"][^'"]*xlsx-codec\.mjs['"]/m,
    'app.mjs não pode importar xlsx-codec.mjs estaticamente no topo'
  );
  assert.match(
    appSource,
    /await\s+import\(\s*['"]\/ferramentas\/auditor-ia\/xlsx-codec\.mjs['"]\s*\)/,
    'app.mjs deve carregar xlsx-codec.mjs via import() dinâmico sob demanda'
  );

  const bundleRelPaths = [
    'data/brandConfig.mjs',
    'ferramentas/auditor-ia/financial-engine.mjs',
    'ferramentas/auditor-ia/presets.mjs',
    'ferramentas/auditor-ia/fallback-analyst.mjs',
    'ferramentas/auditor-ia/app.mjs',
    'ferramentas/auditor-ia/auditor-ia.css',
    'ferramentas/auditor-ia/xlsx-codec.mjs'
  ];

  let initialJsRaw = 0;
  let initialJsGzip = 0;
  let lazyXlsxRaw = 0;
  let lazyXlsxGzip = 0;

  console.log('\nTamanho dos bundles públicos (build/public):');
  for (const rel of bundleRelPaths) {
    const buf = await fs.readFile(path.join(PUBLIC_DIR, rel));
    const gz = zlib.gzipSync(buf, { level: 9 }).byteLength;
    console.log(`- ${rel}: ${buf.byteLength} bytes (${gz} bytes gzip)`);
    if (rel === 'ferramentas/auditor-ia/xlsx-codec.mjs') {
      lazyXlsxRaw = buf.byteLength;
      lazyXlsxGzip = gz;
    } else if (rel.endsWith('.mjs')) {
      initialJsRaw += buf.byteLength;
      initialJsGzip += gz;
    }
  }

  assert.ok(initialJsGzip < 45 * 1024, `Bundle JS inicial muito grande: ${initialJsGzip} bytes gzip`);
  assert.ok(lazyXlsxGzip < 15 * 1024, `Codec XLSX sob demanda muito grande: ${lazyXlsxGzip} bytes gzip`);
  console.log(`Resumo JS inicial Auditor IA: ${initialJsRaw} bytes (${initialJsGzip} bytes gzip) | Lazy XLSX: ${lazyXlsxRaw} bytes (${lazyXlsxGzip} bytes gzip)`);
}

await checkSyntaxAndTypes();
await checkEdgeFunctions();
await checkPublicHtmlAndCsp();
await checkBundlesAndLazyLoading();
