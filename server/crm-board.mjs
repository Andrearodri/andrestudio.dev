import { extractBrPhoneDigits, formatPhoneMaskBr } from '../data/brandConfig.mjs';

const stages = new Map([
  ['novos', ['Novos Leads', 'blue']],
  ['contato', ['Em Contato', 'yellow']],
  ['proposta', ['Proposta Enviada', 'purple']],
  ['fechado', ['Fechado', 'green']]
]);
const recordKey = /^lead:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z):([a-zA-Z0-9-]{1,80})$/;
const retentionSeconds = 180 * 24 * 60 * 60;
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Fortaleza' });

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

export function reply(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    ...headers
  } });
}

function card(key, lead, stage, cursor, note) {
  const source = lead.source === 'manual' ? 'Manual' : 'Auditor IA';
  const stageOptions = [...stages].map(([id, [label]]) =>
    `<option value="${id}"${id === stage ? ' selected' : ''}>${label}</option>`).join('');
  const initials = String(lead.name ?? '').trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const phone = String(lead.whatsappDigits ?? '').replace(/\D/g, '');
  const contact = /^[1-9]{2}\d{8,9}$/.test(phone) && !/^0+$/.test(phone.slice(2))
    ? `<a class="crm-contact" href="https://wa.me/55${phone}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>`
    : '';
  const fields = `<input type="hidden" name="key" value="${escape(key)}"><input type="hidden" name="cursor" value="${escape(cursor)}">`;
  return `<article class="lead-card" data-source="${source}" data-search="${escape([lead.name, lead.company, lead.whatsappFormatted, phone].join(' '))}">
    <div class="crm-card-top"><span class="crm-avatar" aria-hidden="true">${escape(initials)}</span><div><h3>${escape(lead.name)}</h3>
    <p>${escape(lead.company)}</p></div></div>
    <div class="crm-card-tags"><span class="crm-source">${source}</span><time datetime="${escape(lead.createdAt)}">${dateFormat.format(Date.parse(key.slice(5, 29)))}</time></div>
    <div class="crm-phone"><span>${escape(lead.whatsappFormatted || 'Sem telefone')}</span>${contact}</div>
    <form method="post" class="crm-stage-form">${fields}
    <label>Etapa <select name="stage">${stageOptions}</select></label>
    <button class="crm-secondary" type="submit" aria-label="Salvar etapa de ${escape(lead.name)}">Salvar</button></form>
    <details class="crm-notes"><summary>${note ? 'Ver nota de acompanhamento' : 'Adicionar nota'}</summary>
      <form method="post">${fields}<input type="hidden" name="action" value="note">
        <label>Nota interna <textarea name="note" rows="3" maxlength="500">${escape(note)}</textarea></label>
        <button class="crm-secondary" type="submit">Salvar nota</button>
      </form>
    </details></article>`;
}

