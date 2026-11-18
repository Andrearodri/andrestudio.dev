import { generatePlan, planToMarkdown, planToAiPrompt, whatsappSummary, whatsappUrl, countWords, interval } from './engine.mjs';

const form = document.getElementById('brief-form');
const result = document.getElementById('plan-result');
const status = document.getElementById('tool-status');
const share = document.getElementById('share-whatsapp');
const actions = [...document.querySelectorAll('[data-plan-action]')];
let current = null;
let stale = false;
let edited = false;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function list(id, items) {
  document.getElementById(id).replaceChildren(...items.map(item => node('li', item)));
}
function setStale(value) {
  stale = value;
  actions.forEach(button => { button.disabled = value; });
  if (value) {
    share.removeAttribute('href');
    share.setAttribute('aria-disabled', 'true');
    status.textContent = 'Briefing alterado. Gere novamente para atualizar o plano e o resumo do WhatsApp.';
  } else {
    share.href = whatsappUrl(current);
    share.removeAttribute('aria-disabled');
  }
}
function renderPrint() {
  const print = document.getElementById('print-plan');
  print.replaceChildren(node('h1', `Plano de gravação — ${current.brief.project}`));
  const content = node('div', planToMarkdown(current).split('\n').slice(2).join('\n').replace(/^#{1,3} /gm, ''), 'print-document');
  print.append(content);
}
function syncExports() {
  document.getElementById('markdown-output').value = planToMarkdown(current);
  document.getElementById('share-preview').textContent = whatsappSummary(current);
  if (!stale) share.href = whatsappUrl(current);
  renderPrint();
}
function render() {
  const { brief, scenes } = current;
  document.getElementById('result-title').textContent = brief.project;
  document.getElementById('result-meta').textContent = `${brief.duration}s · ${brief.format} · ${current.objectiveLabel}`;
  document.getElementById('voice-budget').textContent = `${current.voiceRange.join('–')} palavras`;
  document.getElementById('shot-count').textContent = `${scenes.reduce((sum, scene) => sum + scene.cuts.length, 0)} planos sugeridos`;
  document.getElementById('plan-scenes').replaceChildren(...scenes.map((scene, index) => {
    const card = node('article', undefined, 'scene');
    const heading = node('div', undefined, 'scene-heading');
    heading.append(node('span', interval(scene), 'timecode'), node('h3', scene.title));
    card.append(heading, node('p', `Cortes sugeridos: ${scene.cuts.map(interval).join(' / ')}`, 'scene-cuts'));
    for (const [key, label] of [['visual', 'Imagem / ação'], ['voice', 'Locução'], ['screen', 'Texto na tela']]) {
      const id = `scene-${index}-${key}`;
      const field = node('label', label);
      field.htmlFor = id;
      const input = node('textarea');
      input.id = id; input.rows = 2; input.maxLength = 1000; input.value = scene[key];
      let counter;
      if (key === 'voice') {
        counter = node('p', undefined, 'word-counter'); counter.id = `${id}-counter`;
        input.setAttribute('aria-describedby', counter.id);
      }
      const updateCounter = () => {
        if (!counter) return;
        const words = /^\[.*\]$/.test(scene.voice.trim()) ? 0 : countWords(scene.voice);
        counter.textContent = `${words} palavras escritas · referência: até ${scene.wordBudget}. ${words > scene.wordBudget ? 'Encurte a fala ou ajuste o ritmo na revisão.' : 'Leia em voz alta para conferir o tempo.'}`;
        counter.classList.toggle('over-budget', words > scene.wordBudget);
      };
      input.addEventListener('input', () => { scene[key] = input.value; edited = true; updateCounter(); syncExports(); });
      card.append(field, input);
      if (counter) { updateCounter(); card.append(counter); }
    }
    return card;
  }));
  list('plan-questions', current.questions.length ? current.questions : ['Os campos estão preenchidos. Confirme as informações com o responsável.']);
  list('plan-gaps', current.gaps.length ? current.gaps : ['Nenhuma lacuna de preenchimento identificada. Isso não substitui a revisão.']);
  list('plan-broll', current.broll); list('plan-sfx', current.sfx); list('plan-checklist', current.checklist);
  const timeline = document.getElementById('timeline');
  timeline.replaceChildren(...scenes.map(scene => {
    const segment = node('div');
    segment.style.flexGrow = String(scene.end - scene.start);
    segment.append(node('strong', interval(scene)), node('span', scene.title));
    return segment;
  }));
  syncExports();
  result.hidden = false;
  document.getElementById('result-empty').hidden = true;
  document.getElementById('result-title').focus();
}

form.addEventListener('input', () => { if (current) setStale(true); });
form.addEventListener('change', () => { if (current) setStale(true); });
form.addEventListener('submit', event => {
  event.preventDefault();
  if (edited && !window.confirm('Gerar novamente substitui as edições das cenas. Continuar?')) return;
  try {
    current = generatePlan(Object.fromEntries(new FormData(form)));
    edited = false; setStale(false); render();
    status.textContent = 'Plano criado. Revise as cenas e confira o resumo antes de compartilhar.';
  } catch (error) { status.textContent = error.message; }
});
share.addEventListener('click', event => { if (!current || stale) event.preventDefault(); });
const PRESETS = {
  local: {
    project: 'Vídeo de apresentação de cafeteria artesanal',
    objective: 'apresentar',
    audience: 'Pessoas que trabalham no centro e procuram uma pausa rápida para o café.',
    offer: 'Apresentar o preparo do espresso na hora, os pães de fermentação natural e o ambiente tranquilo.',
    duration: '30',
    format: '9:16',
    materials: 'Gravações próprias do balcão, extração do café e fachada; logotipo da cafeteria.',
    restrictions: 'Não mostrar clientes identificáveis sem autorização. Não divulgar preços promocionais.',
    action: 'Conheça o espaço hoje — endereço completo no link do perfil.'
  },
  servico: {
    project: 'Captação de clientes para consultoria / serviço B2B',
    objective: 'vender',
    audience: 'Donos de empresas que perdem vendas por demora no atendimento pelo WhatsApp.',
    offer: 'Diagnóstico de processo comercial e estruturação de página de alta conversão com escopo fechado.',
    duration: '45',
    format: '9:16',
    materials: 'Apresentador falando para a câmera + gravação de tela mostrando o funil organizado.',
    restrictions: 'Não prometer faturamento garantido. Manter tom consultivo e transparente.',
    action: 'Solicite um diagnóstico inicial pelo link da bio.'
  },
  ia: {
    project: 'Demonstração de automação com IA no atendimento',
    objective: 'vender',
    audience: 'Clínicas e escritórios que recebem dezenas de mensagens repetitivas todos os dias.',
    offer: 'Triagem automática no WhatsApp com IA que qualifica o cliente e agenda o horário em segundos.',
    duration: '45',
    format: '16:9',
    materials: 'Captura de tela do fluxo rodando em tempo real e conversa demonstrativa no celular.',
    restrictions: 'Identificar claramente que a conversa na tela é uma simulação demonstrativa.',
    action: 'Clique abaixo para testar a demonstração ou agendar conversa.'
  },
  dica: {
    project: 'Reels de dica prática: como gravar vídeo pelo celular',
    objective: 'ensinar',
    audience: 'Profissionais liberais que travam na hora de gravar vídeos curtos para o Instagram.',
    offer: 'Como posicionar o celular a 45 graus da janela e dividir a fala em 4 blocos curtos sem decorar texto longo.',
    duration: '30',
    format: '9:16',
    materials: 'Bastidor real mostrando a janela, o apoio do celular e comparação antes/depois da luz.',
    restrictions: 'Não exigir equipamentos caros como microfone profissional ou iluminação de estúdio.',
    action: 'Salve este vídeo para usar na sua próxima gravação.'
  }
};

document.querySelectorAll('[data-preset]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (current && !window.confirm('Carregar este modelo substitui o briefing e as edições atuais. Continuar?')) return;
    const preset = PRESETS[btn.dataset.preset] || PRESETS.local;
    for (const [key, value] of Object.entries(preset)) form.elements.namedItem(key).value = value;
    edited = false;
    form.requestSubmit();
  });
});

