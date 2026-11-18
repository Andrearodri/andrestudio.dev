const state = {
  site: true,
  triagem: true,
  agenda: true,
  followup: false,
  video: false
};

const MODULES = {
  site: {
    title: 'Página Rápida de Alta Conversão (Web)',
    desc: 'Recebe o tráfego de anúncios, Instagram ou Google com carregamento instantâneo, apresenta a proposta de valor e direciona o visitante qualificado.'
  },
  video: {
    title: 'Vídeo Curto de Apresentação Comercial (30–45s)',
    desc: 'Retém a atenção logo na primeira dobra mostrando o serviço ou produto na prática antes da tomada de decisão.'
  },
  triagem: {
    title: 'Agente IA de Triagem no WhatsApp (24/7)',
    desc: 'Atende o lead em segundos, responde dúvidas recorrentes com base nas regras do negócio e levanta nome, necessidade e momento de compra.'
  },
  agenda: {
    title: 'Filtro de Qualificação & Encaminhamento',
    desc: 'Organiza os dados coletados na conversa, separa curiosos de oportunidades reais e entrega o resumo estruturado para fechamento ou agendamento.'
  },
  followup: {
    title: 'Follow-up Automático & Recuperação de Contatos',
    desc: 'Retoma o contato de forma natural após 24h/48h com quem iniciou a conversa mas não concluiu o agendamento ou pedido.'
  }
};

const businessInput = document.getElementById('business-name');
const flowContainer = document.getElementById('arch-flow-view');
const wfVideoBlock = document.getElementById('wf-video-block');
const counterLabel = document.getElementById('arch-counter-label');
const daysEl = document.getElementById('arch-days');
const hoursEl = document.getElementById('arch-hours');
const waBtn = document.getElementById('arch-whatsapp-btn');
const blueprintOutput = document.getElementById('blueprint-output');
const statusEl = document.getElementById('arch-status');

function buildBlueprintMarkdown() {
  const name = (businessInput.value || 'Meu Projeto').trim();
  const activeKeys = ['site', 'video', 'triagem', 'agenda', 'followup'].filter((k) => state[k]);
  const lines = [
    '# Blueprint de Arquitetura Digital — ' + name,
    'Gerado em AndreStudio.dev (/ferramentas/arquiteto-de-escopo/)',
    '',
    '## 1. Módulos Selecionados (' + activeKeys.length + ')',
    ...activeKeys.map((k, i) => (i + 1) + '. **' + MODULES[k].title + '**: ' + MODULES[k].desc),
    '',
    '## 2. Estrutura Recomendada da Página (Dobras)',
    '- Dobra 1 (Hero): Promessa clara + Subtítulo de escopo + CTA principal + Barra de 4 pilares',
    ...(state.video ? ['- Dobra 2 (Audiovisual): Vídeo curto de 30–45s com direção comercial'] : []),
    '- Dobra de Autoridade: Vitrine de entregáveis + Comparativo de diferencial',
    '- Dobra de Conversão: Passagem parametrizada para o WhatsApp',
    '- Dobra Final: Perguntas Frequentes (FAQ em 2 colunas)',
    '',
    '## 3. Prompt Técnico para Implementação (Web + Automação IA)',
    'Atue como um arquiteto de soluções full stack e especialista em automação com IA (n8n / Make / WhatsApp API).',
    'Estruture o projeto "' + name + '" contendo os seguintes blocos integrados:',
    ...activeKeys.map((k) => '- ' + MODULES[k].title),
    'Defina: (a) copy das seções da landing page, (b) payload do webhook entre página e WhatsApp, e (c) prompt de sistema enxuto e seguro para o agente de triagem.'
  ];
  return lines.join('\n');
}

