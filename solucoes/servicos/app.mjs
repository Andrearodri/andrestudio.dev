import { AREAS, ORDEM } from './areas.mjs';

const WHATSAPP = '5598981483900';

export function areaDaUrl(search) {
  const a = new URLSearchParams(search).get('area');
  return a && AREAS[a] ? a : 'advocacia';
}

function iniciar() {
  const botoes = [...document.querySelectorAll('[data-area]')];
  const campos = [...document.querySelectorAll('[data-campo]')];
  const ctas = [...document.querySelectorAll('[data-whatsapp]')];
  if (!botoes.length) return;

  function mostrar(chave, atualizarUrl) {
    const area = AREAS[chave];
    for (const c of campos) c.textContent = area[c.dataset.campo];
    for (const b of botoes) b.setAttribute('aria-pressed', String(b.dataset.area === chave));
    const msg = `Olá, André! Vi a página de soluções para ${area.titulo.toLowerCase()} e quero entender como ficaria no meu negócio.`;
    for (const a of ctas) a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    if (atualizarUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('area', chave);
      window.history.replaceState(null, '', url);
    }
  }

  for (const b of botoes) b.addEventListener('click', () => mostrar(b.dataset.area, true));
  mostrar(areaDaUrl(window.location.search), false);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
}

export { ORDEM };
