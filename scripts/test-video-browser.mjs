// Requires an existing local server and playwright-core; no install or external actions.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.PLAYWRIGHT_MODULE;
if (!modulePath) throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs');
const { chromium } = await import(pathToFileURL(modulePath));
const base = process.env.PUBLIC_TEST_BASE || 'http://127.0.0.1:8765';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const output = process.env.QA_OUTPUT || '/private/tmp/andrestudio-roadmap-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', request => requests.push(request.url()));
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(event.violatedDirective));
  });
  await page.goto(`${base}/ferramentas/brief-para-video/`);
  await page.getByRole('button', { name: 'Experimentar com um exemplo' }).click();
  await page.locator('#plan-result').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.scene').count(), 5);
  assert.equal(await page.locator('.timecode').first().innerText(), '0–3s');
  assert.match(await page.locator('#result-meta').innerText(), /30s/);
  let url = new URL(await page.locator('#share-whatsapp').getAttribute('href'));
  assert.equal(url.hostname, 'wa.me');
  assert.match(url.searchParams.get('text'), /cafeteria/);
  const firstShotCount = await page.locator('#shot-count').innerText();
  await page.locator('#duration').selectOption('45');
  assert.equal(await page.locator('#share-whatsapp').getAttribute('href'), null);
  assert.ok(await page.locator('#download-button').isDisabled());
  await page.getByRole('button', { name: 'Gerar plano de gravação' }).click();
  assert.match(await page.locator('#result-meta').innerText(), /45s/);
  assert.notEqual(await page.locator('#shot-count').innerText(), firstShotCount);
  assert.match(await page.locator('.timecode').last().innerText(), /45s$/);
  await page.locator('#scene-1-voice').fill('Esta fala foi revisada pelo usuário.');
  assert.match(await page.locator('#markdown-output').inputValue(), /revisada pelo usuário/);
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#download-button').click();
  const download = await downloadEvent;
  assert.match(download.suggestedFilename(), /^plano-.*\.md$/);
  assert.match(await readFile(await download.path(), 'utf8'), /revisada pelo usuário/);
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  await page.locator('#copy-button').click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /revisada pelo usuário/);
  // The full document is printable, not just the visible portion of textareas.
  await page.emulateMedia({ media: 'print' });
  assert.ok(await page.locator('#print-plan').isVisible());
  assert.match(await page.locator('#print-plan').innerText(), /revisada pelo usuário/);
  await page.pdf({ path: `${output}/plano-impresso.pdf`, format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/ferramenta-desktop.png`, fullPage: true });
  const payload = '<img src=x onerror="window.xssExecuted=1">';
  await page.locator('#project').fill(payload);
  await page.locator('#restrictions').fill('Não usar dados de clientes & preço não confirmado.');
  await page.getByRole('button', { name: 'Gerar plano de gravação' }).click();
  assert.equal(await page.locator('#result-title').innerText(), payload);
  assert.equal(await page.locator('#result-title img').count(), 0);
  assert.equal(await page.evaluate(() => window.xssExecuted), undefined);
  url = new URL(await page.locator('#share-whatsapp').getAttribute('href'));
  assert.ok(url.searchParams.get('text').includes(payload));
  assert.ok(url.searchParams.get('text').includes('preço não confirmado'));
  assert.equal(await page.evaluate(() => sessionStorage.length), 0);
  assert.ok((await page.evaluate(() => Object.keys(localStorage))).every(key => !/brief|plan|project/i.test(key)));
  assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
  assert.ok(!requests.some(request => /wa\.me|pay\.kiwify|\/api\//.test(request)), 'Sharing and API must not run automatically');
  await page.reload();
  assert.ok(await page.locator('#plan-result').isHidden());
  assert.equal(await page.locator('#project').inputValue(), '');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/kits/', '/kits/video-pronto/', '/kits/video-pronto/amostra/', '/ferramentas/', '/ferramentas/brief-para-video/']) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200, route);
      if (route.includes('brief-para-video')) await page.locator('#example-button').click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${route} overflows by ${overflow}px at width ${width}`);
      assert.deepEqual(await page.evaluate(() => window.cspViolations), [], route);
      if (width === 390 && route.includes('brief-para-video')) {
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${output}/ferramenta-mobile.png`, fullPage: true });
      }
      if (width === 1440 && route === '/kits/video-pronto/') await page.screenshot({ path: `${output}/kit-desktop.png`, fullPage: true });
    }
  }
  await page.goto(`${base}/kits/video-pronto/`);
  assert.equal(await page.locator('#checkout-button').getAttribute('aria-disabled'), 'true');
  assert.equal(await page.locator('#checkout-button').getAttribute('href'), null);
  const pilot = new URL(await page.locator('#pilot-button').getAttribute('href'));
  assert.match(pilot.searchParams.get('text'), /10 primeiros/);
  assert.match(pilot.searchParams.get('text'), /R\$ 97/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/ferramentas/brief-para-video/`);
  await page.locator('#example-button').click();
  await page.locator('#theme-toggle').click();
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${output}/ferramenta-light.png`, fullPage: true });
  assert.equal(errors.length, 0, errors.join('\n'));
  for (const route of ['/content/paid/video-pronto/GUIA_VIDEO_PRONTO.pdf', '/.env.example', '/ROADMAP_ESTRATEGICO.md', '/api/briefings/gerar']) {
    const response = await page.request.get(base + route); assert.equal(response.status(), 404, route);
  }
  console.log('Browser checks PASS: timing, editing, WhatsApp, exports, clipboard, print, XSS, privacy, CSP, checkout, 5 viewport sizes and private assets.');
} finally { await browser.close(); }
