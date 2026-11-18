// Interface interativa em 3 etapas do Auditor de Lucro & Automação com IA.
// Construção estrita de DOM via document.createElement + textContent (zero innerHTML / CSP safe).
// Lazy-loading de xlsx-codec.mjs via import() dinâmico apenas ao ler ou gerar arquivo .xlsx.

import { BRAND_CONFIG, buildWhatsappLink, extractBrPhoneDigits, formatPhoneMaskBr } from '../../data/brandConfig.mjs';
import {
  buildCsvTemplateFromItems,
  formatBRL,
  formatInt,
  formatPct,
  normalizePricingItems,
  parseDelimitedText,
  runFinancialAudit
} from './financial-engine.mjs';
import { NICHES, getPresetForNiche } from './presets.mjs';
import { buildContingencyAnalysis, sanitizeAuditPayload } from './fallback-analyst.mjs';

const MODULES_META = [
  {
    id: 'whatsapp',
    tag: 'MÓDULO A · VENDAS & ATENDIMENTO',
    title: 'Recuperação de Orçamentos no WhatsApp',
    desc: 'Calcula leads perdidos, receita deixada na mesa, meta em 30 dias, ROI anual e gera scripts prontos.'
  },
  {
    id: 'pricing',
    tag: 'MÓDULO B · LUCRO & TABELA',
    title: 'Auditoria de Margem, Taxas & Precificação',
    desc: 'Separa Markup de Margem Líquida real, revela prejuízo invisível e recalcula o preço ideal item a item.'
  },
  {
    id: 'automation',
    tag: 'MÓDULO C · PRODUTIVIDADE',
    title: 'Automação & Produtividade da Equipe',
    desc: 'Calcula custo real da hora-homem, horas desperdiçadas e economia treinando a equipe vs automatizando.'
  }
];

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs || {})) {
    if (val === null || val === undefined || val === false) continue;
    if (key === 'class') {
      node.className = val;
    } else if (key === 'text') {
      node.textContent = String(val);
    } else if (key.startsWith('on') && typeof val === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), val);
    } else {
      node.setAttribute(key, val === true ? '' : String(val));
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' || typeof child === 'number'
      ? document.createTextNode(String(child))
      : child);
  }
  return node;
}

function createInitialState() {
  const initialPreset = getPresetForNiche('clinica');
  return {
    step: 1,
    nicheId: 'clinica',
    customNicheName: '',
    moduleId: 'whatsapp',
    loading: false,
    loadingStage: 0,
    statusMessage: '',
    statusIsError: false,
    form: {
      whatsapp: { ...initialPreset.whatsapp },
      pricing: {
        ...initialPreset.pricing,
        items: initialPreset.pricing.items.map((item) => ({ ...item }))
      },
      automation: { ...initialPreset.automation }
    },
    result: null,
    lead: {
      unlocked: false,
      name: '',
      company: '',
      whatsapp: '',
      submitting: false,
      feedback: ''
    }
  };
}

function getEffectiveNicheLabel(state) {
  if (state.nicheId === 'custom') {
    return state.customNicheName.trim() || 'Negócio Customizado';
  }
  return (NICHES.find((n) => n.id === state.nicheId) || NICHES[0]).label;
}

function buildAuditRequestPayload(state) {
  const nicheLabel = getEffectiveNicheLabel(state);
  const base = {
    moduleId: state.moduleId,
    nicheId: state.nicheId,
    nicheLabel
  };
  if (state.moduleId === 'whatsapp') {
    base.whatsapp = { ...state.form.whatsapp };
  } else if (state.moduleId === 'pricing') {
    base.pricing = {
      ...state.form.pricing,
      items: state.form.pricing.items.map((item) => ({ ...item }))
    };
  } else {
    base.automation = { ...state.form.automation };
  }
  return base;
}

function buildExecutiveWhatsappMessage(state, result) {
  const { audit, analysis } = result;
  const { summary, moduleId, nicheLabel } = audit;
  const modLabel = moduleId === 'whatsapp'
    ? 'Recuperação de WhatsApp'
    : moduleId === 'pricing'
      ? 'Margem & Precificação'
      : 'Automação & Produtividade';
  const company = state.lead.company.trim() || nicheLabel;

  return [
    `Olá, ${BRAND_CONFIG.founder}! Rodei o Auditor de Lucro & Automação IA no site (${BRAND_CONFIG.siteName}).`,
    '',
    `Empresa/Nicho: ${company} (${nicheLabel})`,
    `Módulo auditado: ${modLabel}`,
    ...(audit.details.isTargetMathematicallyInfeasible ? [] : [
      `Vazamento mensal identificado: ${formatBRL(summary.monthlyLeakageBRL)}/mês`,
      `Potencial de caixa em 30 dias: ${formatBRL(summary.cashPotential30dBRL)}`,
      `Projeção acumulada em 12 meses: ${formatBRL(summary.projection12mBRL)}`,
    ]),
    `Diagnóstico: ${analysis.executiveHeadline}`,
    '',
    'Quero conversar sobre os próximos passos (Treinamento da equipe ou Sistema/Agente sob medida).'
  ].join('\n');
}

