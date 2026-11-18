import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePtBrNumber,
  formatBRL,
  formatPct,
  parseDelimitedText,
  normalizePricingItems,
  calculateWhatsappAudit,
  calculatePricingAudit,
  calculateAutomationAudit,
  runFinancialAudit,
  buildCsvTemplateFromItems
} from '../ferramentas/auditor-ia/financial-engine.mjs';
import { NICHES, getPresetForNiche } from '../ferramentas/auditor-ia/presets.mjs';
import { buildSampleCatalogXlsx, parseXlsxBuffer } from '../ferramentas/auditor-ia/xlsx-codec.mjs';

test('parsePtBrNumber converte formatos PT-BR, US, percentuais e entradas invalidas sem NaN', () => {
  assert.equal(parsePtBrNumber('R$ 1.450,90'), 1450.9);
  assert.equal(parsePtBrNumber('1450,90'), 1450.9);
  assert.equal(parsePtBrNumber('R$ 1.200.000,50'), 1200000.5);
  assert.equal(parsePtBrNumber('12,5%'), 12.5);
  assert.equal(parsePtBrNumber('12.5%'), 12.5);
  assert.equal(parsePtBrNumber('1,450.90'), 1450.9);
  assert.equal(parsePtBrNumber('R$ 1.500'), 1500);
  assert.equal(parsePtBrNumber('(450,25)'), -450.25);
  assert.equal(parsePtBrNumber('−320,10'), -320.1);
  assert.equal(parsePtBrNumber('', 42), 42);
  assert.equal(parsePtBrNumber(null, 10), 10);
  assert.equal(parsePtBrNumber(undefined, 7), 7);
  assert.equal(parsePtBrNumber(Number.NaN, 5), 5);
  assert.equal(parsePtBrNumber(Number.POSITIVE_INFINITY, 3), 3);
  assert.equal(parsePtBrNumber('texto sem numero', 99), 99);
  assert.equal(Object.is(parsePtBrNumber('-0'), -0), false);
  assert.match(formatBRL(1450.9), /R\$ 1\.450,90/);
  assert.equal(formatPct(12.5), '12,5%');
});

test('parseDelimitedText e normalizePricingItems suportam CSV PT-BR (;), virgula e aspas escapadas', () => {
  const csvSemicolon = '\uFEFFItem;Custo Unitário (R$);Preço Atual (R$);Qtd Mensal\r\n' +
    '"Burger ""Especial""; Duplo";R$ 18,50;R$ 39,90;120\r\n' +
    'Combo Promocional;45,00;49,00;40\r\n' +
    'Total;;;\r\n';
  const rows = parseDelimitedText(csvSemicolon);
  assert.equal(rows.length, 4);
  const items = normalizePricingItems(rows);
  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'Burger "Especial"; Duplo');
  assert.equal(items[0].unitCost, 18.5);
  assert.equal(items[0].currentPrice, 39.9);
  assert.equal(items[0].monthlyQty, 120);

  const csvComma = 'Servico A,120.00,290.00,15\nServico B,80.50,150.00,10';
  const noHeaderItems = normalizePricingItems(parseDelimitedText(csvComma));
  assert.equal(noHeaderItems.length, 2);
  assert.equal(noHeaderItems[1].unitCost, 80.5);
  assert.equal(noHeaderItems[1].monthlyQty, 10);

  const generatedCsv = buildCsvTemplateFromItems(items);
  assert.ok(generatedCsv.startsWith('\uFEFF'));
  const roundTrip = normalizePricingItems(parseDelimitedText(generatedCsv));
  assert.equal(roundTrip.length, 2);
  assert.equal(roundTrip[0].currentPrice, 39.9);
});