document.getElementById('clear-button').addEventListener('click', () => {
  if (!window.confirm('Apagar o briefing e o plano desta página?')) return;
  form.reset(); current = null; stale = false; edited = false;
  result.hidden = true;
  document.getElementById('plan-scenes').replaceChildren();
  document.getElementById('print-plan').replaceChildren();
  document.getElementById('markdown-output').value = '';
  document.getElementById('share-preview').textContent = '';
  share.removeAttribute('href');
  document.getElementById('result-empty').hidden = false;
  status.textContent = 'Dados apagados desta página.';
  form.elements.namedItem('project').focus();
});

const aiPromptBtn = document.getElementById('copy-ai-prompt-button');
if (aiPromptBtn) {
  aiPromptBtn.addEventListener('click', async () => {
    if (!current || stale) return;
    const promptText = planToAiPrompt(current);
    try {
      await navigator.clipboard.writeText(promptText);
      status.textContent = 'Prompt para ChatGPT/Claude copiado! Cole na sua IA preferida para refinar a locução.';
      aiPromptBtn.textContent = '✓ Prompt para IA copiado!';
      setTimeout(() => { aiPromptBtn.textContent = 'Copiar Prompt p/ ChatGPT ou Claude'; }, 2800);
    } catch {
      document.getElementById('markdown-details').open = true;
      const field = document.getElementById('markdown-output');
      field.value = promptText;
      field.focus();
      field.select();
      status.textContent = 'Prompt exibido e selecionado abaixo; use Ctrl+C ou ⌘C para copiar.';
    }
  });
}

document.getElementById('copy-button').addEventListener('click', async () => {
  if (!current || stale) return;
  try { await navigator.clipboard.writeText(planToMarkdown(current)); status.textContent = 'Plano copiado.'; }
  catch {
    document.getElementById('markdown-details').open = true;
    const field = document.getElementById('markdown-output'); field.focus(); field.select();
    status.textContent = 'A cópia automática não está disponível. O texto foi selecionado; use Copiar no seu dispositivo.';
  }
});
document.getElementById('download-button').addEventListener('click', () => {
  if (!current || stale) return;
  const blob = new Blob([planToMarkdown(current)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url;
  const slug = current.brief.project.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'video';
  anchor.download = `plano-${slug}.md`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Download do plano iniciado.';
});
document.getElementById('print-button').addEventListener('click', () => { if (current && !stale) { renderPrint(); window.print(); } });
