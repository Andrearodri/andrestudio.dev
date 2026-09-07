#!/usr/bin/env node
/* Browser validation through Chrome DevTools Protocol. Run with local server and Chrome. */
const assert = require('node:assert/strict');

const BASE = process.env.PUBLIC_TEST_BASE || 'http://127.0.0.1:8765';
const CDP = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
const PAYLOAD = '<svg onload="window.__AUDIT_MARKER=1">"quoted"</svg>';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const pages = await (await fetch(`${CDP}/json/list`)).json();
  const page = pages.find(item => item.type === 'page' && item.webSocketDebuggerUrl);
  assert(page, 'Chrome DevTools page target not found');

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  const consoleErrors = [];
  let commandId = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
      consoleErrors.push(message.params.args?.map(argument => argument.value ?? argument.description ?? '').join(' ') || 'console.error');
    }
    if (message.id && pending.has(message.id)) {
      const resolve = pending.get(message.id);
      pending.delete(message.id);
      resolve(message);
    }
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, message => message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result));
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'browser evaluation failed');
    return result.result.value;
  };

  await command('Page.enable');
  await command('Runtime.enable');
  await command('Page.addScriptToEvaluateOnNewDocument', { source: `
    globalThis.__validation = { violations: [], errors: [] };
    addEventListener('securitypolicyviolation', event => __validation.violations.push({blockedURI: event.blockedURI, directive: event.violatedDirective}));
    addEventListener('error', event => __validation.errors.push(String(event.message || event.error)));
    addEventListener('unhandledrejection', event => __validation.errors.push(String(event.reason)));
  ` });

  const results = [];
  const navigate = async (path) => {
    await command('Page.navigate', { url: BASE + path });
    await wait(1000);
  };
  const run = async (name, path, expression) => {
    await navigate(path);
    const result = await evaluate(expression);
    const diagnostics = await evaluate('({violations: __validation.violations, errors: __validation.errors})');
    assert.equal(diagnostics.violations.length, 0, `${name}: CSP violations: ${JSON.stringify(diagnostics.violations)}`);
    assert.equal(diagnostics.errors.length, 0, `${name}: page errors: ${JSON.stringify(diagnostics.errors)}`);
    assert.equal(consoleErrors.length, 0, `${name}: console errors: ${JSON.stringify(consoleErrors)}`);
    results.push({name, path, ...result});
  };

  await command('Emulation.setDeviceMetricsOverride', {width: 1440, height: 900, deviceScaleFactor: 1, mobile: false});

  const payload = JSON.stringify(PAYLOAD);
  const common = `
    const payload = ${payload};
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const noMarkup = node => {
      assert(node && node.textContent.includes(payload), 'payload not preserved as text');
      assert(!node.querySelector('svg[onload], [onerror], script'), 'payload created executable markup');
    };
  `;

  await run('home desktop/theme/navigation/video', '/', `(() => {${common}
    const toggle = document.getElementById('theme-toggle');
    const before = document.documentElement.getAttribute('data-theme') || 'dark';
    assert(document.querySelector('a[href="/portfolio/"]'), 'portfolio navigation missing');
    assert(document.querySelector('link[href*="fonts.googleapis.com"]'), 'font link missing');
    assert(document.querySelector('video'), 'home video missing');
    toggle.click();
    assert((document.documentElement.getAttribute('data-theme') || 'dark') !== before, 'theme did not toggle');
    const viewportWidth = visualViewport?.width || document.documentElement.clientWidth;
    return {width: viewportWidth, overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth), storedTheme: localStorage.getItem('theme')};
  })()`);

  await run('lead-flow seven-path subset', '/demo/', `(() => {${common}
    const set = (id, value) => { const node = document.getElementById(id); assert(node, id + ' missing'); node.value = value; };
    set('lead-name', payload); set('lead-company', payload); set('lead-value', '100');
    document.getElementById('form-new-lead').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    const card = [...document.querySelectorAll('.lead-card')].find(node => node.textContent.includes(payload));
    noMarkup(card.querySelector('.client-name')); noMarkup(card.querySelector('.card-company'));
    noMarkup(document.querySelector('#toast-container .toast:last-child'));
    set('wa-input-text', payload); document.getElementById('wa-btn-send').click();
    noMarkup(document.querySelector('#wa-message-history .wa-bubble.sent:last-child'));
    const viewportWidth = visualViewport?.width || document.documentElement.clientWidth;
    return {width: viewportWidth, overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth)};
  })()`);

  await run('agenda seven-path subset', '/portfolio/agenda-cheia-slz-demo/', `(() => {${common}
    openDemoSystem('kanban');
    const set = (id, value) => { const node = document.getElementById(id); assert(node, id + ' missing'); node.value = value; };
    set('lead-name', payload); set('lead-service', payload); set('lead-price', '100');
    document.getElementById('new-lead-form').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    const card = [...document.querySelectorAll('.kanban-card')].find(node => node.textContent.includes(payload)); noMarkup(card);
    showPage('mensagens'); set('chat-text-input', payload); document.querySelector('[data-action="send-chat"]').click();
    noMarkup(document.querySelector('#chat-messages-body .chat-bubble.sent:last-child'));
    const viewportWidth = visualViewport?.width || document.documentElement.clientWidth;
    return {width: viewportWidth, overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth)};
  })()`);

  await run('omniagent input/reflected response', '/portfolio/omniagent-ai-demo/', `(async () => {${common}
    const input = document.getElementById('custom-user-input'); input.value = payload;
    document.getElementById('chat-form').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    await new Promise(resolve => setTimeout(resolve, 900));
    const user = [...document.querySelectorAll('.chat-row.user .bubble')].pop();
    const answer = [...document.querySelectorAll('.chat-row.ai .bubble')].pop();
    noMarkup(user.lastElementChild); noMarkup(answer.lastElementChild);
    assert(!answer.lastElementChild.querySelector('strong, em'), 'reflected input altered author markup');
    const viewportWidth = visualViewport?.width || document.documentElement.clientWidth;
    return {width: viewportWidth, overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth)};
  })()`);

  await run('cardapio local checkout/CTA', '/portfolio/cardapio-digital-demo/', `(() => {${common}
    document.querySelector('[data-action="add"][data-id="1"]').click();
    document.getElementById('cart-float').click(); document.getElementById('btn-checkout').click();
    document.getElementById('customer-name').value = payload;
    document.getElementById('customer-address').value = payload;
    document.getElementById('customer-notes').value = payload;
    document.getElementById('btn-whatsapp').click();
    assert(document.getElementById('success-overlay').textContent.includes('Simulação concluída'), 'checkout is not local simulation');
    assert(!location.href.includes('wa.me'), 'checkout navigated to WhatsApp');
    assert(!performance.getEntriesByType('resource').some(entry => entry.name.includes('wa.me')), 'checkout requested WhatsApp');
    assert(!document.querySelector('.demo-banner-cta').href.includes(encodeURIComponent(payload)), 'CTA includes checkout fields');
    const viewportWidth = visualViewport?.width || document.documentElement.clientWidth;
    return {width: viewportWidth, overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth)};
  })()`);

  await command('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: true});
  for (const path of ['/', '/demo/', '/portfolio/agenda-cheia-slz-demo/', '/portfolio/cardapio-digital-demo/', '/portfolio/omniagent-ai-demo/']) {
    await navigate(path);
    const mobile = await evaluate('({path: location.pathname, width: visualViewport?.width || document.documentElement.clientWidth, layoutWidth: document.documentElement.clientWidth, overflow: Math.max(0, document.documentElement.scrollWidth - (visualViewport?.width || document.documentElement.clientWidth))})');
    results.push({name: 'mobile layout', ...mobile});
  }
  await command('Emulation.clearDeviceMetricsOverride');

  console.log(JSON.stringify({results, diagnostics: await evaluate('({violations: __validation.violations, errors: __validation.errors})'), consoleErrors}, null, 2));
  socket.close();
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
