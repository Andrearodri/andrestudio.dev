import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { onRequest } from '../functions/crm/index.js';

const origin = 'https://preview.example';
const auth = 'Basic ' + btoa('andre:password-for-test-only');
function setup() {
  const lead = { id: 'example-1', createdAt: new Date().toISOString(), name: 'Nome <teste>', company: 'Empresa', whatsappFormatted: '(11) 00000-0000' };
  const key = 'lead:' + lead.createdAt + ':' + lead.id;
  const values = new Map([[key, lead], ['auth:crm-password-sha256', createHash('sha256').update('password-for-test-only').digest('hex')]]);
  const writes = [];
  const kv = {
    list: async () => ({ keys: [{ name: key }], list_complete: true }),
    get: async k => Array.isArray(k) ? new Map(k.map(id => [id, values.get(id)])) : values.get(k),
    put: async (k,v,opts) => { writes.push(opts); values.set(k,v); }
  };
  function send(options, env = { LEADS_KV: kv, AUDITOR_CRM_ENABLED: '1' }) {
    return onRequest({ request: new Request(origin + '/crm/', options), env });
  }
  return { send, key, lead, writes };
}

test('Painel bloqueia leitura e gravação antes de consultar contatos', async () => {
  const { send } = setup();
  for (const method of ['GET', 'POST']) {
    for (const authorization of ['', 'Basic ???', 'Basic ' + btoa('andre:errada')]) {
      const res = await send({ method, headers: { authorization } });
      assert.equal(res.status, 401);
      assert.match(res.headers.get('cache-control'), /no-store/);
      assert.doesNotMatch(await res.text(), /Empresa/);
    }
  }
  assert.equal((await send({}, {})).status, 404);
});

test('Contato legado aparece em Novos, muda de etapa e preserva o vencimento original', async () => {
  const { send, key, lead, writes } = setup();
  const options = { headers: { authorization: auth } };
  const board = async () => (await send(options)).text();
  const inStage = (html, stage) => html.split('data-stage="'+stage+'"')[1].split('</section>')[0];
  assert.match(inStage(await board(), 'novos'), /Auditor IA[\s\S]*Nome &lt;teste&gt;/);
  const post = (from, params) => send({ method: 'POST', headers: { authorization: auth, origin: from }, body: new URLSearchParams(params) });
  assert.equal((await post('https://outro.example', { key, stage: 'contato' })).status, 403);
  assert.equal((await post(origin, { key: 'auth:crm-password-sha256', stage: 'contato' })).status, 400);
  assert.equal((await post(origin, { key, stage: 'desconhecido' })).status, 400);
  assert.equal((await post(origin, { key, stage: 'contato' })).status, 303);
  assert.equal(writes[0].expiration, Math.floor(Date.parse(lead.createdAt)/1000) + 180*86400);
  const reload = await board();
  assert.match(inStage(reload, 'contato'), /Nome &lt;teste&gt;/);
  assert.doesNotMatch(inStage(reload, 'novos'), /Nome &lt;teste&gt;/);
});
