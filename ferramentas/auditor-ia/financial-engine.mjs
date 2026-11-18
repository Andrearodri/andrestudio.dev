// Motor financeiro determinístico e parser PT-BR (zero dependências externas).
// Compatível com Browser, Cloudflare Pages/Workers Edge e Node.js.

const WEEKS_PER_MONTH = 52 / 12;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round2(value) {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function round1(value) {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Converte entradas monetárias, percentuais ou numéricas no padrão PT-BR/EN sem retornar NaN.
 * Suporta "R$ 1.450,90", "1450,90", "12,5%", "(450,00)", "1,450.90", "1.500" etc.
 * @param {unknown} raw
 * @param {number} [fallback=0]
 * @param {{ mode?: 'auto' | 'currency' | 'percent' | 'integer' }} [options]
 * @returns {number}
 */
export function parsePtBrNumber(raw, fallback = 0, options = {}) {
  const safeFallback = Number.isFinite(fallback) ? fallback : 0;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return safeFallback;
    return Object.is(raw, -0) ? 0 : raw;
  }
  if (raw === null || raw === undefined || typeof raw === 'boolean') {
    return safeFallback;
  }

  let text = String(raw).trim();
  if (!text) return safeFallback;

  const hasPercentSymbol = text.includes('%');
  const mode = hasPercentSymbol ? 'percent' : (options.mode || 'auto');

  let isNegative = false;
  if (text.startsWith('(') && text.endsWith(')')) {
    isNegative = true;
    text = text.slice(1, -1).trim();
  }

  text = text
    .replace(/[\u00A0\s]+/g, '')
    .replace(/R\$/gi, '')
    .replace(/BRL/gi, '')
    .replace(/[$%]/g, '')
    .replace(/−/g, '-');

  if (!text) return safeFallback;

  if (text.startsWith('-')) {
    isNegative = !isNegative;
    text = text.slice(1);
  } else if (text.startsWith('+')) {
    text = text.slice(1);
  }

  if (text.endsWith('-')) {
    isNegative = !isNegative;
    text = text.slice(0, -1);
  }

  // Mantém apenas dígitos, pontos e vírgulas após limpar prefixos/sufixos.
  text = text.replace(/[^0-9.,]/g, '');
  if (!text || !/\d/.test(text)) return safeFallback;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  let normalized = text;

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // Formato brasileiro: 1.450,90
      normalized = text.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato americano: 1,450.90
      normalized = text.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    const commaCount = (text.match(/,/g) || []).length;
    if (commaCount > 1 && /^\d{1,3}(,\d{3})+$/.test(text)) {
      normalized = text.replace(/,/g, '');
    } else {
      const idx = text.lastIndexOf(',');
      normalized = `${text.slice(0, idx).replace(/,/g, '')}.${text.slice(idx + 1)}`;
    }
  } else if (lastDot !== -1) {
    const dotCount = (text.match(/\./g) || []).length;
    if (dotCount > 1) {
      normalized = text.replace(/\./g, '');
    } else if (mode !== 'percent' && /^[1-9]\d{0,2}\.\d{3}$/.test(text)) {
      // Ex.: "R$ 1.500" ou "1.200" leads em notação de milhar brasileira.
      normalized = text.replace('.', '');
    }
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return safeFallback;
  const signed = isNegative ? -parsed : parsed;
  return Object.is(signed, -0) ? 0 : signed;
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatBRL(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return brlFormatter.format(safe).replace(/\u00A0/g, ' ');
}

export function formatPct(value, digits = 1) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(safe)}%`;
}

export function formatInt(value) {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0
  }).format(safe);
}

/**
 * Parser resiliente de CSV/TSV brasileiro (suporta ";", ",", "\t", BOM UTF-8 e aspas escapadas).
 * @param {string} rawText
 * @returns {string[][]}
 */
export function parseDelimitedText(rawText) {
  const clean = String(rawText ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!clean.trim()) return [];

  const sampleLines = clean.split('\n').filter((line) => line.trim()).slice(0, 6);
  const countOutsideQuotes = (line, sep) => {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (!inQuotes && ch === sep) {
        count++;
      }
    }
    return count;
  };

  const candidates = [';', ',', '\t'];
  let delimiter = ';';
  let bestScore = -1;
  for (const sep of candidates) {
    const score = sampleLines.reduce((acc, line) => acc + countOutsideQuotes(line, sep), 0);
    if (score > bestScore) {
      bestScore = score;
      delimiter = sep;
    }
  }

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n') {
      row.push(field.trim());
      if (row.some((cell) => cell !== '')) {
        rows.push(row);
      }
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell !== '')) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeaderToken(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Converte linhas brutas de CSV/XLSX ou objetos em itens normalizados do Módulo B.
 * @param {Array<Record<string, unknown> | unknown[]>} rows
 */
export function normalizePricingItems(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  if (!Array.isArray(rows[0]) && typeof rows[0] === 'object' && rows[0] !== null) {
    return rows
      .slice(0, 500)
      .map((item, idx) => ({
        name: String(item.name ?? item.item ?? item.produto ?? item.servico ?? `Item ${idx + 1}`)
          .trim()
          .slice(0, 120),
        unitCost: Math.max(0, round2(parsePtBrNumber(item.unitCost ?? item.custo ?? item.cmv, 0, { mode: 'currency' }))),
        currentPrice: Math.max(0, round2(parsePtBrNumber(item.currentPrice ?? item.preco ?? item.valor, 0, { mode: 'currency' }))),
        monthlyQty: Math.max(0, Math.round(parsePtBrNumber(item.monthlyQty ?? item.qtd ?? item.quantidade, 1, { mode: 'integer' })))
      }))
      .filter((item) => item.name && !/^(total(\s+geral)?|subtotal|soma)$/i.test(item.name));
  }

  const row0 = Array.isArray(rows[0]) ? rows[0] : [];
  const headerTokens = row0.map(normalizeHeaderToken);
  const findCol = (patterns) =>
    headerTokens.findIndex((token) => patterns.some((rx) => rx.test(token)));

  const nameIdx = findCol([/^(item|produto|produtos|servico|servicos|nome|descricao|titulo|sku|procedimento)(_.*)?$/]);
  const costIdx = findCol([/custo/, /cmv/, /insumo/, /cost/]);
  const priceIdx = findCol([/preco/, /venda/, /valor/, /price/, /ticket/]);
  const qtyIdx = findCol([/qtd/, /quant/, /volume/, /vendas/, /mensal/, /qty/]);

  const row0HasNumericCostOrPrice = /\d/.test(String(row0[1] ?? '')) || /\d/.test(String(row0[2] ?? ''));
  const hasHeader = (costIdx !== -1 || priceIdx !== -1) || (nameIdx !== -1 && !row0HasNumericCostOrPrice);
  const startRow = hasHeader ? 1 : 0;
  const colName = nameIdx !== -1 ? nameIdx : 0;
  const colCost = costIdx !== -1 ? costIdx : 1;
  const colPrice = priceIdx !== -1 ? priceIdx : 2;
  const colQty = qtyIdx !== -1 ? qtyIdx : 3;

  const items = [];
  for (let i = startRow; i < rows.length && items.length < 500; i++) {
    const row = Array.isArray(rows[i]) ? rows[i] : [];
    const name = String(row[colName] ?? '').trim().slice(0, 120);
    if (!name || /^(total(\s+geral)?|subtotal|soma|resumo)$/i.test(name)) {
      continue;
    }
    const rawCost = row[colCost];
    const rawPrice = row[colPrice];
    const rawQty = row[colQty];
    if (
      (rawCost === undefined || rawCost === '') &&
      (rawPrice === undefined || rawPrice === '')
    ) {
      continue;
    }
    const unitCost = Math.max(0, round2(parsePtBrNumber(rawCost, 0, { mode: 'currency' })));
    const currentPrice = Math.max(0, round2(parsePtBrNumber(rawPrice, 0, { mode: 'currency' })));
    const hasQty = rawQty !== undefined && String(rawQty).trim() !== '';
    const monthlyQty = hasQty
      ? Math.max(0, Math.round(parsePtBrNumber(rawQty, 0, { mode: 'integer' })))
      : 1;

    items.push({ name, unitCost, currentPrice, monthlyQty });
  }

  return items;
}

/**
 * Módulo A: Auditoria de Recuperação de Orçamentos no WhatsApp.
 */
export function calculateWhatsappAudit(input = {}) {
  const leadsPerMonth = Math.max(0, Math.round(parsePtBrNumber(input.leadsPerMonth, 0, { mode: 'integer' })));
  const currentConversionPct = clamp(parsePtBrNumber(input.currentConversionPct, 0, { mode: 'percent' }), 0, 100);
  const averageTicket = Math.max(0, round2(parsePtBrNumber(input.averageTicket, 0, { mode: 'currency' })));
  const hasMarginInput = input.grossMarginPct !== undefined && String(input.grossMarginPct).trim() !== '';
  const grossMarginPct = clamp(parsePtBrNumber(hasMarginInput ? input.grossMarginPct : 65, 65, { mode: 'percent' }), 1, 100);
  const avgResponseMinutes = Math.max(1, Math.round(parsePtBrNumber(input.avgResponseMinutes, 45, { mode: 'integer' })));
  const followUpSteps = clamp(Math.round(parsePtBrNumber(input.followUpSteps, 1, { mode: 'integer' })), 0, 5);

  const closedCurrent = round2(leadsPerMonth * (currentConversionPct / 100));
  const lostLeadsMonthly = Math.max(0, round2(leadsPerMonth - closedCurrent));
  const currentMonthlyRevenue = round2(closedCurrent * averageTicket);
  const revenueLeftOnTableMonthly = round2(lostLeadsMonthly * averageTicket);

  const maxAdditionalDeals = Math.max(0, round2(leadsPerMonth * 0.95 - closedCurrent));
  const marginRatio = grossMarginPct / 100;

  const buildScenario = (label, ratePct) => {
    const recoveredDeals = round2(Math.min(maxAdditionalDeals, lostLeadsMonthly * (ratePct / 100)));
    const revenue30dBRL = round2(recoveredDeals * averageTicket);
    const margin30dBRL = round2(revenue30dBRL * marginRatio);
    const projectedConversionPct = leadsPerMonth > 0
      ? round1(((closedCurrent + recoveredDeals) / leadsPerMonth) * 100)
      : 0;
    return {
      label,
      reactivationRatePct: ratePct,
      recoveredDeals,
      revenue30dBRL,
      margin30dBRL,
      projectedConversionPct
    };
  };

  const conservative = buildScenario('Conservadora (5%)', 5);
  const moderate = buildScenario('Moderada (12%)', 12);
  const aggressive = buildScenario('Agressiva (20%)', 20);

  const annualizedModerateRevenue = round2(moderate.revenue30dBRL * 12);
  const annualizedModerateMargin = round2(moderate.margin30dBRL * 12);
  const referenceProjectInvestment = leadsPerMonth > 0 && averageTicket > 0
    ? Math.max(1800, Math.min(6500, Math.round(moderate.margin30dBRL * 1.15)))
    : 0;
  const annualRoiPct = referenceProjectInvestment > 0
    ? round1(((annualizedModerateMargin - referenceProjectInvestment) / referenceProjectInvestment) * 100)
    : 0;
  const paybackDays = moderate.margin30dBRL > 0
    ? Math.max(1, Math.round((referenceProjectInvestment / moderate.margin30dBRL) * 30))
    : 0;
  const hoursSavedMonthly = round1((leadsPerMonth * 7.5) / 60);

  return {
    leadsPerMonth,
    currentConversionPct: round1(currentConversionPct),
    averageTicket,
    grossMarginPct: round1(grossMarginPct),
    avgResponseMinutes,
    followUpSteps,
    closedCurrent,
    lostLeadsMonthly,
    currentMonthlyRevenue,
    revenueLeftOnTableMonthly,
    scenarios: {
      conservative,
      moderate,
      aggressive
    },
    annualizedModerateRevenue,
    annualizedModerateMargin,
    referenceProjectInvestment,
    annualRoiPct,
    paybackDays,
    hoursSavedMonthly
  };
}

/**
 * Módulo B: Auditoria de Margem Líquida vs Markup, Taxas e Precificação Ideal.
 */
export function calculatePricingAudit(input = {}) {
  const cardFeePct = clamp(parsePtBrNumber(input.cardFeePct, 0, { mode: 'percent' }), 0, 50);
  const taxRatePct = clamp(parsePtBrNumber(input.taxRatePct, 0, { mode: 'percent' }), 0, 50);
  const hiddenCostsPct = clamp(parsePtBrNumber(input.hiddenCostsPct, 0, { mode: 'percent' }), 0, 50);
  const fixedMonthlyOverhead = Math.max(0, round2(parsePtBrNumber(input.fixedMonthlyOverhead, 0, { mode: 'currency' })));
  const hasTarget = input.targetNetMarginPct !== undefined && String(input.targetNetMarginPct).trim() !== '';
  const targetNetMarginPct = clamp(parsePtBrNumber(hasTarget ? input.targetNetMarginPct : 20, 20, { mode: 'percent' }), 1, 75);

  const deductionPercent = cardFeePct + taxRatePct + hiddenCostsPct;
  const deductionRate = deductionPercent / 100;
  const deductionPct = round1(deductionPercent);
  // Trabalhar em pontos percentuais evita subtrair duas frações de 1 no limite de 100%.
  const remainingPct = 100 - (deductionPercent + targetNetMarginPct);

  const rawItems = Array.isArray(input.items) ? input.items : [];
  const normalized = normalizePricingItems(rawItems);

  const items = normalized.map((item) => {
    const unitCost = Math.max(0, round2(item.unitCost));
    const currentPrice = Math.max(0, round2(item.currentPrice));
    const monthlyQty = Math.max(0, Math.round(item.monthlyQty));

    const markupPct = unitCost > 0
      ? round1(((currentPrice - unitCost) / unitCost) * 100)
      : (currentPrice > 0 ? 100 : 0);
    const markupMultiplier = unitCost > 0 ? round2(currentPrice / unitCost) : 0;
    const variableDeductionsBRL = round2(currentPrice * deductionRate);
    const unitContributionBRL = round2(currentPrice - unitCost - variableDeductionsBRL);
    const realMarginPct = currentPrice > 0
      ? round1((unitContributionBRL / currentPrice) * 100)
      : (unitCost > 0 ? -100 : 0);
    const markupIllusionGapPct = round1(markupPct - realMarginPct);

    const isTargetMathematicallyInfeasible = remainingPct < -1e-12 || (remainingPct <= 1e-12 && unitCost > 0);
    let idealPrice = null;
    let monthlyIdealContribution = null;
    let monthlyMarginGapBRL = null;

    let status = 'saudavel';
    if (unitContributionBRL < -0.005) {
      status = 'prejuizo_invisivel';
    } else if (realMarginPct + 0.05 < targetNetMarginPct) {
      status = 'margem_corroida';
    }

    const monthlyRevenue = round2(currentPrice * monthlyQty);
    const monthlyContribution = round2(unitContributionBRL * monthlyQty);
    if (!isTargetMathematicallyInfeasible) {
      idealPrice = unitCost > 0 ? round2(unitCost * 100 / remainingPct) : currentPrice;
      const idealUnitContribution = idealPrice - unitCost - idealPrice * deductionRate;
      monthlyIdealContribution = round2(idealUnitContribution * monthlyQty);
      monthlyMarginGapBRL = round2(Math.max(0, (idealPrice - currentPrice) * (1 - deductionRate) * monthlyQty));
    }
    const directMonthlyLossBRL = unitContributionBRL < 0
      ? round2(Math.abs(unitContributionBRL) * monthlyQty)
      : 0;

    return {
      name: item.name,
      unitCost,
      currentPrice,
      monthlyQty,
      markupPct,
      markupMultiplier,
      variableDeductionsBRL,
      unitContributionBRL,
      realMarginPct,
      markupIllusionGapPct,
      idealPrice,
      isTargetMathematicallyInfeasible,
      status,
      monthlyRevenue,
      monthlyContribution,
      monthlyIdealContribution,
      monthlyMarginGapBRL,
      directMonthlyLossBRL
    };
  });

  const totalCurrentRevenue = round2(items.reduce((acc, item) => acc + item.monthlyRevenue, 0));
  const totalCurrentContribution = round2(items.reduce((acc, item) => acc + item.monthlyContribution, 0));
  const weightedCurrentMarginPct = totalCurrentRevenue > 0
    ? round1((totalCurrentContribution / totalCurrentRevenue) * 100)
    : 0;
  const netOperatingResultBRL = round2(totalCurrentContribution - fixedMonthlyOverhead);

  const lossMakingCount = items.filter((item) => item.status === 'prejuizo_invisivel').length;
  const erodedCount = items.filter((item) => item.status === 'margem_corroida').length;
  const healthyCount = items.filter((item) => item.status === 'saudavel').length;

  const totalDirectMonthlyLossBRL = round2(items.reduce((acc, item) => acc + item.directMonthlyLossBRL, 0));
  const isTargetMathematicallyInfeasible = items.some((item) => item.isTargetMathematicallyInfeasible);
  let monthlyRecoverableProfitBRL = null;
  let annualRecoverableProfitBRL = null;
  let totalPotentialContribution = null;
  let projectedNetOperatingResultBRL = null;
  if (!isTargetMathematicallyInfeasible) {
    monthlyRecoverableProfitBRL = round2(items.reduce((acc, item) => acc + item.monthlyMarginGapBRL, 0));
    annualRecoverableProfitBRL = round2(monthlyRecoverableProfitBRL * 12);
    totalPotentialContribution = round2(totalCurrentContribution + monthlyRecoverableProfitBRL);
    projectedNetOperatingResultBRL = round2(totalPotentialContribution - fixedMonthlyOverhead);
  }
  const hoursRecoveredMonthly = items.length > 0 ? round1(4 + items.length * 0.6) : 0;

  return {
    cardFeePct: round1(cardFeePct),
    taxRatePct: round1(taxRatePct),
    hiddenCostsPct: round1(hiddenCostsPct),
    deductionPct,
    fixedMonthlyOverhead,
    targetNetMarginPct: round1(targetNetMarginPct),
    isTargetMathematicallyInfeasible,
    items,
    totalCurrentRevenue,
    totalCurrentContribution,
    weightedCurrentMarginPct,
    netOperatingResultBRL,
    lossMakingCount,
    erodedCount,
    healthyCount,
    totalDirectMonthlyLossBRL,
    monthlyRecoverableProfitBRL,
    annualRecoverableProfitBRL,
    totalPotentialContribution,
    projectedNetOperatingResultBRL,
    hoursRecoveredMonthly
  };
}

/**
 * Módulo C: Mapeamento de Automação e Produtividade da Equipe.
 */
export function calculateAutomationAudit(input = {}) {
  const teamSize = Math.max(0, Math.round(parsePtBrNumber(input.teamSize, 0, { mode: 'integer' })));
  const avgMonthlySalary = Math.max(0, round2(parsePtBrNumber(input.avgMonthlySalary, 0, { mode: 'currency' })));
  const hasMultiplier = input.chargesMultiplier !== undefined && String(input.chargesMultiplier).trim() !== '';
  const chargesMultiplier = clamp(parsePtBrNumber(hasMultiplier ? input.chargesMultiplier : 1.38, 1.38, { mode: 'percent' }), 1, 3);
  const hasHours = input.productiveHoursPerMonth !== undefined && String(input.productiveHoursPerMonth).trim() !== '';
  const productiveHoursPerMonth = Math.max(1, round1(parsePtBrNumber(hasHours ? input.productiveHoursPerMonth : 160, 160, { mode: 'integer' })));
  const repetitiveHoursPerWeekPerPerson = clamp(parsePtBrNumber(input.repetitiveHoursPerWeekPerPerson, 0, { mode: 'percent' }), 0, 80);

  const monthlyCostPerPerson = round2(avgMonthlySalary * chargesMultiplier);
  const realHourlyCost = round2(monthlyCostPerPerson / productiveHoursPerMonth);

  const monthlyWastedHoursTotal = round1(teamSize * repetitiveHoursPerWeekPerPerson * WEEKS_PER_MONTH);
  const annualWastedHoursTotal = round1(monthlyWastedHoursTotal * 12);
  const monthlyFinancialWasteBRL = round2(monthlyWastedHoursTotal * realHourlyCost);
  const annualFinancialWasteBRL = round2(monthlyFinancialWasteBRL * 12);

  // Ganho rápido via Treinamento Prático em IA (35% de ganho de produtividade imediato)
  const trainingHoursSavedMonthly = round1(monthlyWastedHoursTotal * 0.35);
  const trainingMonthlySavingsBRL = round2(monthlyFinancialWasteBRL * 0.35);
  const trainingAnnualSavingsBRL = round2(trainingMonthlySavingsBRL * 12);

  // Ganho estrutural com Sistema/Automação Sob Medida (72% de eliminação de tarefa manual)
  const automationHoursSavedMonthly = round1(monthlyWastedHoursTotal * 0.72);
  const automationMonthlySavingsBRL = round2(monthlyFinancialWasteBRL * 0.72);
  const automationAnnualSavingsBRL = round2(automationMonthlySavingsBRL * 12);

  return {
    teamSize,
    avgMonthlySalary,
    chargesMultiplier: round2(chargesMultiplier),
    productiveHoursPerMonth,
    repetitiveHoursPerWeekPerPerson: round1(repetitiveHoursPerWeekPerPerson),
    monthlyCostPerPerson,
    realHourlyCost,
    monthlyWastedHoursTotal,
    annualWastedHoursTotal,
    monthlyFinancialWasteBRL,
    annualFinancialWasteBRL,
    trainingHoursSavedMonthly,
    trainingMonthlySavingsBRL,
    trainingAnnualSavingsBRL,
    automationHoursSavedMonthly,
    automationMonthlySavingsBRL,
    automationAnnualSavingsBRL
  };
}

/**
 * Orquestra o módulo selecionado e devolve um resumo padronizado + detalhes exatos.
 */
export function runFinancialAudit(payload = {}) {
  const moduleId = ['whatsapp', 'pricing', 'automation'].includes(payload.moduleId)
    ? payload.moduleId
    : 'whatsapp';
  const nicheId = String(payload.nicheId || 'custom').trim() || 'custom';
  const nicheLabel = String(payload.nicheLabel || 'Negócio Customizado').trim().slice(0, 80) || 'Negócio Customizado';

  if (moduleId === 'whatsapp') {
    const details = calculateWhatsappAudit(payload.whatsapp || payload);
    const summary = {
      monthlyLeakageBRL: details.revenueLeftOnTableMonthly,
      cashConservative30dBRL: details.scenarios.conservative.revenue30dBRL,
      cashPotential30dBRL: details.scenarios.moderate.revenue30dBRL,
      cashAggressive30dBRL: details.scenarios.aggressive.revenue30dBRL,
      projection12mBRL: details.annualizedModerateRevenue,
      hoursRecoveredMonthly: details.hoursSavedMonthly,
      criticalItemsCount: Math.round(details.lostLeadsMonthly),
      comparisonBars: [
        { label: 'Faturamento Atual/mês', valueBRL: details.currentMonthlyRevenue, tone: 'muted' },
        { label: 'Deixado na Mesa/mês', valueBRL: details.revenueLeftOnTableMonthly, tone: 'danger' },
        { label: 'Reativação 30d (Moderada)', valueBRL: details.scenarios.moderate.revenue30dBRL, tone: 'accent' },
        { label: 'Novo Potencial Mensal', valueBRL: round2(details.currentMonthlyRevenue + details.scenarios.moderate.revenue30dBRL), tone: 'positive' }
      ]
    };
    return { moduleId, nicheId, nicheLabel, summary, details };
  }

  if (moduleId === 'pricing') {
    const details = calculatePricingAudit(payload.pricing || payload);
    const summary = {
      monthlyLeakageBRL: details.monthlyRecoverableProfitBRL,
      cashConservative30dBRL: details.isTargetMathematicallyInfeasible ? null : round2(details.monthlyRecoverableProfitBRL * 0.5),
      cashPotential30dBRL: details.monthlyRecoverableProfitBRL,
      cashAggressive30dBRL: details.isTargetMathematicallyInfeasible ? null : round2(details.monthlyRecoverableProfitBRL + details.totalDirectMonthlyLossBRL),
      projection12mBRL: details.annualRecoverableProfitBRL,
      hoursRecoveredMonthly: details.hoursRecoveredMonthly,
      criticalItemsCount: details.lossMakingCount + details.erodedCount,
      comparisonBars: details.isTargetMathematicallyInfeasible ? [] : [
        { label: 'Margem Contrib. Atual/mês', valueBRL: Math.max(0, details.totalCurrentContribution), tone: 'muted' },
        { label: 'Vazamento Mensal (Subprecificação)', valueBRL: details.monthlyRecoverableProfitBRL, tone: 'danger' },
        { label: 'Margem Otimizada/mês', valueBRL: Math.max(0, details.totalPotentialContribution), tone: 'positive' }
      ]
    };
    return { moduleId, nicheId, nicheLabel, summary, details };
  }

  const details = calculateAutomationAudit(payload.automation || payload);
  const summary = {
    monthlyLeakageBRL: details.monthlyFinancialWasteBRL,
    cashConservative30dBRL: details.trainingMonthlySavingsBRL,
    cashPotential30dBRL: details.automationMonthlySavingsBRL,
    cashAggressive30dBRL: details.monthlyFinancialWasteBRL,
    projection12mBRL: details.automationAnnualSavingsBRL,
    hoursRecoveredMonthly: details.automationHoursSavedMonthly,
    criticalItemsCount: details.teamSize,
    comparisonBars: [
      { label: 'Desperdício Manual Atual/mês', valueBRL: details.monthlyFinancialWasteBRL, tone: 'danger' },
      { label: 'Ganho Rápido (Treinamento IA)', valueBRL: details.trainingMonthlySavingsBRL, tone: 'accent' },
      { label: 'Economia Estrutural (Automação)', valueBRL: details.automationMonthlySavingsBRL, tone: 'positive' }
    ]
  };
  return { moduleId, nicheId, nicheLabel, summary, details };
}

/**
 * Gera um CSV modelo no padrão brasileiro (separador ";" e BOM UTF-8).
 */
export function buildCsvTemplateFromItems(items = []) {
  const safeItems = Array.isArray(items) && items.length > 0
    ? items
    : [
        { name: 'Produto ou Serviço Exemplo A', unitCost: 45, currentPrice: 90, monthlyQty: 40 },
        { name: 'Produto ou Serviço Exemplo B', unitCost: 110, currentPrice: 145, monthlyQty: 25 }
      ];

  const escapeCsv = (val) => {
    const str = String(val ?? '');
    if (/[;"\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const toPtDecimal = (n) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2).replace('.', ',') : '0,00');

  const header = ['Item', 'Custo Unitario (R$)', 'Preco Atual (R$)', 'Qtd Mensal'].join(';');
  const lines = safeItems.map((item) => [
    escapeCsv(item.name),
    toPtDecimal(item.unitCost),
    toPtDecimal(item.currentPrice),
    String(Math.round(Number(item.monthlyQty) || 0))
  ].join(';'));

  return `\uFEFF${[header, ...lines].join('\r\n')}\r\n`;
}