test('Round-trip nativo XLSX (buildSampleCatalogXlsx -> parseXlsxBuffer) e rejeicao de arquivo corrompido', async () => {
  const sample = [
    { name: 'Avaliação & Limpeza', unitCost: 115, currentPrice: 220, monthlyQty: 52 },
    { name: 'Kit Promoção 3x', unitCost: 480, currentPrice: 540, monthlyQty: 18 }
  ];
  const xlsxBytes = await buildSampleCatalogXlsx(sample, 'Clinica');
  assert.ok(xlsxBytes instanceof Uint8Array);
  assert.equal(xlsxBytes[0], 0x50);
  assert.equal(xlsxBytes[1], 0x4b);

  const parsedMatrix = await parseXlsxBuffer(xlsxBytes);
  const parsedItems = normalizePricingItems(parsedMatrix);
  assert.equal(parsedItems.length, 2);
  assert.equal(parsedItems[0].name, 'Avaliação & Limpeza');
  assert.equal(parsedItems[0].unitCost, 115);
  assert.equal(parsedItems[0].currentPrice, 220);
  assert.equal(parsedItems[0].monthlyQty, 52);

  await assert.rejects(() => parseXlsxBuffer(new Uint8Array([1, 2, 3, 4])), /inválido|corrompido/i);
});

test('Modulo A (WhatsApp): calculos exatos e casos extremos', () => {
  const res = calculateWhatsappAudit({
    leadsPerMonth: 200,
    currentConversionPct: 20,
    averageTicket: 500,
    grossMarginPct: 60,
    avgResponseMinutes: 45,
    followUpSteps: 1
  });
  assert.equal(res.closedCurrent, 40);
  assert.equal(res.lostLeadsMonthly, 160);
  assert.equal(res.currentMonthlyRevenue, 20000);
  assert.equal(res.revenueLeftOnTableMonthly, 80000);
  assert.equal(res.scenarios.conservative.recoveredDeals, 8);
  assert.equal(res.scenarios.conservative.revenue30dBRL, 4000);
  assert.equal(res.scenarios.moderate.recoveredDeals, 19.2);
  assert.equal(res.scenarios.moderate.revenue30dBRL, 9600);
  assert.equal(res.scenarios.moderate.margin30dBRL, 5760);
  assert.equal(res.scenarios.aggressive.recoveredDeals, 32);
  assert.equal(res.scenarios.aggressive.revenue30dBRL, 16000);
  assert.equal(res.annualizedModerateRevenue, 115200);
  assert.ok(res.annualRoiPct > 500);

  // Casos extremos: 0 leads e conversao 98%
  const zeroRes = calculateWhatsappAudit({ leadsPerMonth: 0, currentConversionPct: 0, averageTicket: 0 });
  assert.equal(zeroRes.revenueLeftOnTableMonthly, 0);
  assert.equal(zeroRes.annualRoiPct, 0);

  const highConv = calculateWhatsappAudit({ leadsPerMonth: 100, currentConversionPct: 98, averageTicket: 100 });
  assert.equal(highConv.scenarios.moderate.recoveredDeals, 0);
});