function render() {
  const activeKeys = ['site', 'video', 'triagem', 'agenda', 'followup'].filter((k) => state[k]);
  counterLabel.textContent = '02 / Mapa da arquitetura · ' + activeKeys.length + ' módulos ativos';
  wfVideoBlock.hidden = !state.video;

  flowContainer.replaceChildren(...activeKeys.map((key, idx) => {
    const item = MODULES[key];
    const node = document.createElement('div');
    node.className = 'flow-node';

    const badge = document.createElement('span');
    badge.className = 'flow-step';
    badge.textContent = '0' + (idx + 1);

    const body = document.createElement('div');
    const h4 = document.createElement('h4');
    h4.textContent = item.title;
    const p = document.createElement('p');
    p.textContent = item.desc;
    body.append(h4, p);

    node.append(badge, body);
    return node;
  }));

  const minDays = 4 + activeKeys.length * 2;
  const maxDays = minDays + 5;
  const savedHours = (state.triagem ? 16 : 4) + (state.agenda ? 10 : 0) + (state.followup ? 12 : 0) + (state.site ? 4 : 0);

  daysEl.textContent = minDays + ' a ' + maxDays + ' dias úteis';
  hoursEl.textContent = '~' + savedHours + 'h / mês';

  const projName = (businessInput.value || 'Meu Negócio').trim();
  const waText = [
    'Olá André! Montei a arquitetura do projeto "' + projName + '" no Arquiteto de Escopo do site:',
    '',
    ...activeKeys.map((k, i) => (i + 1) + '. ' + MODULES[k].title),
    '',
    'Prazo estimado na ferramenta: ' + minDays + ' a ' + maxDays + ' dias úteis.',
    'Quero conversar sobre escopo e orçamento para implementar!'
  ].join('\n');

  waBtn.href = 'https://wa.me/5598981483900?text=' + encodeURIComponent(waText);
  blueprintOutput.value = buildBlueprintMarkdown();
}

document.querySelectorAll('.module-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const mod = btn.getAttribute('data-mod');
    if (mod === 'site') {
      statusEl.textContent = 'A Página de Alta Conversão é a base da estrutura e permanece ativa.';
      return;
    }
    state[mod] = !state[mod];
    btn.setAttribute('aria-pressed', String(state[mod]));
    btn.querySelector('.module-tag').textContent = state[mod] ? 'Ativo' : 'Adicionar';
    statusEl.textContent = '';
    render();
  });
});

document.querySelectorAll('[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const p = btn.getAttribute('data-preset');
    if (p === 'clinica') {
      businessInput.value = 'Clínica / Negócio Local';
      Object.assign(state, { site: true, triagem: true, agenda: true, followup: false, video: false });
    } else if (p === 'consultoria') {
      businessInput.value = 'Consultoria / Serviço B2B';
      Object.assign(state, { site: true, triagem: true, agenda: true, followup: true, video: true });
    } else {
      businessInput.value = 'Produto Digital / SaaS';
      Object.assign(state, { site: true, triagem: true, agenda: false, followup: true, video: true });
    }
    document.querySelectorAll('.module-toggle').forEach((b) => {
      const m = b.getAttribute('data-mod');
      b.setAttribute('aria-pressed', String(state[m]));
      b.querySelector('.module-tag').textContent = state[m] ? 'Ativo' : 'Adicionar';
    });
    statusEl.textContent = 'Cenário carregado. Ajuste os blocos como preferir.';
    render();
  });
});

businessInput.addEventListener('input', render);

document.querySelectorAll('.arch-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const view = tab.getAttribute('data-view');
    document.querySelectorAll('.arch-tab').forEach((t) => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    document.getElementById('arch-flow-view').hidden = view !== 'flow';
    document.getElementById('arch-wireframe-view').hidden = view !== 'wireframe';
  });
});

document.getElementById('copy-blueprint-btn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(buildBlueprintMarkdown());
    statusEl.textContent = '✓ Blueprint técnico e prompt copiados para a área de transferência!';
  } catch {
    blueprintOutput.closest('details').open = true;
    blueprintOutput.focus();
    blueprintOutput.select();
    statusEl.textContent = 'Selecionei o Blueprint abaixo; use Ctrl+C ou ⌘C para copiar.';
  }
});

document.getElementById('download-blueprint-btn').addEventListener('click', () => {
  const blob = new Blob([buildBlueprintMarkdown()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'blueprint-arquitetura-andrestudio.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  statusEl.textContent = 'Download do arquivo .md iniciado.';
});

render();
