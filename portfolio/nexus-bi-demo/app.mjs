// Nexus BI & Finance: demonstração no navegador com dados FICTÍCIOS.
// Nada é enviado para fora; os números abaixo são inventados para ilustrar a interface.

const SALDO_INICIAL = 48200;
// Movimento diário previsto (entradas recorrentes e saídas fixas), em reais.
const ENTRADAS_DIA = 3150;
const SAIDAS_DIA = 2780;
const EVENTOS = [
  { dia: 5, valor: -12400, nome: 'Folha de pagamento' },
  { dia: 10, valor: -6900, nome: 'Impostos (DAS)' },
  { dia: 15, valor: 9800, nome: 'Contrato Construtora Alvorada' },
  { dia: 20, valor: -4300, nome: 'Fornecedor de insumos' },
  { dia: 35, valor: -12400, nome: 'Folha de pagamento' },
  { dia: 40, valor: -6900, nome: 'Impostos (DAS)' },
  { dia: 48, valor: 15200, nome: 'Projeto Rede Bem-Estar' },
  { dia: 65, valor: -12400, nome: 'Folha de pagamento' },
  { dia: 70, valor: -6900, nome: 'Impostos (DAS)' },
  { dia: 78, valor: -18000, nome: 'Compra de equipamento' },
];

export const FATURAS = [
  { cliente: 'Clínica Horizonte (fictícia)', venc: '12/11', valor: 4800, status: 'paga' },
  { cliente: 'Construtora Alvorada (fictícia)', venc: '18/11', valor: 9800, status: 'pendente' },
  { cliente: 'Escritório Lima & Souza (fictício)', venc: '04/11', valor: 3200, status: 'atrasada' },
  { cliente: 'Rede Bem-Estar (fictícia)', venc: '25/11', valor: 7600, status: 'pendente' },
  { cliente: 'Padaria Trigo Bom (fictícia)', venc: '28/10', valor: 1450, status: 'atrasada' },
  { cliente: 'Studio Forma (fictício)', venc: '08/11', valor: 2900, status: 'paga' },
  { cliente: 'Auto Center Norte (fictício)', venc: '30/11', valor: 5300, status: 'pendente' },
];

export function projetar(dias) {
  const pontos = [];
  let saldo = SALDO_INICIAL;
  for (let d = 0; d <= dias; d += 1) {
    if (d > 0) saldo += ENTRADAS_DIA - SAIDAS_DIA;
    for (const e of EVENTOS) if (e.dia === d) saldo += e.valor;
    pontos.push({ dia: d, saldo });
  }
  return pontos;
}

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const SVG = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

