const feeds = new Map([
  ['openai', 'https://openai.com/news/rss.xml'],
  ['simon', 'https://simonwillison.net/atom/everything/'],
  ['ethan', 'https://www.oneusefulthing.org/feed'],
  ['epoch', 'https://epoch.ai/atom.xml']
]);
export async function onRequestGet({ request, waitUntil }) {
  const cache = globalThis.caches?.default;
  const source = new URL(request.url).searchParams.get('fonte') || 'openai';
  if (!feeds.has(source)) return new Response(null, {status: 404});
  const key = new URL('/api/radar?fonte=' + source, request.url).href;
  const cached = await cache?.match(key);
  if (cached) return cached;
  try {
    const feed = await fetch(feeds.get(source), {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/rss+xml, application/xml' }
    });
    if (!feed.ok) throw new Error('Feed unavailable');
    const xml = await feed.text();
    if (!xml.includes('</item>') && !xml.includes('</entry>')) throw new Error('Invalid feed');
    const response = new Response(xml, {headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox"
    }});
    if (cache && waitUntil) waitUntil(cache.put(key, response.clone()));
    return response;
  } catch {
    return new Response(null, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
