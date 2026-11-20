// Demonstração do Scout: ranqueia anúncios FICTÍCIOS com a mesma conta de nota usada na
// ferramenta real (que roda no computador do AndreStudio, não neste site).
import { NICHOS } from './dados.mjs';

const PESOS = { dias: 35, pagina: 25, variacoes: 25, novos: 15 };
const TETO_DIAS = 365;
const TETO_VARIACOES = 20;
const WHATSAPP = '5598981483900';

const logDias = (d) => Math.log1p(Math.min(Math.max(d || 0, 0), TETO_DIAS));

function percentil(valor, todos) {
  const n = todos.length;
  if (n <= 1) return [1, 100];
  const menores = todos.filter((v) => v < valor).length;
  const iguais = todos.filter((v) => v === valor).length;
  const maiores = n - menores - iguais;
  return [(menores + (iguais - 1) / 2) / (n - 1), Math.ceil((100 * (maiores + iguais)) / n)];
}

export function ranquear(anuncios) {
  const logs = anuncios.map((a) => logDias(a.dias));
  const maxAtivos = Math.max(...anuncios.map((a) => a.ativosPagina));
  const maxNovos = Math.max(...anuncios.map((a) => a.novos14));
  return anuncios
    .map((a) => {
      const [pDias, top] = percentil(logDias(a.dias), logs);
      const pPagina = maxAtivos ? Math.log1p(a.ativosPagina) / Math.log1p(maxAtivos) : 0;
      const pVar = Math.log(Math.min(Math.max(a.variacoes, 1), TETO_VARIACOES)) / Math.log(TETO_VARIACOES);
      const pNovos = maxNovos ? Math.log1p(a.novos14) / Math.log1p(maxNovos) : 0;
      const nota = Math.min(100, Math.round(PESOS.dias * pDias + PESOS.pagina * pPagina + PESOS.variacoes * pVar + PESOS.novos * pNovos));
      return { ...a, nota, top };
    })
    .sort((x, y) => y.nota - x.nota);
}

function el(tag, props = {}, ...filhos) {
  const n = document.createElement(tag);
  Object.assign(n, props);
  for (const f of filhos) if (f !== null && f !== undefined) n.append(f);
  return n;
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

function faixa(nota) {
  return nota >= 70 ? 'alta' : nota >= 40 ? 'media' : 'baixa';
}

function iniciar() {
  const lista = document.getElementById('scout-lista');
  const detalhe = document.getElementById('scout-detalhe');
  const lacunas = document.getElementById('scout-lacunas');
  const roteiro = document.getElementById('scout-roteiro');
  const botoes = [...document.querySelectorAll('[data-nicho]')];
  const pedir = document.getElementById('scout-pedir');
  if (!lista || !detalhe) return;

  let nichoAtual = 'academia';

  function mostrarDetalhe(a) {
    detalhe.replaceChildren(
      el('p', { className: 'kicker', textContent: `${a.anunciante} · ${a.formato}` }),
      el('h3', { textContent: a.gancho }),
      el('p', { className: 'product-note', textContent: `Ângulo: ${a.angulo}` }),
      el('h4', { textContent: 'Esqueleto do anúncio' }),
      el('ol', { className: 'product-list' }, ...a.esqueleto.map((p) => el('li', { textContent: p }))),
      el('p', { className: 'product-note', textContent: 'O Scout estuda a estrutura, não copia. O texto e as cenas finais são sempre novos.' })
    );
    for (const linha of lista.querySelectorAll('button[data-id]')) {
      linha.setAttribute('aria-pressed', String(linha.dataset.id === a.id));
    }
  }

  function pintar() {
    const nicho = NICHOS[nichoAtual];
    const ranqueados = ranquear(nicho.anuncios);
    lista.replaceChildren(
      ...ranqueados.map((a, i) => {
        const porque = [
          `${plural(a.dias, 'dia', 'dias')} no ar (top ${a.top}%)`,
          `página com ${plural(a.ativosPagina, 'anúncio ativo', 'anúncios ativos')}`,
          plural(a.variacoes, 'variação', 'variações'),
          a.novos14 ? `${plural(a.novos14, 'novo', 'novos')} em 14 dias` : null
        ].filter(Boolean).join(' · ');
        const botao = el('button', { type: 'button', className: 'scout-linha' },
          el('span', { className: 'scout-pos', textContent: `${i + 1}º` }),
          el('span', { className: 'scout-info' },
            el('strong', { textContent: a.anunciante }),
            el('span', { className: 'scout-gancho', textContent: a.gancho }),
            el('span', { className: 'scout-porque', textContent: porque })),
          el('span', { className: `scout-nota ${faixa(a.nota)}`, textContent: String(a.nota), title: 'Nota de escala, de 0 a 100, comparando só os anúncios desta lista' }));
        botao.dataset.id = a.id;
        botao.setAttribute('aria-pressed', 'false');
        botao.addEventListener('click', () => mostrarDetalhe(a));
        return el('li', {}, botao);
      })
    );
    mostrarDetalhe(ranqueados[0]);
    lacunas.replaceChildren(...nicho.lacunas.map((t) => el('li', { textContent: t })));
    roteiro.replaceChildren(
      el('h3', { textContent: nicho.roteiro.titulo }),
      el('ol', { className: 'product-list' }, ...nicho.roteiro.cenas.map((c) => el('li', { textContent: c }))),
      el('p', { className: 'product-note', textContent: nicho.roteiro.nota })
    );
    for (const b of botoes) b.setAttribute('aria-pressed', String(b.dataset.nicho === nichoAtual));
    if (pedir) {
      const msg = `Olá, André! Vi a demonstração do Scout e quero a análise dos anúncios do meu nicho (${nicho.nome.toLowerCase()}). Meu negócio é: `;
      pedir.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    }
  }

  for (const b of botoes) {
    b.addEventListener('click', () => {
      nichoAtual = b.dataset.nicho;
      pintar();
    });
  }
  pintar();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
}