function desenharProjecao(svg, dias) {
  const pts = projetar(dias);
  const W = 760, H = 260, M = { e: 56, d: 12, t: 14, b: 28 };
  const min = Math.min(0, ...pts.map((p) => p.saldo));
  const max = Math.max(...pts.map((p) => p.saldo)) * 1.08;
  const x = (d) => M.e + (d / dias) * (W - M.e - M.d);
  const y = (v) => M.t + (1 - (v - min) / (max - min)) * (H - M.t - M.b);
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const defs = svgEl('defs', {});
  const grad = svgEl('linearGradient', { id: 'nx-area', x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.append(svgEl('stop', { offset: '0%', 'stop-color': '#22c55e', 'stop-opacity': 0.35 }), svgEl('stop', { offset: '100%', 'stop-color': '#22c55e', 'stop-opacity': 0 }));
  defs.append(grad);
  svg.append(defs);
  for (let i = 0; i <= 4; i += 1) {
    const v = min + ((max - min) * i) / 4;
    svg.append(svgEl('line', { x1: M.e, x2: W - M.d, y1: y(v), y2: y(v), stroke: '#232833' }));
    const t = svgEl('text', { x: M.e - 8, y: y(v) + 4, 'text-anchor': 'end', fill: '#8b93a1', 'font-size': 11 });
    t.textContent = `${Math.round(v / 1000)} mil`;
    svg.append(t);
  }
  if (min < 0) svg.append(svgEl('line', { x1: M.e, x2: W - M.d, y1: y(0), y2: y(0), stroke: '#ef4444', 'stroke-dasharray': '4 4' }));
  const linha = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.dia).toFixed(1)},${y(p.saldo).toFixed(1)}`).join(' ');
  svg.append(svgEl('path', { d: `${linha} L${x(dias)},${y(min)} L${x(0)},${y(min)} Z`, fill: 'url(#nx-area)' }));
  svg.append(svgEl('path', { d: linha, fill: 'none', stroke: '#22c55e', 'stroke-width': 2.5 }));
  for (const e of EVENTOS.filter((ev) => ev.dia <= dias && Math.abs(ev.valor) >= 9000)) {
    const p = pts[e.dia];
    const c = svgEl('circle', { cx: x(e.dia), cy: y(p.saldo), r: 4.5, fill: e.valor > 0 ? '#22c55e' : '#f59e0b', stroke: '#0a0c10', 'stroke-width': 2 });
    const tt = svgEl('title', {});
    tt.textContent = `Dia ${e.dia}: ${e.nome} (${brl(e.valor)})`;
    c.append(tt);
    svg.append(c);
  }
  for (const d of [0, Math.round(dias / 3), Math.round((2 * dias) / 3), dias]) {
    const t = svgEl('text', { x: x(d), y: H - 8, 'text-anchor': 'middle', fill: '#8b93a1', 'font-size': 11 });
    t.textContent = d === 0 ? 'hoje' : `+${d} dias`;
    svg.append(t);
  }
  const final = pts[pts.length - 1].saldo;
  const menor = Math.min(...pts.map((p) => p.saldo));
  return { final, menor };
}

function pintarFaturas(corpo, filtro) {
  const lista = FATURAS.filter((f) => filtro === 'todas' || f.status === filtro);
  corpo.replaceChildren(...lista.map((f) => {
    const tr = document.createElement('tr');
    const c1 = document.createElement('td'); c1.textContent = f.cliente;
    const c2 = document.createElement('td'); c2.textContent = f.venc; c2.className = 'nx-ocultar-celular';
    const c3 = document.createElement('td'); const s = document.createElement('span'); s.className = `nx-status ${f.status}`;
    s.textContent = { paga: 'Paga', pendente: 'Pendente', atrasada: 'Atrasada' }[f.status]; c3.append(s);
    const c4 = document.createElement('td'); c4.className = 'num'; c4.textContent = brl(f.valor);
    tr.append(c1, c2, c3, c4);
    return tr;
  }));
}

function iniciar() {
  const svg = document.getElementById('nx-projecao');
  const resumo = document.getElementById('nx-projecao-resumo');
  const abas = [...document.querySelectorAll('[data-dias]')];
  const corpo = document.getElementById('nx-faturas');
  const filtros = [...document.querySelectorAll('[data-filtro]')];
  if (!svg || !corpo) return;

  const receber = FATURAS.filter((f) => f.status !== 'paga').reduce((s, f) => s + f.valor, 0);
  const atrasado = FATURAS.filter((f) => f.status === 'atrasada').reduce((s, f) => s + f.valor, 0);
  document.getElementById('nx-receber').textContent = brl(receber);
  document.getElementById('nx-atrasado').textContent = brl(atrasado);
  document.getElementById('nx-saldo').textContent = brl(SALDO_INICIAL);

  function trocarPeriodo(dias) {
    const { final, menor } = desenharProjecao(svg, dias);
    resumo.textContent = `Saldo previsto em ${dias} dias: ${brl(final)} · menor saldo no período: ${brl(menor)}`;
    for (const a of abas) a.setAttribute('aria-pressed', String(Number(a.dataset.dias) === dias));
  }
  for (const a of abas) a.addEventListener('click', () => trocarPeriodo(Number(a.dataset.dias)));
  for (const f of filtros) {
    f.addEventListener('click', () => {
      for (const g of filtros) g.setAttribute('aria-pressed', String(g === f));
      pintarFaturas(corpo, f.dataset.filtro);
    });
  }
  trocarPeriodo(90);
  pintarFaturas(corpo, 'todas');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
}
