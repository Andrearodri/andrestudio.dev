import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatePlan, countWords, planToMarkdown, whatsappUrl, whatsappSummary, OBJECTIVES } from '../ferramentas/brief-para-video/engine.mjs';
import { approvedCheckoutUrl, pilotWhatsappUrl } from '../data/commerce.mjs';

const input = { project: 'Café & pão — São Luís', objective: 'vender', duration: 30, format: '9:16', offer: 'Café preparado na hora', audience: 'Pessoas da região', action: 'Consultar endereço', restrictions: 'Não mostrar clientes', materials: 'Filmagens próprias' };
for (const objective of Object.keys(OBJECTIVES)) for (const duration of [15, 30, 45, 60]) for (const format of ['9:16', '1:1', '16:9']) {
  test(`Complete, contiguous timeline: ${objective}, ${duration}s, ${format}`, () => {
    const p = generatePlan({ ...input, objective, duration, format });
    assert.equal(p.scenes[0].start, 0); assert.equal(p.scenes[0].end, duration === 15 ? 2 : 3);
    assert.equal(p.scenes.at(-1).end, duration);
    let cursor = 0;
    for (const scene of p.scenes) {
      assert.equal(scene.start, cursor);
      for (const cut of scene.cuts) {
        assert.equal(cut.start, cursor);
        assert.ok([2, 3].includes(cut.end - cut.start)); cursor = cut.end;
      }
      assert.equal(cursor, scene.end);
    }
    assert.equal(cursor, duration);
    assert.ok(p.voiceWords > 10 && p.voiceWords < duration * 3);
    assert.equal(p.voiceWords, p.scenes.reduce((sum, s) => sum + s.wordBudget, 0));
  });
}
test('Longer videos allow more voice; goals change guidance and pacing', () => {
  assert.ok(generatePlan({ ...input, duration: 45 }).voiceWords > generatePlan(input).voiceWords);
  const teaching = generatePlan({ ...input, objective: 'ensinar' });
  const selling = generatePlan(input);
  assert.notDeepEqual(teaching.broll, selling.broll);
  assert.notDeepEqual(teaching.sfx, selling.sfx);
  assert.notEqual(teaching.voiceWords, selling.voiceWords);
});
test('Incomplete briefs identify all gaps and at most three priority questions', () => {
  const p = generatePlan({ project: 'Teste', objective: 'ensinar', duration: 30, format: '1:1' });
  assert.equal(p.gaps.length, 5); assert.equal(p.questions.length, 3);
  assert.match(planToMarkdown(p), /A confirmar/);
});
test('Invalid choices and inherited object properties fail closed', () => {
  for (const change of [{ objective: 'constructor' }, { objective: '__proto__' }, { duration: 0 }, { duration: 90 }, { format: 'constructor' }, { project: ' ' }]) assert.throws(() => generatePlan({ ...input, ...change }));
});
test('Unicode voice counting, edited exports and safe user input', () => {
  assert.equal(countWords('Olá, São Luís! Café & pão.'), 5);
  const p = generatePlan({ ...input, project: '<img src=x onerror=alert(1)>', offer: 'Preço a confirmar\nNão prometer desconto' });
  p.scenes[1].voice = 'Esta fala foi revisada.';
  assert.match(planToMarkdown(p), /Esta fala foi revisada/);
  assert.ok(planToMarkdown(p).includes('<img src=x onerror=alert(1)>'));
  assert.equal(new URL(whatsappUrl(p)).hostname, 'wa.me');
});
test('WhatsApp encodes a structured brief without auto-send or checkout data', () => {
  const p = generatePlan(input); const url = new URL(whatsappUrl(p));
  assert.equal(url.protocol, 'https:'); assert.equal(url.pathname, '/5598981483900');
  assert.equal(url.searchParams.get('text'), whatsappSummary(p));
  for (const text of [input.project, input.offer, input.audience, input.restrictions, '30s', '0–3s']) assert.ok(url.searchParams.get('text').includes(text));
  const long = generatePlan({ ...input, materials: 'á'.repeat(600), restrictions: 'a'.repeat(600) });
  assert.ok(whatsappSummary(long).length < 1800);
  assert.match(whatsappSummary(long), /…/);
});
test('Checkout remains disabled until explicit activation and an approved URL', () => {
  assert.equal(approvedCheckoutUrl(), null);
  for (const checkoutUrl of ['javascript:alert(1)', 'http://pay.kiwify.com.br/abc', 'https://pay.kiwify.com.br.evil.test/abc', 'https://user:password@pay.kiwify.com.br/abc', 'https://pay.kiwify.com.br/', 'https://pay.kiwify.com.br:8080/abc']) assert.equal(approvedCheckoutUrl({ checkoutUrl, checkoutEnabled: true }), null);
  assert.equal(approvedCheckoutUrl({ checkoutEnabled: false, checkoutUrl: 'https://pay.kiwify.com.br/test' }), null);
  assert.equal(approvedCheckoutUrl({ checkoutEnabled: true, checkoutUrl: 'https://pay.kiwify.com.br/test' }), 'https://pay.kiwify.com.br/test');
  const message = new URL(pilotWhatsappUrl()).searchParams.get('text');
  assert.match(message, /R\$ 97/); assert.match(message, /10 primeiros/); assert.match(message, /Pix/);
});
test('Public inventory contains only free materials, never paid assets or env', async () => {
  const inventory = JSON.parse(await readFile(new URL('../build/public-inventory.json', import.meta.url)));
  assert.ok(inventory.files.some(f => f.path === 'assets/recursos/checklist-briefing.pdf'));
  for (const file of inventory.files) assert.doesNotMatch(file.path, /(^|\/)(content|paid|private|docs|api|\.env[^/]*)($|\/)|ROADMAP_ESTRATEGICO/);
  const app = await readFile(new URL('../ferramentas/brief-para-video/app.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /innerHTML|localStorage|sessionStorage|fetch\(/);
});
