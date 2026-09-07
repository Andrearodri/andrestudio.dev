#!/usr/bin/env node
/* Focused, dependency-free regression checks for AS-01..AS-05. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const must = (condition, message) => assert.ok(condition, message);

const demo = read('demo/app.js');
must(demo.includes('clientName.textContent = lead.name'), 'Lead name uses textContent');
must(demo.includes('company.textContent = `🏢 ${lead.company}`'), 'Lead company uses textContent');
must(demo.includes('message.textContent = text'), 'Lead chat uses textContent');
must(demo.includes('text.textContent = message'), 'Lead toast uses textContent');
must(demo.includes('btnWa.dataset.waName = lead.name'), 'WhatsApp name uses dataset property');
must(!demo.includes('data-wa-name="${lead.name}"'), 'Lead name is not interpolated into an HTML attribute');

const agendaHtml = read('portfolio/agenda-cheia-slz-demo/index.html');
const agenda = read('portfolio/agenda-cheia-slz-demo/app.js');
must(!/(?:onclick|onchange|onsubmit|onkeypress)\s*=/.test(agendaHtml), 'Agenda has no inline event handlers');
must(agenda.includes('name.textContent = item.name'), 'Agenda lead name uses textContent');
must(agenda.includes('service.textContent = item.service'), 'Agenda service uses textContent');
must(agenda.includes('appendSafeChatText(bubble, message.text)'), 'Agenda chat isolates visitor text from HTML');
must(agenda.includes('text.textContent = part'), 'Agenda chat writes each message fragment with textContent');

const omni = read('portfolio/omniagent-ai-demo/app.js');
must(omni.includes('content.textContent = textContent'), 'OmniAgent chat text uses textContent');
must(omni.includes('metaOrigin.textContent'), 'OmniAgent metadata uses textContent');
must(omni.includes('appendMessage(\'ai\', `Compreendo perfeitamente sua dúvida sobre "${text}".'), 'OmniAgent simulated answer no longer creates markup around visitor text');
must(omni.includes('message.textContent = msg'), 'OmniAgent toast uses textContent');
must(omni.includes('code.textContent = formatted'), 'OmniAgent JSON preview uses textContent');

const checkout = read('portfolio/cardapio-digital-demo/app.js');
const checkoutHtml = read('portfolio/cardapio-digital-demo/index.html');
must(!checkout.includes('window.open'), 'Checkout has no external navigation');
must(!checkout.includes('WHATSAPP_NUMBER'), 'Checkout has no commercial recipient constant');
must(checkout.includes('successOverlay.dataset.simulation'), 'Checkout records a local simulation only');
must(checkoutHtml.includes('Esta demonstração usa dados fictícios e não envia mensagens.'), 'Checkout identifies local simulation');
must(checkoutHtml.includes('Simulação concluída'), 'Success copy does not claim a real send');

const headers = read('_headers');
must(headers.includes('Content-Security-Policy:'), 'Pages CSP is enforcement mode');
must(!headers.includes('Content-Security-Policy-Report-Only:'), 'Pages does not rely on Report-Only');
must(/script-src 'self'(?:;|\s)/.test(headers), 'CSP script source excludes unsafe inline scripts');
must(read('deploy/nginx/andrestudio.dev.br.conf').includes('add_header Content-Security-Policy '), 'Maintained Nginx template has enforcement CSP');
must(!read('deploy/nginx/andrestudio.dev.br.conf').includes('Content-Security-Policy-Report-Only'), 'Maintained Nginx template does not use Report-Only');

const inventory = JSON.parse(read('build/public-inventory.json'));
must(inventory.file_count === inventory.files.length, 'Inventory count matches entries');
for (const entry of inventory.files) {
  must(!/^(?:\.agents|\.git|\.vscode|deploy|docs|tmp|content|build)\//.test(entry.path), `Internal path excluded: ${entry.path}`);
}
for (const expected of ['_headers', '_redirects', '.well-known/security.txt', 'theme.js']) {
  must(inventory.files.some((entry) => entry.path === expected), `Required public file included: ${expected}`);
}
for (const page of [
  'index.html', 'portfolio/index.html', 'blog/index.html', 'servicos/index.html',
  'sobre/index.html', 'contato/index.html', 'privacidade/index.html',
  'demo/index.html', 'portfolio/agenda-cheia-slz-demo/index.html',
  'portfolio/cardapio-digital-demo/index.html', 'portfolio/omniagent-ai-demo/index.html'
]) {
  must(inventory.files.some((entry) => entry.path === page), `Primary/demo page included: ${page}`);
}
for (const media of ['assets/hero-video.mp4', 'assets/object_disassembling.mp4']) {
  must(inventory.files.some((entry) => entry.path === media), `Video asset included: ${media}`);
}
must(read('style.css').includes('@media'), 'Main stylesheet retains responsive rules');
must(read('portfolio/agenda-cheia-slz-demo/styles.css').includes('@media'), 'Agenda stylesheet retains responsive rules');
must(read('portfolio/cardapio-digital-demo/style.css').includes('@media'), 'Cardapio stylesheet retains responsive rules');
must(read('portfolio/omniagent-ai-demo/style.css').includes('@media'), 'OmniAgent stylesheet retains responsive rules');

console.log(`Security regression checks: PASS (${inventory.file_count} inventoried public files)`);