async function showBoard(kv, cursor, createdKey) {
  const page = await kv.list({ prefix: 'lead:', limit: 30, ...(cursor && { cursor }) });
  const keys = page.keys.map(k => k.name).filter(key => recordKey.test(key) && Number.isFinite(Date.parse(key.slice(5, 29))));
  const selected = recordKey.test(createdKey) && Number.isFinite(Date.parse(createdKey.slice(5, 29))) ? createdKey : '';
  const orderedKeys = keys.reverse();
  if (selected && !keys.includes(selected)) orderedKeys.unshift(selected);
  let selectedVisible = false;
  const columns = new Map([...stages.keys()].map(id => [id, []]));
  if (orderedKeys.length) {
    const infoKeys = orderedKeys.flatMap(key => ['stage:' + key, 'note:' + key]);
    const [leads, saved] = await Promise.all([kv.get(orderedKeys, 'json'), kv.get(infoKeys, 'text')]);
    for (const key of orderedKeys) {
      const lead = leads.get(key);
      if (!lead) continue;
      if (key === selected) selectedVisible = true;
      const stage = saved.get('stage:' + key);
      const current = stages.has(stage) ? stage : 'novos';
      columns.get(current).push(card(key, lead, current, cursor, saved.get('note:' + key) || ''));
    }
  }
  const board = [...stages].map(([id, [label, color]]) => {
    const cards = columns.get(id);
    return `<section class="kanban-column crm-column" data-stage="${id}">
      <header class="col-header col-${color}"><h2 class="col-title-group col-title"><i class="dot-indicator"></i>${label}</h2>
      <span class="col-count">${cards.length}</span></header>
      <div class="col-cards-container"><p class="empty"${cards.length ? ' hidden' : ''}>Nenhum contato nesta etapa</p>${cards.join('')}</div></section>`;
  }).join('');
  const pagination = [
    cursor && '<a href="/crm/">Primeira página</a>',
    !page.list_complete && `<a href="?cursor=${encodeURIComponent(page.cursor)}">Próximos contatos →</a>`
  ].filter(Boolean).join(' ');
  const total = [...columns.values()].reduce((sum, items) => sum + items.length, 0);
  const metrics = [
    ['total', 'Contatos no painel', total, 'blue'],
    ['contato', 'Em contato', columns.get('contato').length, 'yellow'],
    ['proposta', 'Propostas enviadas', columns.get('proposta').length, 'purple'],
    ['fechado', 'Fechados', columns.get('fechado').length, 'green']
  ].map(([id, label, count, color]) => `<article class="crm-metric crm-metric--${color}"><span>${label}</span><strong data-count="${id}">${count}</strong></article>`).join('');
  const searchLabel = pagination ? 'Buscar nesta página' : 'Buscar contatos';
  return reply(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Contatos do Auditor | Lead Flow Studio</title><link rel="icon" href="/assets/optimized/logo-96.png"><link rel="stylesheet" href="/demo/style.css"><link rel="stylesheet" href="/demo/crm.css"><script src="/demo/crm.js" defer></script></head>
    <body class="crm"><div class="crm-layout">
      <aside class="crm-sidebar"><div class="crm-brand"><img width="36" height="36" src="/assets/optimized/logo-96.png" alt=""><span>Lead Flow <strong>Studio</strong></span></div>
        <nav aria-label="Área de trabalho"><a href="#quadro" aria-current="location">Funil comercial</a><a href="/ferramentas/auditor-ia/">Abrir Auditor ↗</a></nav>
        <p class="crm-access">Área privada · André Studio</p>
      </aside>
      <main><header class="crm-heading"><div><h1>Contatos do Auditor</h1><p>Acompanhe os leads da primeira conversa ao fechamento.</p></div>
      <details class="crm-new"><summary class="btn-add">+ Novo contato</summary>
        <form method="post"><input type="hidden" name="action" value="create">
          <label>Nome <input name="name" required minlength="2" maxlength="80"></label>
          <label>Empresa <input name="company" maxlength="100"></label>
          <label>WhatsApp com DDD <input name="phone" type="tel" maxlength="20"></label>
          <button type="submit" class="btn-add">Cadastrar contato</button>
        </form>
      </details></header>
      <section class="crm-metrics" aria-label="Indicadores${pagination ? ' desta página' : ''}">${metrics}</section>
      <section id="quadro" class="crm-workspace" aria-label="Funil comercial">
        <div class="crm-tools"><div><h2>Funil comercial</h2><p>Arraste os cartões ou use o seletor de etapa.</p></div>
        <div class="crm-filters" hidden><label>${searchLabel}<input type="search" placeholder="Nome, empresa ou telefone" id="crm-search"></label>
          <label>Origem<select id="crm-source"><option value="">Todas</option><option>Auditor IA</option><option>Manual</option></select></label></div></div>
        <p id="crm-status" role="status">${selected && !selectedVisible ? 'A lista pode levar alguns instantes para mostrar o novo contato.' : ''}</p>
        <div class="kanban-scroll-area"><div class="kanban-board">${board}</div></div>
        <nav class="crm-pagination" aria-label="Páginas de contatos">${pagination}</nav>
      </section>
    </main></div></body></html>`, 200, { 'Content-Type': 'text/html; charset=utf-8' });
}

async function createContact(form, kv) {
  const name = String(form.get('name') ?? '').trim();
  const company = String(form.get('company') ?? '').trim();
  const phone = String(form.get('phone') ?? '').trim();
  const enteredDigits = phone.replace(/\D/g, '');
  const digits = extractBrPhoneDigits(phone);
  const validLength = enteredDigits.length === digits.length || enteredDigits === '55' + digits;
  const validPhone = !phone || (/^[+\d ().-]+$/.test(phone) && validLength && /^[1-9]{2}\d{8,9}$/.test(digits));
  if (name.length < 2 || name.length > 80 || company.length > 100 || phone.length > 20 || !validPhone) {
    return reply('Revise o nome, a empresa e o WhatsApp com DDD.', 400);
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const lead = { id, createdAt, name, company, whatsappDigits: digits, whatsappFormatted: formatPhoneMaskBr(digits), source: 'manual' };
  const key = `lead:${createdAt}:${id}`;
  await kv.put(key, JSON.stringify(lead), { expirationTtl: retentionSeconds });
  return reply(null, 303, { Location: '/crm/?created=' + encodeURIComponent(key) });
}

export async function handleBoard(request, kv) {
  const url = new URL(request.url);
  if (request.method === 'GET') return showBoard(kv, (url.searchParams.get('cursor') || '').slice(0, 1024), url.searchParams.get('created') || '');
  if (request.method !== 'POST') return reply('Método inválido.', 405, { Allow: 'GET, POST' });
  if (request.headers.get('origin') !== url.origin) return reply('Origem inválida.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return reply('Formato inválido.', 415);
  const body = await request.text();
  if (body.length > 8192) return reply('Envio muito longo.', 413);
  const form = new URLSearchParams(body);
  const action = form.get('action') || 'stage';
  if (action === 'create') return createContact(form, kv);
  const key = form.get('key');
  const match = recordKey.exec(key);
  if (!match) return reply('Contato inválido.', 400);
  const lead = await kv.get(key, 'json');
  if (!lead || lead.id !== match[2] || lead.createdAt !== match[1]) return reply('Contato indisponível.', 404);
  const expiration = Math.floor(Date.parse(lead.createdAt) / 1000) + retentionSeconds;
  if (!Number.isFinite(expiration) || expiration <= Date.now() / 1000 + 60) return reply('O prazo deste contato terminou.', 410);
  if (action === 'stage' && stages.has(form.get('stage'))) {
    await kv.put('stage:' + key, form.get('stage'), { expiration });
  } else if (action === 'note' && (form.get('note') ?? '').length <= 500) {
    await kv.put('note:' + key, (form.get('note') || '').trim(), { expiration });
  } else {
    return reply('Revise a etapa ou a nota informada.', 400);
  }
  if (request.headers.get('accept') === 'application/json') return reply(null, 204);
  const cursor = (form.get('cursor') || '').slice(0, 1024);
  return reply(null, 303, { Location: cursor ? '/crm/?cursor=' + encodeURIComponent(cursor) : '/crm/' });
}
