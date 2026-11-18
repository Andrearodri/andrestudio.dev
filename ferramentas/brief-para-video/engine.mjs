// Pure, offline planning rules. No model calls, tracking or storage.
export const OBJECTIVES = {
  vender: { label: 'Vender uma oferta', pace: 2.3, weights: [22, 32, 26, 20],
    beats: ['O problema', 'A solução em uso', 'Detalhe que sustenta a oferta', 'Próximo passo'],
    shots: ['Mostre a dificuldade em uma situação concreta.', 'Mostre mãos usando o produto ou executando o serviço.', 'Aproxime um detalhe, acabamento ou etapa real do processo.', 'Enquadre a oferta e deixe espaço livre para a ação final.'],
    roll: ['Close do produto ou ferramenta em uso.', 'Plano de contexto do problema, sem encenar depoimentos.', 'Detalhe do processo que comprova o benefício informado.'],
    sound: ['Som ambiente da ação para dar materialidade.', 'Whoosh discreto em uma mudança de assunto.', 'Clique suave na entrada da chamada final.'] },
  apresentar: { label: 'Apresentar uma marca ou serviço', pace: 2, weights: [25, 30, 30, 15],
    beats: ['Contexto', 'Processo', 'Resultado observável', 'Convite'],
    shots: ['Abra o ambiente e situe o trabalho.', 'Mostre uma etapa de bastidor do serviço.', 'Mostre um resultado real ou detalhe de acabamento.', 'Finalize com a marca e um convite legível.'],
    roll: ['Plano geral do ambiente de trabalho.', 'Mãos, equipamentos e bastidores do processo.', 'Detalhes de um trabalho autoral concluído.'],
    sound: ['Ambiência leve do local.', 'Som real de ferramenta ou material, quando fizer sentido.', 'Transição sonora curta entre contexto e resultado.'] },
  ensinar: { label: 'Ensinar uma dica prática', pace: 2.1, weights: [20, 35, 30, 15],
    beats: ['Antes de começar', 'Passo principal', 'Conferência do resultado', 'Aplicação'],
    shots: ['Mostre o estado inicial e o material necessário.', 'Mostre a ação em close ou gravação de tela legível.', 'Compare o resultado com o critério explicado.', 'Repita o passo essencial e proponha uma aplicação.'],
    roll: ['Close das mãos executando o passo.', 'Captura de tela ampliada no controle relevante.', 'Comparação visual antes/depois do mesmo exemplo.'],
    sound: ['Clique sutil para destacar uma ação.', 'Som de confirmação ao mostrar o resultado correto.', 'Música discreta, reduzida durante a explicação.'] }
};
export const FORMATS = { '9:16': 'Vertical 9:16', '1:1': 'Quadrado 1:1', '16:9': 'Horizontal 16:9' };
export const FIELD_LIMITS = { project: 100, audience: 240, offer: 420, materials: 600, restrictions: 600, action: 200 };
export const STUDIO_PHONE = '5598981483900';

function clean(value, max) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
}

export function validateBrief(input) {
  const brief = Object.fromEntries(Object.entries(FIELD_LIMITS).map(([key, max]) => [key, clean(input[key], max)]));
  if (brief.project.length < 2) throw new Error('Informe um nome de projeto com pelo menos 2 caracteres.');
  if (!Object.hasOwn(OBJECTIVES, input.objective)) throw new Error('Selecione um objetivo válido.');
  if (![15, 30, 45, 60].includes(Number(input.duration))) throw new Error('Escolha uma duração válida (15, 30, 45 ou 60 segundos).');
  if (!Object.hasOwn(FORMATS, input.format)) throw new Error('Escolha um formato válido.');
  return { ...brief, objective: input.objective, duration: Number(input.duration), format: input.format };
}

// Largest-remainder allocation preserves the exact requested running time.
function allocate(seconds, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => seconds * w / sum);
  const result = raw.map(Math.floor);
  const order = raw.map((v, i) => ({ i, remainder: v - result[i] })).sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  for (let n = seconds - result.reduce((a, b) => a + b, 0), i = 0; i < n; i++) result[order[i].i]++;
  return result;
}

export function cutTimeline(start, end) {
  const cuts = [];
  for (let cursor = start; cursor < end;) {
    const remaining = end - cursor;
    const seconds = remaining === 4 ? 2 : Math.min(3, remaining);
    cuts.push({ start: cursor, end: cursor + seconds });
    cursor += seconds;
  }
  return cuts;
}