export function mountAuditorApp(rootEl) {
  if (!rootEl) return null;
  const state = createInitialState();

  function applyPresetToForm(nicheId, customName) {
    const preset = getPresetForNiche(nicheId, customName);
    state.form.whatsapp = { ...preset.whatsapp };
    state.form.pricing = {
      ...preset.pricing,
      items: preset.pricing.items.map((item) => ({ ...item }))
    };
    state.form.automation = { ...preset.automation };
  }

  function triggerDownload(bytesOrText, fileName, mimeType) {
    const blob = new Blob([bytesOrText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function downloadExecutiveXlsx() {
    if (!state.result) return;
    const { buildExecutiveWorkbookXlsx } = await import('/ferramentas/auditor-ia/xlsx-codec.mjs');
    const bytes = await buildExecutiveWorkbookXlsx({
      audit: state.result.audit,
      analysis: state.result.analysis,
      lead: {
        name: state.lead.name || 'Visitante',
        company: state.lead.company || getEffectiveNicheLabel(state),
        whatsapp: state.lead.whatsapp || ''
      }
    });
    const slug = (state.lead.company || getEffectiveNicheLabel(state))
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'empresa';
    triggerDownload(
      bytes,
      `Auditoria-Lucro-IA-${slug}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }

  async function runAuditFlow() {
    state.statusMessage = '';
    state.statusIsError = false;

    let sanitizedPayload;
    try {
      sanitizedPayload = sanitizeAuditPayload(buildAuditRequestPayload(state));
    } catch (err) {
      state.statusMessage = err.message || 'Verifique os campos preenchidos antes de gerar a auditoria.';
      state.statusIsError = true;
      render();
      return;
    }

    state.loading = true;
    state.loadingStage = 1;
    state.step = 2;
    render();

    const timerStage2 = setTimeout(() => {
      if (state.loading) {
        state.loadingStage = 2;
        render();
      }
    }, 280);
    const timerStage3 = setTimeout(() => {
      if (state.loading) {
        state.loadingStage = 3;
        render();
      }
    }, 560);

    let responseData = null;
    try {
      const response = await fetch('/api/auditor-ia', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sanitizedPayload)
      });
      if (response.ok) {
        const parsed = await response.json();
        if (parsed?.ok && parsed?.audit && parsed?.analysis) {
          responseData = parsed;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        if (response.status === 400 || response.status === 429) {
          throw new Error(errJson?.error || 'Não foi possível validar os dados informados.');
        }
      }
    } catch (err) {
      if (err && /validar|informados|limite/i.test(String(err.message || ''))) {
        clearTimeout(timerStage2);
        clearTimeout(timerStage3);
        state.loading = false;
        state.statusMessage = err.message;
        state.statusIsError = true;
        render();
        return;
      }
      // Fallback local transparente caso o preview estático rode sem Cloudflare Functions
    } finally {
      clearTimeout(timerStage2);
      clearTimeout(timerStage3);
    }

    if (!responseData) {
      const localAudit = runFinancialAudit(sanitizedPayload);
      const localAnalysis = buildContingencyAnalysis(localAudit, sanitizedPayload);
      responseData = {
        ok: true,
        audit: localAudit,
        analysis: localAnalysis,
        meta: { mode: 'contingency', provider: 'local-browser' }
      };
    }

    state.loading = false;
    state.result = responseData;
    state.step = 3;
    render();

    const resultHeading = rootEl.querySelector('#auditor-result-heading');
    if (resultHeading) {
      resultHeading.focus();
    }
  }

  async function handleFileUpload(file) {
    if (!file) return;
    state.statusMessage = '';
    state.statusIsError = false;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      let matrix;
      if (ext === 'xlsx') {
        const { parseXlsxBuffer } = await import('/ferramentas/auditor-ia/xlsx-codec.mjs');
        const buf = await file.arrayBuffer();
        matrix = await parseXlsxBuffer(buf);
      } else if (['csv', 'tsv', 'txt'].includes(ext)) {
        const text = await file.text();
        matrix = parseDelimitedText(text);
      } else {
        throw new Error('Formato não suportado. Envie uma planilha .xlsx ou .csv.');
      }

      const items = normalizePricingItems(matrix);
      if (!items.length) {
        throw new Error('Não encontramos linhas válidas de produtos/serviços na planilha. Use as colunas: Item, Custo, Preço, Qtd.');
      }
      state.form.pricing.items = items;
      state.statusMessage = `✓ Planilha "${file.name}" importada com ${items.length} item(ns). Confira as taxas abaixo e gere a auditoria.`;
    } catch (err) {
      state.statusMessage = err.message || 'Falha ao ler a planilha enviada.';
      state.statusIsError = true;
    }
    render();
  }

  function renderStepper() {
    const steps = [
      { id: 1, label: 'Etapa 01', title: 'Nicho & Módulo' },
      { id: 2, label: 'Etapa 02', title: 'Dados do Negócio' },
      { id: 3, label: 'Etapa 03', title: 'Diagnóstico & .XLSX' }
    ];
    return el(
      'div',
      { class: 'auditor-stepper', role: 'navigation', 'aria-label': 'Etapas da auditoria' },
      steps.map((stepInfo) => {
        const isCurrent = state.step === stepInfo.id;
        const isDone = (stepInfo.id < state.step) || (stepInfo.id === 3 && Boolean(state.result));
        const canNavigate = stepInfo.id === 1 || stepInfo.id === 2 || Boolean(state.result);
        return el(
          'button',
          {
            type: 'button',
            class: `auditor-step-btn ${isCurrent ? 'is-active' : ''} ${isDone && !isCurrent ? 'is-done' : ''}`.trim(),
            disabled: !canNavigate || state.loading,
            'aria-current': isCurrent ? 'step' : null,
            onclick: () => {
              state.step = stepInfo.id;
              render();
            }
          },
          el('span', { class: 'auditor-step-num', text: isDone && !isCurrent ? '✓' : String(stepInfo.id) }),
          el(
            'span',
            { class: 'auditor-step-meta' },
            el('small', { text: stepInfo.label }),
            el('strong', { text: stepInfo.title })
          )
        );
      })
    );
  }

  function renderStep1() {
    return el(
      'div',
      { class: 'auditor-panel' },
      el(
        'div',
        { class: 'auditor-block-head' },
        el(
          'div',
          {},
          el('p', { class: 'kicker', text: '01 / Escolha seu segmento' }),
          el('h3', { text: 'Qual é o nicho da sua empresa?' }),
          el('p', { class: 'auditor-block-sub', text: 'Os cenários reais, taxas típicas e scripts serão calibrados para este mercado.' })
        )
      ),
      el(
        'div',
        { class: 'auditor-niche-grid', role: 'group', 'aria-label': 'Nichos de atuação' },
        NICHES.map((niche) =>
          el(
            'button',
            {
              type: 'button',
              class: 'auditor-choice-card',
              'data-niche-id': niche.id,
              'aria-pressed': String(state.nicheId === niche.id),
              onclick: () => {
                state.nicheId = niche.id;
                applyPresetToForm(niche.id, state.customNicheName);
                render();
              }
            },
            el('span', { class: 'auditor-choice-tag', text: niche.shortTag }),
            el('strong', { text: niche.label }),
            el('small', { text: niche.description })
          )
        )
      ),
      state.nicheId === 'custom'
        ? el(
            'div',
            { class: 'auditor-custom-niche' },
            el('label', { for: 'auditor-custom-niche-input', text: 'Digite o ramo exato do seu negócio' }),
            el('input', {
              id: 'auditor-custom-niche-input',
              type: 'text',
              maxlength: '60',
              placeholder: 'Ex.: Energia Solar, Auto Peças, Pet Shop, Academia, Imobiliária...',
              value: state.customNicheName,
              oninput: (e) => {
                state.customNicheName = e.target.value;
                applyPresetToForm('custom', state.customNicheName);
              }
            })
          )
        : null,
      el(
        'div',
        { class: 'auditor-block-head', style: 'margin-top: 1.4rem' },
        el(
          'div',
          {},
          el('p', { class: 'kicker', text: '02 / Onde quer estancar vazamentos primeiro?' }),
          el('h3', { text: 'Selecione o módulo de auditoria' })
        )
      ),
      el(
        'div',
        { class: 'auditor-module-grid', role: 'group', 'aria-label': 'Módulos do auditor' },
        MODULES_META.map((mod) =>
          el(
            'button',
            {
              type: 'button',
              class: 'auditor-choice-card',
              'data-module-id': mod.id,
              'aria-pressed': String(state.moduleId === mod.id),
              onclick: () => {
                state.moduleId = mod.id;
                render();
              }
            },
            el('span', { class: 'auditor-choice-tag', text: mod.tag }),
            el('strong', { text: mod.title }),
            el('small', { text: mod.desc })
          )
        )
      ),
      el(
        'div',
        { class: 'auditor-actions-bar' },
        el(
          'span',
          { class: 'auditor-field-hint', text: 'Cálculo matemático determinístico no cliente e Edge API sem risco de alucinação numérica.' }
        ),
        el(
          'div',
          { class: 'auditor-actions-group' },
          el('button', {
            type: 'button',
            class: 'btn',
            id: 'auditor-quick-test-btn',
            text: '⚡ Testar com Caso Real deste Nicho',
            onclick: () => {
              applyPresetToForm(state.nicheId, state.customNicheName);
              runAuditFlow();
            }
          }),
          el('button', {
            type: 'button',
            class: 'btn btn-primary',
            id: 'auditor-step1-next-btn',
            text: 'Inserir Dados do Negócio →',
            onclick: () => {
              state.step = 2;
              render();
            }
          })
        )
      )
    );
  }

  function renderNumberField(id, label, value, hint, onChange, inputMode = 'decimal') {
    return el(
      'div',
      { class: 'auditor-field' },
      el('label', { for: id, text: label }),
      el('input', {
        id,
        type: 'text',
        inputmode: inputMode,
        value: value ?? '',
        oninput: (e) => onChange(e.target.value)
      }),
      hint ? el('span', { class: 'auditor-field-hint', text: hint }) : null
    );
  }

  function renderModuleAForm() {
    const wa = state.form.whatsapp;
    return el(
      'div',
      { class: 'auditor-form-grid' },
      renderNumberField('wa-leads', 'Orçamentos / contatos no WhatsApp por mês', wa.leadsPerMonth, 'Ex.: 240 mensagens comerciais/mês', (v) => { wa.leadsPerMonth = v; }, 'numeric'),
      renderNumberField('wa-conv', 'Taxa média de fechamento atual (%)', wa.currentConversionPct, 'Ex.: 18 ou 18,5%', (v) => { wa.currentConversionPct = v; }),
      renderNumberField('wa-ticket', 'Ticket médio por venda fechada (R$)', wa.averageTicket, 'Ex.: 420 ou R$ 1.250,00', (v) => { wa.averageTicket = v; }),
      renderNumberField('wa-margin', 'Margem bruta média (%)', wa.grossMarginPct, 'Padrão 65% se não souber exato', (v) => { wa.grossMarginPct = v; }),
      renderNumberField('wa-response', 'Tempo médio para 1ª resposta (minutos)', wa.avgResponseMinutes, 'Ex.: 45 minutos', (v) => { wa.avgResponseMinutes = v; }, 'numeric'),
      el(
        'div',
        { class: 'auditor-field' },
        el('label', { for: 'wa-followup', text: 'Tentativas de follow-up após o preço' }),
        el(
          'select',
          {
            id: 'wa-followup',
            onchange: (e) => { wa.followUpSteps = Number(e.target.value); }
          },
          [
            ['0', '0 — Não fazemos follow-up'],
            ['1', '1 — Apenas uma mensagem se lembrar'],
            ['2', '2 — Retorno em D+1 e D+3'],
            ['3', '3 — Cadência organizada (3+ toques)']
          ].map(([val, label]) => el('option', { value: val, selected: String(wa.followUpSteps) === val, text: label }))
        )
      ),
      el(
        'div',
        { class: 'auditor-field auditor-field--full' },
        el('label', { for: 'wa-sample', text: 'Descreva dúvidas ou objeções que você recebe no WhatsApp' }),
        el('textarea', {
          id: 'wa-sample',
          maxlength: '1800',
          placeholder: 'Ex.: Cliente pergunta preço e some depois de dizer "vou ver com meu sócio" ou "achei mais barato"...',
          value: wa.conversationsSample || '',
          oninput: (e) => { wa.conversationsSample = e.target.value; }
        }),
        el('span', { class: 'auditor-field-hint', text: 'Use exemplos anônimos. Remova nomes, telefones e informações pessoais dos clientes.' })
      )
    );
  }

  function renderModuleBForm() {
    const pr = state.form.pricing;
    return el(
      'div',
      {},
      el(
        'div',
        { class: 'auditor-form-grid' },
        renderNumberField('pr-card', 'Taxa média de maquininha / app / gateway (%)', pr.cardFeePct, 'Ex.: 4,9% (ou 14,5% se delivery/app)', (v) => { pr.cardFeePct = v; }),
        renderNumberField('pr-tax', 'Impostos sobre venda / nota fiscal (%)', pr.taxRatePct, 'Ex.: 6,0% ou 11,3%', (v) => { pr.taxRatePct = v; }),
        renderNumberField('pr-hidden', 'Custos ocultos: embalagem, perda, comissão (%)', pr.hiddenCostsPct, 'Ex.: 3,5% ou 5%', (v) => { pr.hiddenCostsPct = v; }),
        renderNumberField('pr-fixed', 'Custo fixo mensal aproximado (R$)', pr.fixedMonthlyOverhead, 'Aluguel, energia, folha fixa, sistemas', (v) => { pr.fixedMonthlyOverhead = v; }),
        renderNumberField('pr-target', 'Meta de margem líquida desejada (%)', pr.targetNetMarginPct, 'Ex.: 20% ou 25%', (v) => { pr.targetNetMarginPct = v; })
      ),
      el(
        'div',
        {
          class: 'auditor-upload-zone',
          ondragover: (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('is-dragover');
          },
          ondragleave: (e) => {
            e.currentTarget.classList.remove('is-dragover');
          },
          ondrop: (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('is-dragover');
            const file = e.dataTransfer?.files?.[0];
            if (file) handleFileUpload(file);
          }
        },
        el(
          'div',
          {},
          el('strong', { text: 'Importe sua planilha de produtos ou serviços (.CSV ou .XLSX)' }),
          el('p', { class: 'auditor-field-hint', text: 'Arraste o arquivo aqui ou clique em Enviar Planilha. Aceita separador ; (Excel PT-BR) e R$ 1.450,90.' })
        ),
        el(
          'div',
          { class: 'auditor-actions-group' },
          el('input', {
            type: 'file',
            id: 'auditor-file-upload',
            class: 'auditor-file-input',
            accept: '.csv,.tsv,.txt,.xlsx',
            onchange: (e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }
          }),
          el('label', { for: 'auditor-file-upload', class: 'btn btn-small', text: 'Enviar CSV / .XLSX' }),
          el('button', {
            type: 'button',
            class: 'btn btn-small',
            text: '⬇ Baixar Modelo CSV',
            onclick: () => {
              const csv = buildCsvTemplateFromItems(pr.items);
              triggerDownload(csv, `modelo-precificacao-${state.nicheId}.csv`, 'text/csv;charset=utf-8');
            }
          }),
          el('button', {
            type: 'button',
            class: 'btn btn-small',
            text: '⬇ Baixar Modelo .XLSX',
            onclick: async () => {
              const { buildSampleCatalogXlsx } = await import('/ferramentas/auditor-ia/xlsx-codec.mjs');
              const bytes = await buildSampleCatalogXlsx(pr.items, getEffectiveNicheLabel(state));
              triggerDownload(
                bytes,
                `modelo-precificacao-${state.nicheId}.xlsx`,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              );
            }
          })
        )
      ),
      el(
        'div',
        { class: 'auditor-items-wrap' },
        el(
          'table',
          { class: 'auditor-items-table', 'aria-label': 'Itens para auditoria de margem e precificação' },
          el(
            'thead',
            {},
            el(
              'tr',
              {},
              el('th', { text: 'Produto / Serviço' }),
              el('th', { text: 'Custo Unit. (R$)' }),
              el('th', { text: 'Preço Atual (R$)' }),
              el('th', { text: 'Qtd / Mês' }),
              el('th', { text: 'Ação' })
            )
          ),
          el(
            'tbody',
            {},
            pr.items.map((item, idx) =>
              el(
                'tr',
                {},
                el('td', {}, el('input', {
                  type: 'text',
                  'aria-label': `Nome do item ${idx + 1}`,
                  value: item.name,
                  oninput: (e) => { item.name = e.target.value; }
                })),
                el('td', {}, el('input', {
                  type: 'text',
                  inputmode: 'decimal',
                  'aria-label': `Custo do item ${idx + 1}`,
                  value: item.unitCost,
                  oninput: (e) => { item.unitCost = e.target.value; }
                })),
                el('td', {}, el('input', {
                  type: 'text',
                  inputmode: 'decimal',
                  'aria-label': `Preço atual do item ${idx + 1}`,
                  value: item.currentPrice,
                  oninput: (e) => { item.currentPrice = e.target.value; }
                })),
                el('td', {}, el('input', {
                  type: 'text',
                  inputmode: 'numeric',
                  'aria-label': `Quantidade mensal do item ${idx + 1}`,
                  value: item.monthlyQty,
                  oninput: (e) => { item.monthlyQty = e.target.value; }
                })),
                el('td', {}, el('button', {
                  type: 'button',
                  class: 'auditor-icon-btn',
                  'aria-label': `Remover ${item.name}`,
                  text: '×',
                  onclick: () => {
                    if (pr.items.length > 1) {
                      pr.items.splice(idx, 1);
                      render();
                    }
                  }
                }))
              )
            )
          )
        )
      ),
      el(
        'div',
        { style: 'margin-top: .75rem' },
        el('button', {
          type: 'button',
          class: 'btn btn-small',
          text: '+ Adicionar Produto / Serviço',
          onclick: () => {
            pr.items.push({ name: `Novo Item ${pr.items.length + 1}`, unitCost: 80, currentPrice: 140, monthlyQty: 20 });
            render();
          }
        })
      )
    );
  }

  function renderModuleCForm() {
    const au = state.form.automation;
    return el(
      'div',
      { class: 'auditor-form-grid' },
      renderNumberField('au-team', 'Pessoas envolvidas em atendimento/rotina', au.teamSize, 'Ex.: 4 colaboradores', (v) => { au.teamSize = v; }, 'numeric'),
      renderNumberField('au-salary', 'Salário / remuneração média mensal (R$)', au.avgMonthlySalary, 'Ex.: 2.350,00', (v) => { au.avgMonthlySalary = v; }),
      el(
        'div',
        { class: 'auditor-field' },
        el('label', { for: 'au-charges', text: 'Fator de encargos / custos trabalhistas' }),
        el(
          'select',
          {
            id: 'au-charges',
            onchange: (e) => { au.chargesMultiplier = Number(e.target.value); }
          },
          [
            ['1.38', 'CLT / Simples Nacional (~1,38x)'],
            ['1.65', 'CLT Presumido / Benefícios (~1,65x)'],
            ['1', 'PJ / Pró-labore / MEI (1,00x)']
          ].map(([val, label]) => el('option', { value: val, selected: String(au.chargesMultiplier) === val, text: label }))
        )
      ),
      renderNumberField('au-hours', 'Horas produtivas úteis por pessoa/mês', au.productiveHoursPerMonth, 'Padrão 160h/mês (8h × 20 dias)', (v) => { au.productiveHoursPerMonth = v; }, 'numeric'),
      renderNumberField('au-waste', 'Horas/semana perdidas por pessoa em tarefas repetitivas', au.repetitiveHoursPerWeekPerPerson, 'Copiar/colar, responder o mesmo, planilhar', (v) => { au.repetitiveHoursPerWeekPerPerson = v; }),
      el(
        'div',
        { class: 'auditor-field auditor-field--full' },
        el('label', { for: 'au-workflow', text: 'Quais tarefas manuais consomem mais tempo da equipe hoje?' }),
        el('textarea', {
          id: 'au-workflow',
          maxlength: '1500',
          placeholder: 'Ex.: Responder dúvidas repetidas no WhatsApp, digitar orçamentos no Word, conferir comprovante, passar pedidos para planilha...',
          value: au.workflowDescription || '',
          oninput: (e) => { au.workflowDescription = e.target.value; }
        })
      )
    );
  }

  function renderStep2() {
    if (state.loading) {
      const stages = [
        '1/3 Validando entradas PT-BR e executando motor financeiro determinístico...',
        '2/3 Identificando vazamentos mensais, gargalos do nicho e potencial em 12 meses...',
        '3/3 Gerando plano de ação de 48h, scripts prontos e estrutura da planilha .XLSX...'
      ];
      return el(
        'div',
        { class: 'auditor-loading-box', role: 'status', 'aria-live': 'polite' },
        el('p', { class: 'kicker', text: 'Auditoria em andamento' }),
        el('h3', { text: `Auditando operação de ${getEffectiveNicheLabel(state)}...` }),
        el(
          'ul',
          { class: 'auditor-loading-stages' },
          stages.map((label, idx) => {
            const num = idx + 1;
            const cls = state.loadingStage > num ? 'is-done' : state.loadingStage === num ? 'is-current' : '';
            return el('li', { class: cls, text: `${state.loadingStage > num ? '✓ ' : ''}${label}` });
          })
        )
      );
    }

    const activeModMeta = MODULES_META.find((m) => m.id === state.moduleId) || MODULES_META[0];
    return el(
      'div',
      { class: 'auditor-panel' },
      el(
        'div',
        { class: 'auditor-block-head' },
        el(
          'div',
          {},
          el('p', { class: 'kicker', text: `${getEffectiveNicheLabel(state)} · ${activeModMeta.tag}` }),
          el('h3', { text: activeModMeta.title })
        ),
        el('button', {
          type: 'button',
          class: 'btn btn-small',
          text: '← Trocar Nicho ou Módulo',
          onclick: () => {
            state.step = 1;
            render();
          }
        })
      ),
      el(
        'div',
        { class: 'auditor-preset-banner' },
        el('p', { text: `Quer ver a auditoria completa funcionando na hora com números reais de ${getEffectiveNicheLabel(state)}?` }),
        el('button', {
          type: 'button',
          class: 'btn btn-small',
          id: 'auditor-fill-preset-btn',
          text: '⚡ Preencher com Caso Real deste Nicho',
          onclick: () => {
            applyPresetToForm(state.nicheId, state.customNicheName);
            state.statusMessage = `✓ Cenário realista de ${getEffectiveNicheLabel(state)} carregado nos campos abaixo.`;
            state.statusIsError = false;
            render();
          }
        })
      ),
      state.moduleId === 'whatsapp'
        ? renderModuleAForm()
        : state.moduleId === 'pricing'
          ? renderModuleBForm()
          : renderModuleCForm(),
      el('p', { class: 'auditor-field-hint', id: 'auditor-analysis-notice' },
        'Ao gerar o diagnóstico, você envia os dados do negócio ao Auditor. Um provedor de IA pode receber parte deles para redigir a análise. ',
        el('a', { href: '/privacidade/#auditor-ia', text: 'Saiba como os dados são usados', target: '_blank', rel: 'noopener' })
      ),
      state.statusMessage
        ? el('p', {
            class: `auditor-status-msg ${state.statusIsError ? 'auditor-status-msg--error' : ''}`.trim(),
            role: 'status',
            'aria-live': 'polite',
            text: state.statusMessage
          })
        : null,
      el(
        'div',
        { class: 'auditor-actions-bar' },
        el('button', {
          type: 'button',
          class: 'btn',
          text: '← Voltar',
          onclick: () => {
            state.step = 1;
            render();
          }
        }),
        el('button', {
          type: 'button',
          class: 'btn btn-primary',
          id: 'auditor-run-btn',
          'aria-describedby': 'auditor-analysis-notice',
          text: 'Gerar Diagnóstico & Plano com IA →',
          onclick: runAuditFlow
        })
      )
    );
  }

  function renderPricingItemsAuditTable(details) {
    if (!details?.items?.length) return null;
    const statusInfo = {
      prejuizo_invisivel: { text: 'Prejuízo invisível', cls: 'auditor-pill--danger' },
      margem_corroida: { text: 'Margem corroída', cls: 'auditor-pill--warn' },
      saudavel: { text: 'Saudável', cls: 'auditor-pill--ok' }
    };

    return el(
      'section',
      { class: 'auditor-section-card', 'aria-labelledby': 'auditor-pricing-table-title' },
      el('h4', { id: 'auditor-pricing-table-title', text: 'Raio-X Item a Item: Markup Aparente vs Margem Líquida Real' }),
      el(
        'div',
        { class: 'auditor-items-wrap' },
        el(
          'table',
          { class: 'auditor-items-table' },
          el(
            'thead',
            {},
            el(
              'tr',
              {},
              el('th', { text: 'Item' }),
              el('th', { text: 'Markup' }),
              el('th', { text: 'Margem Real' }),
              el('th', { text: 'Preço Atual' }),
              el('th', { text: 'Preço Ideal' }),
              el('th', { text: 'Vazamento/mês' }),
              el('th', { text: 'Status' })
            )
          ),
          el(
            'tbody',
            {},
            details.items.map((item) => {
              const badge = statusInfo[item.status] || statusInfo.saudavel;
              return el(
                'tr',
                {},
                el('td', { text: item.name }),
                el('td', { text: formatPct(item.markupPct) }),
                el('td', { text: formatPct(item.realMarginPct) }),
                el('td', { text: formatBRL(item.currentPrice) }),
                el('td', {}, el('strong', { text: item.idealPrice === null ? 'Meta inviável' : formatBRL(item.idealPrice) })),
                el('td', { text: item.monthlyMarginGapBRL === null ? '—' : formatBRL(item.monthlyMarginGapBRL) }),
                el('td', {}, el('span', { class: `auditor-pill ${badge.cls}`, text: badge.text }))
              );
            })
          )
        )
      )
    );
  }

  function renderStep3() {
    const result = state.result;
    if (!result) return renderStep1();

    const { audit, analysis, meta } = result;
    const { summary, details, moduleId, nicheLabel } = audit;
    const infeasible = details.isTargetMathematicallyInfeasible;
    const maxBarValue = Math.max(1, ...summary.comparisonBars.map((b) => Math.max(0, b.valueBRL)));

    const whatsappExecutiveHref = buildWhatsappLink(buildExecutiveWhatsappMessage(state, result));
    const trainingWaHref = buildWhatsappLink(
      `Olá, ${BRAND_CONFIG.founder}! Vi a Frente de Educação em IA após auditar ${state.lead.company || nicheLabel}${infeasible ? '' : ` (vazamento de ${formatBRL(summary.monthlyLeakageBRL)}/mês)`} e quero saber sobre cursos e treinamento prático para minha equipe.`
    );
    const engineeringWaHref = buildWhatsappLink(
      `Olá, ${BRAND_CONFIG.founder}! Vi a Frente de Engenharia Full-Stack após auditar ${state.lead.company || nicheLabel}${infeasible ? '' : ` (potencial de ${formatBRL(summary.projection12mBRL)}/ano)`} e quero cotar um site, sistema ou agente de IA no WhatsApp.`
    );

    const kpi4Label = moduleId === 'pricing'
      ? `${details.lossMakingCount + details.erodedCount} itens críticos`
      : `${formatInt(summary.hoursRecoveredMonthly)}h / mês`;
    const kpi4Sub = moduleId === 'pricing'
      ? `${details.lossMakingCount} em prejuízo invisível · ${details.erodedCount} abaixo da meta`
      : 'Tempo operacional recuperável pela equipe';

    return el(
      'div',
      { class: 'auditor-panel' },
      el(
        'div',
        { class: 'auditor-result-head' },
        el(
          'div',
          {},
          el('p', {
            class: 'kicker',
            text: `Painel Executivo · ${nicheLabel} (${meta?.mode === 'ai' ? `IA ${meta.provider}` : 'Motor Determinístico + Regras de Negócio'})`
          }),
          el('h3', { id: 'auditor-result-heading', tabindex: '-1', text: analysis.executiveHeadline })
        ),
        el(
          'div',
          { class: 'auditor-actions-group' },
          el('button', {
            type: 'button',
            class: 'btn btn-small',
            text: '✎ Ajustar Números',
            onclick: () => {
              state.step = 2;
              render();
            }
          }),
          el('button', {
            type: 'button',
            class: 'btn btn-small',
            text: 'Nova Auditoria',
            onclick: () => {
              state.step = 1;
              render();
            }
          })
        )
      ),
      el(
        'div',
        { class: 'auditor-kpi-grid' },
        infeasible ? el(
          'article',
          { class: 'auditor-kpi' },
          el('span', { text: 'Margem atual da carteira' }),
          el('strong', { text: formatPct(details.weightedCurrentMarginPct) }),
          el('small', { text: 'Revise as taxas ou a meta para projetar ganhos.' })
        ) : [
          el(
            'article',
            { class: 'auditor-kpi auditor-kpi--danger' },
            el('span', { text: 'Vazamento Mensal' }),
            el('strong', { text: formatBRL(summary.monthlyLeakageBRL) }),
            el('small', { text: 'Dinheiro deixado na mesa todo mês' })
          ),
          el(
            'article',
            { class: 'auditor-kpi auditor-kpi--positive' },
            el('span', { text: 'Potencial em 30 Dias' }),
            el('strong', { text: formatBRL(summary.cashPotential30dBRL) }),
            el('small', { text: `Faixa ${formatBRL(summary.cashConservative30dBRL)} a ${formatBRL(summary.cashAggressive30dBRL)}` })
          ),
          el(
            'article',
            { class: 'auditor-kpi' },
            el('span', { text: 'Projeção em 12 Meses' }),
            el('strong', { text: formatBRL(summary.projection12mBRL) }),
            el('small', { text: 'Impacto acumulado anualizado' })
          )
        ],
        el(
          'article',
          { class: 'auditor-kpi' },
          el('span', { text: moduleId === 'pricing' ? 'Itens para Reajuste' : 'Horas Recuperadas' }),
          el('strong', { text: kpi4Label }),
          el('small', { text: kpi4Sub })
        )
      ),
      infeasible ? null : el(
        'section',
        { class: 'auditor-section-card', 'aria-labelledby': 'auditor-chart-title' },
        el('h4', { id: 'auditor-chart-title', text: 'Comparativo Financeiro Mensal (Antes vs Otimizado)' }),
        el(
          'div',
          { class: 'auditor-bars' },
          summary.comparisonBars.map((bar) => {
            const pct = Math.max(4, Math.min(100, Math.round((Math.max(0, bar.valueBRL) / maxBarValue) * 100)));
            return el(
              'div',
              { class: 'auditor-bar-row' },
              el(
                'div',
                { class: 'auditor-bar-label' },
                el('span', { text: bar.label }),
                el('strong', { text: formatBRL(bar.valueBRL) })
              ),
              el(
                'div',
                { class: 'auditor-bar-track', role: 'presentation' },
                el('div', {
                  class: `auditor-bar-fill auditor-bar-fill--${bar.tone}`,
                  style: `width: ${pct}%`
                })
              )
            );
          })
        )
      ),
      moduleId === 'pricing' ? renderPricingItemsAuditTable(details) : null,
      el(
        'section',
        { class: 'auditor-section-card', 'aria-labelledby': 'auditor-diag-title' },
        el('h4', { id: 'auditor-diag-title', text: 'Diagnóstico Cirúrgico da Causa Raiz' }),
        el(
          'div',
          { class: 'auditor-diagnosis-text' },
          analysis.rootCauseDiagnosis.split('\n\n').map((para) => el('p', { text: para }))
        )
      ),
      el(
        'section',
        { class: 'auditor-section-card', 'aria-labelledby': 'auditor-48h-title' },
        el('h4', { id: 'auditor-48h-title', text: 'Plano de Ação Prático de 48 Horas' }),
        el(
          'div',
          { class: 'auditor-plan-grid' },
          analysis.plan48h.map((step) =>
            el(
              'article',
              { class: 'auditor-plan-step' },
              el('span', { class: 'auditor-plan-window', text: step.window }),
              el('strong', { text: step.title }),
              el('p', { text: step.action }),
              el('span', { class: 'auditor-plan-impact', text: `Impacto: ${step.expectedImpact}` })
            )
          )
        )
      ),
      el(
        'section',
        { class: 'auditor-section-card', 'aria-labelledby': 'auditor-split-title' },
        el('h4', { id: 'auditor-split-title', text: 'Mapa de Implementação: Equipe Capacitada vs Engenharia Sob Medida' }),
        el(
          'div',
          { class: 'auditor-split-grid' },
          el(
            'div',
            { class: 'auditor-split-col' },
            el('h5', { text: '1. O que sua equipe resolve em 1 semana com Treinamento Prático em IA' }),
            el('ul', { class: 'check-list' }, analysis.implementationSplit.teamWithAiTraining.map((li) => el('li', { text: li })))
          ),
          el(
            'div',
            { class: 'auditor-split-col' },
            el('h5', { text: '2. O que escala com um Sistema / Agente Sob Medida da André Studio' }),
            el('ul', { class: 'check-list' }, analysis.implementationSplit.customEngineeringStudio.map((li) => el('li', { text: li })))
          )
        )
      ),
      el(
        'section',
        { class: 'auditor-section-card', 'aria-labelledby': 'auditor-deliv-title' },
        el('h4', { id: 'auditor-deliv-title', text: 'Entregáveis Copiáveis Gerados para o seu Negócio' }),
        el(
          'div',
          { class: 'auditor-deliverables' },
          analysis.deliverables.map((item, idx) => {
            const isLocked = idx > 0 && !state.lead.unlocked;
            return el(
              'article',
              { class: `auditor-deliverable-card ${isLocked ? 'is-locked' : ''}`.trim() },
              el(
                'div',
                { class: 'auditor-deliverable-top' },
                el(
                  'div',
                  {},
                  el('span', { class: 'auditor-pill auditor-pill--ok', text: item.badge }),
                  el('strong', { style: 'display:block;margin-top:.35rem', text: item.title })
                ),
                !isLocked
                  ? el('button', {
                      type: 'button',
                      class: 'btn btn-small',
                      text: 'Copiar Script / Prompt',
                      onclick: async (e) => {
                        const btn = e.currentTarget;
                        try {
                          await navigator.clipboard.writeText(item.content);
                          btn.textContent = '✓ Copiado!';
                          setTimeout(() => { btn.textContent = 'Copiar Script / Prompt'; }, 1800);
                        } catch {
                          btn.textContent = 'Selecione o texto abaixo';
                        }
                      }
                    })
                  : el('span', { class: 'auditor-pill auditor-pill--warn', text: 'Desbloqueado no pacote .XLSX abaixo' })
              ),
              el('pre', { class: 'auditor-deliverable-pre', text: item.content }),
              el('p', { class: 'auditor-field-hint', text: `Dica de uso: ${item.usageTip}` })
            );
          })
        )
      ),
      el(
        'section',
        { class: 'auditor-lead-box', id: 'auditor-export-box', 'aria-labelledby': 'auditor-lead-title' },
        el('p', { class: 'kicker', text: 'Exportação Executiva Gratuita (.XLSX em 3 Abas)' }),
        el('h4', {
          id: 'auditor-lead-title',
          style: 'font-size: clamp(1.2rem, 2.2vw, 1.65rem)',
          text: state.lead.unlocked
            ? 'Planilha Executiva (.XLSX) e Todos os Scripts Desbloqueados!'
            : infeasible ? 'Baixe a planilha com as margens atuais e os itens para revisão'
            : 'Baixe sua Planilha Executiva (.XLSX) com Projeção de 12 Meses + Todos os Scripts'
        }),
        el('p', {
          class: 'auditor-block-sub',
          text: 'Inclui 3 abas organizadas: Diagnostico_Caixa, Ferramentas_e_Scripts e Plano_Implementacao_30D pronta para abrir no Excel ou Google Sheets.'
        }),
        !state.lead.unlocked && el('p', { class: 'auditor-block-sub', id: 'auditor-lead-privacy' },
          'Ao baixar, você envia nome, empresa, WhatsApp e um resumo do diagnóstico à André Studio, que pode falar com você sobre o resultado. ',
          el('a', { href: '/privacidade/#auditor-ia', text: 'Política de privacidade', target: '_blank', rel: 'noopener' })
        ),
        !state.lead.unlocked
          ? el(
              'form',
              {
                class: 'auditor-lead-form',
                onsubmit: async (e) => {
                  e.preventDefault();
                  const name = state.lead.name.trim();
                  const company = state.lead.company.trim();
                  const digits = extractBrPhoneDigits(state.lead.whatsapp);
                  if (name.length < 2 || company.length < 2 || digits.length < 10) {
                    state.lead.feedback = 'Preencha seu nome, empresa/ramo e WhatsApp válido com DDD.';
                    render();
                    return;
                  }
                  state.lead.submitting = true;
                  state.lead.feedback = 'Gerando planilha .xlsx executiva...';
                  render();

                  try {
                    await fetch('/api/auditor-lead', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        name,
                        company,
                        whatsapp: state.lead.whatsapp,
                        nicheLabel,
                        moduleId,
                        monthlyLeakageBRL: summary.monthlyLeakageBRL,
                        projection12mBRL: summary.projection12mBRL
                      })
                    }).catch(() => null);

                    state.lead.unlocked = true;
                    state.lead.submitting = false;
                    await downloadExecutiveXlsx();
                    state.lead.feedback = '✓ Planilha .xlsx baixada e entregáveis completos desbloqueados acima!';
                  } catch (err) {
                    state.lead.submitting = false;
                    state.lead.feedback = err.message || 'Erro ao gerar arquivo .xlsx.';
                  }
                  render();
                }
              },
              el(
                'div',
                { class: 'auditor-field' },
                el('label', { for: 'lead-name', text: 'Seu nome *' }),
                el('input', {
                  id: 'lead-name',
                  type: 'text',
                  required: true,
                  maxlength: '80',
                  placeholder: 'Ex.: Mariana Costa',
                  value: state.lead.name,
                  oninput: (e) => { state.lead.name = e.target.value; }
                })
              ),
              el(
                'div',
                { class: 'auditor-field' },
                el('label', { for: 'lead-company', text: 'Empresa / Ramo *' }),
                el('input', {
                  id: 'lead-company',
                  type: 'text',
                  required: true,
                  maxlength: '100',
                  placeholder: 'Ex.: Clínica Odonto Mais',
                  value: state.lead.company,
                  oninput: (e) => { state.lead.company = e.target.value; }
                })
              ),
              el(
                'div',
                { class: 'auditor-field' },
                el('label', { for: 'lead-whatsapp', text: 'WhatsApp com DDD *' }),
                el('input', {
                  id: 'lead-whatsapp',
                  type: 'tel',
                  required: true,
                  maxlength: '16',
                  placeholder: '(98) 98148-3900',
                  value: state.lead.whatsapp,
                  oninput: (e) => {
                    const masked = formatPhoneMaskBr(e.target.value);
                    state.lead.whatsapp = masked;
                    e.target.value = masked;
                  }
                })
              ),
              el('button', {
                type: 'submit',
                class: 'btn btn-primary',
                id: 'auditor-unlock-xlsx-btn',
                'aria-describedby': 'auditor-lead-privacy',
                disabled: state.lead.submitting,
                text: state.lead.submitting ? 'Gerando .XLSX...' : 'Liberar & Baixar Planilha .XLSX'
              })
            )
          : el(
              'div',
              { class: 'auditor-actions-group', style: 'margin-top: 1rem' },
              el('button', {
                type: 'button',
                class: 'btn btn-primary',
                id: 'auditor-redownload-xlsx-btn',
                text: '⬇ Baixar Planilha (.XLSX) Novamente',
                onclick: downloadExecutiveXlsx
              }),
              el('a', {
                class: 'btn',
                id: 'auditor-send-wa-btn',
                href: whatsappExecutiveHref,
                target: '_blank',
                rel: 'noopener noreferrer',
                text: 'Enviar Resumo no WhatsApp da André Studio ↗'
              })
            ),
        state.lead.feedback
          ? el('p', { class: 'auditor-status-msg', role: 'status', 'aria-live': 'polite', text: state.lead.feedback })
          : null,
        !state.lead.unlocked
          ? el(
              'div',
              { style: 'margin-top: 1rem' },
              el('a', {
                class: 'home-text-link',
                href: whatsappExecutiveHref,
                target: '_blank',
                rel: 'noopener noreferrer',
                text: 'Ou envie este resumo executivo direto no WhatsApp da André Studio →'
              })
            )
          : null
      ),
      el(
        'div',
        { class: 'auditor-conversion-grid' },
        el(
          'article',
          { class: 'auditor-conv-card' },
          el('span', { class: 'card-index', text: BRAND_CONFIG.verticals[0].index }),
          el('h4', { text: 'Quer capacitar sua equipe em IA do zero?' }),
          el('p', { text: 'Cursos práticos, mentoria aplicada e treinamento in-company para empresários e times comerciais usarem IA todos os dias sem depender de código.' }),
          el(
            'div',
            { class: 'auditor-conv-actions' },
            el('a', {
              class: 'btn btn-primary btn-small',
              href: trainingWaHref,
              target: '_blank',
              rel: 'noopener noreferrer',
              text: 'Treinamento em IA no WhatsApp ↗'
            }),
            el('a', {
              class: 'btn btn-small',
              href: BRAND_CONFIG.links.kits,
              text: 'Ver Kits & Capacitação'
            })
          )
        ),
        el(
          'article',
          { class: 'auditor-conv-card auditor-conv-card--highlight' },
          el('span', { class: 'card-index', text: BRAND_CONFIG.verticals[1].index }),
          el('h4', { text: 'Quer o sistema ou agente de IA pronto na empresa?' }),
          el('p', { text: 'Desenvolvemos sites de alta conversão, sistemas web completos, painéis financeiros e agentes de IA integrados ao WhatsApp no ecossistema Cloudflare.' }),
          el(
            'div',
            { class: 'auditor-conv-actions' },
            el('a', {
              class: 'btn btn-primary btn-small',
              href: engineeringWaHref,
              target: '_blank',
              rel: 'noopener noreferrer',
              text: 'Cotar Sistema / Agente IA ↗'
            }),
            el('a', {
              class: 'btn btn-small',
              href: BRAND_CONFIG.links.services,
              text: 'Ver Soluções & Projetos'
            })
          )
        )
      )
    );
  }

  function render() {
    const content = state.step === 1
      ? renderStep1()
      : state.step === 2
        ? renderStep2()
        : renderStep3();
    rootEl.replaceChildren(el('div', { class: 'auditor-shell' }, renderStepper(), content));
  }

  // Permite que atalhos na Hero da página inicial selecionem o módulo direto.
  document.querySelectorAll('[data-auditor-module]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const modId = trigger.getAttribute('data-auditor-module');
      if (['whatsapp', 'pricing', 'automation'].includes(modId)) {
        state.moduleId = modId;
        state.step = 1;
        render();
      }
    });
  });

  render();
  return {
    getState: () => state,
    setModule: (modId) => {
      if (['whatsapp', 'pricing', 'automation'].includes(modId)) {
        state.moduleId = modId;
        render();
      }
    }
  };
}

const defaultRoot = document.getElementById('auditor-app-root');
if (defaultRoot) {
  mountAuditorApp(defaultRoot);
}
