const publications = [
  {key:'simon', label:'Simon Willison', domains:['simonwillison.net']},
  {key:'ethan', label:'Ethan Mollick', domains:['www.oneusefulthing.org','oneusefulthing.org']},
  {key:'epoch', label:'Epoch AI', domains:['epoch.ai']},
  {key:'openai', label:'OpenAI', domains:['openai.com']}
];

async function latest(source) {
  const response = await fetch('/api/radar?fonte=' + source.key);
  if (!response.ok) return null;
  const feed = new DOMParser().parseFromString(await response.text(), 'application/xml');
  const stories = [];
  for (const node of feed.querySelectorAll('item, entry')) {
    const link = node.querySelector('link[rel="alternate"],link:not([rel])');
    const href = link?.getAttribute('href') || link?.textContent.trim();
    if (!href || !URL.canParse(href)) continue;
    const url = new URL(href);
    if (!['http:', 'https:'].includes(url.protocol) || !source.domains.includes(url.hostname)) continue;
    url.protocol = 'https:';
    const title = node.querySelector('title')?.textContent.trim();
    const date = new Date(node.querySelector('published, pubDate')?.textContent || node.querySelector('updated')?.textContent);
    if (title && Number.isFinite(+date)) stories.push({href:url.href, title, date, label:source.label});
  }
  return stories.sort((a,b) => b.date - a.date)[0];
}

async function updateRadar() {
  const list = document.querySelector('[data-radar]');
  if (!list) return;
  const results = await Promise.allSettled(publications.map(latest));
  const stories = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
  if (!stories.length) return;
  const format = new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Fortaleza'});
  const cards = stories.sort((a,b) => b.date - a.date).map(story => {
    const li = document.createElement('li');
    const meta = document.createElement('time');
    meta.dateTime = story.date.toISOString();
    meta.textContent = story.label + ' · ' + format.format(story.date) + ' (Fortaleza)';
    const a = document.createElement('a');
    a.href = story.href;
    a.textContent = story.title;
    li.append(meta,a);
    return li;
  });
  list.replaceChildren(...cards);
}
updateRadar();