export const countWords = value => (String(value).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
export const interval = scene => `${scene.start}–${scene.end}s`;

export function generatePlan(input) {
  const brief = validateBrief(input);
  const config = OBJECTIVES[brief.objective];
  const hookSeconds = brief.duration === 15 ? 2 : 3;
  const durations = [hookSeconds, ...allocate(brief.duration - hookSeconds, config.weights)];
  let cursor = 0;

  const buildDraftVoice = (index) => {
    if (index === 0) {
      if (brief.audience) return `Se você busca ${brief.audience.replace(/\.$/, '').toLowerCase()}, preste atenção nisto.`;
      return '[Apresente a situação ou pergunta inicial em uma frase curta.]';
    }
    if (index === 1) {
      if (brief.audience) return `No dia a dia, ${brief.audience.replace(/\.$/, '')}.`;
      return '[Contextualize o cenário ou necessidade principal.]';
    }
    if (index === 2) {
      if (brief.offer) return brief.offer;
      return '[Apresente a solução, serviço ou passo principal com clareza.]';
    }
    if (index === 3) {
      if (brief.materials) return `Confira na prática: ${brief.materials.replace(/\.$/, '')}.`;
      return '[Mostre o detalhe real que comprova o funcionamento ou resultado.]';
    }
    if (brief.action) return brief.action;
    return '[Convide para o próximo passo de forma direta.]';
  };

  const buildDraftScreen = (index, title) => {
    if (index === 0) return brief.project;
    if (index === 4) return brief.action || '[Defina a ação final na tela.]';
    return `${title} · [Palavra-chave curta]`;
  };

  const scenes = durations.map((seconds, index) => {
    const title = index === 0 ? 'Gancho' : config.beats[index - 1];
    const scene = {
      start: cursor, end: cursor + seconds,
      title,
      visual: index === 0 ? 'Abra com a situação ou resultado que será mostrado. Use um plano legível, sem introdução longa.' : config.shots[index - 1],
      voice: buildDraftVoice(index),
      screen: buildDraftScreen(index, title),
      wordBudget: Math.max(1, Math.floor(seconds * config.pace * .8)),
      cuts: cutTimeline(cursor, cursor + seconds)
    };
    cursor += seconds;
    return scene;
  });
  const gaps = [];
  if (!brief.audience) gaps.push('Quem deve assistir e em que situação essa pessoa precisa da solução?');
  if (!brief.offer) gaps.push(brief.objective === 'ensinar' ? 'Qual dica será ensinada e como conferir o resultado?' : 'Qual oferta ou serviço deve aparecer? Há condições comerciais confirmadas?');
  if (!brief.action) gaps.push('O que a pessoa deve fazer ao final do vídeo?');
  if (!brief.materials) gaps.push('Quais imagens, gravações, logotipo e autorizações já estão disponíveis?');
  if (!brief.restrictions) gaps.push('Há informações, imagens, palavras ou condições que precisam ser evitadas?');
  const voiceWords = scenes.reduce((sum, scene) => sum + scene.wordBudget, 0);
  return { brief, objectiveLabel: config.label, scenes, gaps, questions: gaps.slice(0, 3), voiceWords,
    voiceRange: [Math.floor(voiceWords * .85), voiceWords], pace: config.pace,
    broll: [...config.roll], sfx: [...config.sound],
    checklist: ['Confirmar público, oferta e chamada final antes de gravar.',
      `Preparar enquadramento ${FORMATS[brief.format]} e manter texto longe das bordas e controles da plataforma.`,
      'Gravar 2 tomadas de cada ação e alguns segundos de sobra antes e depois.',
      'Captar voz em local silencioso e registrar alguns segundos de som ambiente.',
      'Conferir foco, luz, legibilidade e autorizações dos materiais.',
      'Usar música e efeitos com licença compatível; priorizar a inteligibilidade da voz.',
      'Ler a locução em voz alta e ajustar ao tempo antes da edição.'] };
}

export function planToMarkdown(plan) {
  const b = plan.brief;
  const lines = [`# Plano de gravação — ${b.project}`, '', 'Rascunho organizado por regras. Revise antes de produzir.', '', '## Briefing',
    `- Objetivo: ${plan.objectiveLabel}`, `- Público: ${b.audience || 'A confirmar'}`, `- Oferta/dica: ${b.offer || 'A confirmar'}`,
    `- Duração e formato: ${b.duration}s · ${FORMATS[b.format]}`, `- Materiais: ${b.materials || 'A confirmar'}`,
    `- Restrições: ${b.restrictions || 'A confirmar'}`, `- Ação final: ${b.action || 'A confirmar'}`, '',
    '## Pendências', ...(plan.gaps.length ? plan.gaps.map(x => `- ${x}`) : ['- Informações preenchidas; confirmar com o responsável.']), '',
    '## Perguntas prioritárias', ...(plan.questions.length ? plan.questions.map((x, i) => `${i + 1}. ${x}`) : ['Nenhuma pergunta prioritária.']), '',
    '## Minutagem e locução', `Referência: ${plan.voiceRange[0]}–${plan.voiceRange[1]} palavras no total, com pausas. Não é medição de áudio.`,
    'Cortes sugeridos a cada 2–3 segundos: use-os conforme a clareza da ação, sem cortar uma explicação necessária.', ''];
  for (const scene of plan.scenes) lines.push(`### ${interval(scene)} · ${scene.title}`, `Imagem: ${scene.visual}`, `Locução: ${scene.voice}`,
    `Texto na tela: ${scene.screen}`, `Referência de locução: até ${scene.wordBudget} palavras.`, `Cortes: ${scene.cuts.map(interval).join(' / ')}`, '');
  for (const [title, list] of [['B-Roll', plan.broll], ['SFX / som', plan.sfx], ['Checklist de captação', plan.checklist]]) lines.push(`## ${title}`, ...list.map(x => `- ${x}`), '');
  lines.push('## Aprovação', 'Conferir informações, imagens, locução, direitos de uso e chamada final. Definir responsável e prazo antes de iniciar a produção.', '', 'Planejado com AndreStudio.dev · https://andrestudio.dev.br/ferramentas/brief-para-video/');
  return lines.join('\n');
}

// Deliberately share a bounded brief, not the whole document or private browser state.
export function whatsappSummary(plan) {
  const b = plan.brief;
  const short = (value, max = 220) => { const text = String(value || 'A confirmar').replace(/\s+/g, ' ').trim(); return text.length > max ? text.slice(0, max - 1) + '…' : text; };
  return ['Olá, AndreStudio! Quero avaliar a produção/edição deste plano.', '',
    `Projeto: ${short(b.project, 100)}`, `Objetivo: ${plan.objectiveLabel}`, `Público: ${short(b.audience, 160)}`,
    `Oferta/dica: ${short(b.offer)}`, `Duração/formato: ${b.duration}s · ${FORMATS[b.format]}`,
    `Materiais: ${short(b.materials, 180)}`, `Restrições: ${short(b.restrictions, 180)}`, `Ação final: ${short(b.action, 160)}`, '',
    `Estrutura: ${plan.scenes.map(s => `${interval(s)} ${s.title}`).join(' → ')}`,
    `Locução estimada: ${plan.voiceRange.join('–')} palavras.`,
    `Pendências: ${plan.gaps.length ? plan.gaps.length + ' ponto(s) a confirmar' : 'briefing preenchido; aguarda revisão'}.`, '',
    'Tenho o plano completo para compartilhar. Podemos alinhar escopo, prazo e orçamento?'].join('\n');
}
export const whatsappUrl = plan => `https://wa.me/${STUDIO_PHONE}?text=${encodeURIComponent(whatsappSummary(plan))}`;

export function planToAiPrompt(plan) {
  const b = plan.brief;
  return [
    `Atue como um diretor criativo e roteirista de vídeos curtos de alta retenção.`,
    `Abaixo está o meu Plano de Gravação estruturado no AndreStudio.dev. Quero que você:`,
    `1. Sugira 3 opções de Gancho (0–3s) fortes e diretos, sem promessas exageradas.`,
    `2. Refine a Locução de cada cena respeitando rigorosamente o limite máximo de palavras de cada bloco.`,
    `3. Sugira o texto curto na tela (lettering) para cada cena.`,
    ``,
    `## Dados do Projeto`,
    `- Projeto: ${b.project}`,
    `- Objetivo: ${plan.objectiveLabel}`,
    `- Público: ${b.audience || 'A definir'}`,
    `- Oferta / mensagem central: ${b.offer || 'A definir'}`,
    `- Duração e formato: ${b.duration}s (${FORMATS[b.format]})`,
    `- Materiais disponíveis: ${b.materials || 'A definir'}`,
    `- Restrições obrigatórias: ${b.restrictions || 'Nenhuma informada'}`,
    `- Chamada final (CTA): ${b.action || 'A definir'}`,
    ``,
    `## Estrutura de Cenas e Limite de Palavras`,
    ...plan.scenes.map(s => `- ${interval(s)} [${s.title}] (Máx. ${s.wordBudget} palavras): Visual="${s.visual}" | Rascunho de fala="${s.voice}"`)
  ].join('\n');
}
