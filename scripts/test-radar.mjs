import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/radar.js';

test('Radar rejects arbitrary sources without making a network request', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('unexpected network request'); };
  try {
    for (const source of ['https://internal.invalid/', '__proto__', 'unknown']) {
      const request = new Request('https://site.invalid/api/radar?fonte=' + encodeURIComponent(source));
      assert.equal((await onRequestGet({ request })).status, 404);
    }
  } finally { globalThis.fetch = original; }
});

test('Radar uses the fixed feed URL and serves XML with restrictive headers', async () => {
  const original = globalThis.fetch;
  let requested;
  globalThis.fetch = async url => {
    requested = url;
    return new Response('<rss><channel><item><title>Example</title></item></channel></rss>');
  };
  try {
    const response = await onRequestGet({ request: new Request('https://site.invalid/api/radar?fonte=epoch') });
    assert.equal(response.status, 200);
    assert.equal(requested, 'https://epoch.ai/atom.xml');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('content-security-policy'), "default-src 'none'; sandbox");
    assert.match(response.headers.get('content-type'), /xml/);
  } finally { globalThis.fetch = original; }
});

test('Radar fails closed on malformed or unavailable feeds', async () => {
  const original = globalThis.fetch;
  try {
    for (const body of ['<html>unavailable</html>', '']) {
      globalThis.fetch = async () => new Response(body);
      const response = await onRequestGet({ request: new Request('https://site.invalid/api/radar') });
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.equal((await onRequestGet({ request: new Request('https://site.invalid/api/radar') })).status, 503);
  } finally { globalThis.fetch = original; }
});
