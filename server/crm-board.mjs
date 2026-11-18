const stages = new Map([
  ['novos', ['Novos Leads', 'blue']],
  ['contato', ['Em Contato', 'yellow']],
  ['proposta', ['Proposta Enviada', 'purple']],
  ['fechado', ['Fechado', 'green']]
]);

const recordKey = /^lead:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z):([a-zA-Z0-9-]{1,80})$/;
const retentionSeconds = 180 * 24 * 60 * 60;

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
    'Content-Security-Policy': "default-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    ...headers
  } });
}

function card(key, lead, stage, cursor) {
  const options = [...stages].map(([id, [label]]) =>
    `<option value="${id}" ${id === stage ? 'selected' : ''}>${label}</option>`).join('');
  return `<article class="lead-card">
    <p class="tag">Auditor IA</p><h3>${escape(lead.name)}</h3>
    <p>${escape(lead.company)}</p><p class="card-company">${escape(lead.whatsappFormatted)}</p>
    <form method="post"><input type="hidden" name="key" value="${escape(key)}">
    <input type="hidden" name="cursor" value="${escape(cursor)}">
    <label>Etapa <select name="stage">${options}</select></label>
    <button type="submit" aria-label="Salvar etapa de ${escape(lead.name)}">Salvar</button></form></article>`;
}

async function showBoard(kv, cursor) {
  const page = await kv.list({ prefix: 'lead:', limit: 30, ...(cursor && { cursor }) });
  const keys = page.keys.map(k => k.name).filter(key => recordKey.test(key));
  const columns = new Map([...stages.keys()].map(id => [id, []]));
  if (keys.length) {
    const statusKeys = keys.map(key => 'stage:' + key);
    const [leads, saved] = await Promise.all([kv.get(keys, 'json'), kv.get(statusKeys, 'text')]);
    for (const key of keys) {
      const lead = leads.get(key);
      if (!lead) continue;
      const stage = saved.get('stage:' + key) || 'novos';
      if (!columns.has(stage)) throw new Error('Etapa inválida no armazenamento.');
      columns.get(stage).push(card(key, lead, stage, cursor));
    }
  }
  const board = [...stages].map(([id, [label, color]]) => {
    const cards = columns.get(id);
    return `<section class="kanban-column" data-stage="${id}">
      <header class="col-header col-${color}"><h2 class="col-title-group col-title"><i class="dot-indicator"></i>${label}</h2>
      <span class="col-count">${cards.length}</span></header>
      <div class="col-cards-container">${cards.join('') || '<p class="empty">Nenhum contato</p>'}</div></section>`;
  }).join('');
  const next = page.list_complete ? '' : `<a href="?cursor=${encodeURIComponent(page.cursor)}">Próximos contatos →</a>`;
  return reply(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Contatos do Auditor | Lead Flow Studio</title><link rel="stylesheet" href="/demo/style.css"><link rel="stylesheet" href="/demo/crm.css"></head>
    <body class="crm"><main><header class="crm-heading"><div><p>Lead Flow Studio</p><h1>Contatos do Auditor</h1></div><a href="/crm/">Atualizar quadro</a></header>
    <div class="kanban-scroll-area"><div class="kanban-board">${board}</div></div>
    <nav aria-label="Páginas de contatos">${cursor ? '<a href="/crm/">Primeira página</a>' : ''} ${next}</nav></main></body></html>`,
    200, { 'Content-Type': 'text/html; charset=utf-8' });
}

export async function handleBoard(request, kv) {
  const url = new URL(request.url);
  if (request.method === 'GET') return showBoard(kv, url.searchParams.get('cursor') || '');
  if (request.method !== 'POST') return reply('Método inválido.', 405, { Allow: 'GET, POST' });
  if (request.headers.get('origin') !== url.origin) return reply('Origem inválida.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return reply('Formato inválido.', 415);
  const form = await request.formData();
  const key = form.get('key');
  const stage = form.get('stage');
  const match = recordKey.exec(key);
  if (!match || !stages.has(stage)) return reply('Contato ou etapa inválida.', 400);
  const lead = await kv.get(key, 'json');
  if (!lead || lead.id !== match[2] || lead.createdAt !== match[1]) return reply('Contato indisponível.', 404);
  const expiration = Math.floor(Date.parse(lead.createdAt) / 1000) + retentionSeconds;
  if (expiration <= Date.now() / 1000 + 60) return reply('O prazo deste contato terminou.', 410);
  await kv.put('stage:' + key, stage, { expiration });
  const cursor = form.get('cursor');
  return reply(null, 303, { Location: cursor ? '/crm/?cursor=' + encodeURIComponent(cursor) : '/crm/' });
}