test('Modulo B (Margem vs Markup): diferencia markup de margem real, detecta prejuizo invisivel e evita divisao por zero', () => {
  const res = calculatePricingAudit({
    cardFeePct: 5,
    taxRatePct: 10,
    hiddenCostsPct: 5,
    fixedMonthlyOverhead: 5000,
    targetNetMarginPct: 20,
    items: [
      { name: 'Item Ilusao Prejuizo', unitCost: 100, currentPrice: 120, monthlyQty: 50 },
      { name: 'Item Corroido', unitCost: 100, currentPrice: 140, monthlyQty: 40 },
      { name: 'Item Saudavel', unitCost: 100, currentPrice: 200, monthlyQty: 30 }
    ]
  });

  // Dedução total = 20% | Ideal denom = 1 - 0.20 - 0.20 = 0.60 -> Preço ideal = 166.67
  const lossItem = res.items[0];
  assert.equal(lossItem.markupPct, 20);
  // 120 - 100 - 24 = -4 de prejuízo por unidade vendida apesar de "20% acima do custo"
  assert.equal(lossItem.unitContributionBRL, -4);
  assert.equal(lossItem.status, 'prejuizo_invisivel');
  assert.equal(lossItem.directMonthlyLossBRL, 200);
  assert.equal(lossItem.idealPrice, 166.67);

  const erodedItem = res.items[1];
  assert.equal(erodedItem.markupPct, 40);
  assert.equal(erodedItem.unitContributionBRL, 12);
  assert.equal(erodedItem.realMarginPct, 8.6);
  assert.equal(erodedItem.status, 'margem_corroida');

  const healthyItem = res.items[2];
  assert.equal(healthyItem.realMarginPct, 30);
  assert.equal(healthyItem.status, 'saudavel');

  assert.equal(res.lossMakingCount, 1);
  assert.equal(res.erodedCount, 1);
  assert.equal(res.healthyCount, 1);

  // Caso extremo: soma de taxas + meta >= 100% nao pode gerar NaN nem preco negativo
  const extreme = calculatePricingAudit({
    cardFeePct: 40,
    taxRatePct: 35,
    hiddenCostsPct: 15,
    targetNetMarginPct: 50,
    items: [{ name: 'Teste Extremo', unitCost: 100, currentPrice: 150, monthlyQty: 10 }]
  });
  assert.equal(extreme.isTargetMathematicallyInfeasible, true);
  assert.ok(Number.isFinite(extreme.items[0].idealPrice) && extreme.items[0].idealPrice > 0);
});

test('Modulo C (Automacao): calcula custo hora-homem real, desperdicio e cenarios 35%/72% sem divisao por zero', () => {
  const res = calculateAutomationAudit({
    teamSize: 4,
    avgMonthlySalary: 2000,
    chargesMultiplier: 1.38,
    productiveHoursPerMonth: 160,
    repetitiveHoursPerWeekPerPerson: 10
  });
  assert.equal(res.monthlyCostPerPerson, 2760);
  assert.equal(res.realHourlyCost, 17.25);
  assert.equal(res.monthlyWastedHoursTotal, 173.3);
  assert.ok(res.monthlyFinancialWasteBRL > 2900);
  assert.ok(Math.abs(res.trainingMonthlySavingsBRL - res.monthlyFinancialWasteBRL * 0.35) < 1);
  assert.ok(Math.abs(res.automationMonthlySavingsBRL - res.monthlyFinancialWasteBRL * 0.72) < 1);

  // Divisão por zero protegida se productiveHoursPerMonth vier 0 ou vazio
  const edge = calculateAutomationAudit({
    teamSize: 0,
    avgMonthlySalary: 0,
    productiveHoursPerMonth: 0,
    repetitiveHoursPerWeekPerPerson: 0
  });
  assert.equal(edge.productiveHoursPerMonth, 1);
  assert.equal(edge.realHourlyCost, 0);
  assert.equal(edge.monthlyFinancialWasteBRL, 0);
});

test('Presets de todos os 5 nichos + nicho customizado produzem auditorias validas nos 3 modulos', () => {
  for (const niche of NICHES) {
    const preset = getPresetForNiche(niche.id, niche.id === 'custom' ? 'Energia Solar' : '');
    assert.ok(preset.nicheLabel.length > 0);
    for (const moduleId of ['whatsapp', 'pricing', 'automation']) {
      const audit = runFinancialAudit({
        moduleId,
        nicheId: preset.nicheId,
        nicheLabel: preset.nicheLabel,
        whatsapp: preset.whatsapp,
        pricing: preset.pricing,
        automation: preset.automation
      });
      assert.ok(Number.isFinite(audit.summary.monthlyLeakageBRL) && audit.summary.monthlyLeakageBRL > 0, `${niche.id}/${moduleId}`);
      assert.ok(Number.isFinite(audit.summary.projection12mBRL) && audit.summary.projection12mBRL > 0, `${niche.id}/${moduleId}`);
      assert.ok(audit.summary.comparisonBars.length >= 3);
      if (moduleId === 'pricing') {
        assert.ok(audit.details.lossMakingCount + audit.details.erodedCount >= 1, `${niche.id} pricing deve demonstrar vazamento`);
      }
    }
  }
});
