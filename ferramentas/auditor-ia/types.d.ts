export type AuditModuleId = 'whatsapp' | 'pricing' | 'automation';

export type NicheId =
  | 'clinica'
  | 'comercio'
  | 'restaurante'
  | 'servicos'
  | 'escritorio'
  | 'custom';

export interface WhatsappAuditInput {
  leadsPerMonth: number | string;
  currentConversionPct: number | string;
  averageTicket: number | string;
  grossMarginPct?: number | string;
  avgResponseMinutes?: number | string;
  followUpSteps?: number | string;
  conversationsSample?: string;
}

export interface WhatsappScenario {
  label: string;
  reactivationRatePct: number;
  recoveredDeals: number;
  revenue30dBRL: number;
  margin30dBRL: number;
  projectedConversionPct: number;
}

export interface WhatsappAuditDetails {
  leadsPerMonth: number;
  currentConversionPct: number;
  averageTicket: number;
  grossMarginPct: number;
  avgResponseMinutes: number;
  followUpSteps: number;
  closedCurrent: number;
  lostLeadsMonthly: number;
  currentMonthlyRevenue: number;
  revenueLeftOnTableMonthly: number;
  scenarios: {
    conservative: WhatsappScenario;
    moderate: WhatsappScenario;
    aggressive: WhatsappScenario;
  };
  annualizedModerateRevenue: number;
  annualizedModerateMargin: number;
  referenceProjectInvestment: number;
  annualRoiPct: number;
  paybackDays: number;
  hoursSavedMonthly: number;
}

export interface PricingCatalogItemInput {
  name: string;
  unitCost: number | string;
  currentPrice: number | string;
  monthlyQty: number | string;
}

export interface PricingAuditInput {
  cardFeePct: number | string;
  taxRatePct: number | string;
  hiddenCostsPct: number | string;
  fixedMonthlyOverhead: number | string;
  targetNetMarginPct: number | string;
  items: PricingCatalogItemInput[];
}

export type PricingItemStatus = 'prejuizo_invisivel' | 'margem_corroida' | 'saudavel';

export interface PricingItemAnalysis {
  name: string;
  unitCost: number;
  currentPrice: number;
  monthlyQty: number;
  markupPct: number;
  markupMultiplier: number;
  variableDeductionsBRL: number;
  unitContributionBRL: number;
  realMarginPct: number;
  markupIllusionGapPct: number;
  idealPrice: number;
  isTargetMathematicallyInfeasible: boolean;
  status: PricingItemStatus;
  monthlyRevenue: number;
  monthlyContribution: number;
  monthlyIdealContribution: number;
  monthlyMarginGapBRL: number;
  directMonthlyLossBRL: number;
}

export interface PricingAuditDetails {
  cardFeePct: number;
  taxRatePct: number;
  hiddenCostsPct: number;
  deductionPct: number;
  fixedMonthlyOverhead: number;
  targetNetMarginPct: number;
  isTargetMathematicallyInfeasible: boolean;
  items: PricingItemAnalysis[];
  totalCurrentRevenue: number;
  totalCurrentContribution: number;
  weightedCurrentMarginPct: number;
  netOperatingResultBRL: number;
  lossMakingCount: number;
  erodedCount: number;
  healthyCount: number;
  totalDirectMonthlyLossBRL: number;
  monthlyRecoverableProfitBRL: number;
  annualRecoverableProfitBRL: number;
  totalPotentialContribution: number;
  projectedNetOperatingResultBRL: number;
  hoursRecoveredMonthly: number;
}

export interface AutomationAuditInput {
  teamSize: number | string;
  avgMonthlySalary: number | string;
  chargesMultiplier?: number | string;
  productiveHoursPerMonth?: number | string;
  repetitiveHoursPerWeekPerPerson: number | string;
  workflowDescription?: string;
}

export interface AutomationAuditDetails {
  teamSize: number;
  avgMonthlySalary: number;
  chargesMultiplier: number;
  productiveHoursPerMonth: number;
  repetitiveHoursPerWeekPerPerson: number;
  monthlyCostPerPerson: number;
  realHourlyCost: number;
  monthlyWastedHoursTotal: number;
  annualWastedHoursTotal: number;
  monthlyFinancialWasteBRL: number;
  annualFinancialWasteBRL: number;
  trainingHoursSavedMonthly: number;
  trainingMonthlySavingsBRL: number;
  trainingAnnualSavingsBRL: number;
  automationHoursSavedMonthly: number;
  automationMonthlySavingsBRL: number;
  automationAnnualSavingsBRL: number;
}

export interface ComparisonBarMetric {
  label: string;
  valueBRL: number;
  tone: 'muted' | 'danger' | 'accent' | 'positive';
}

export interface FinancialAuditSummary {
  monthlyLeakageBRL: number;
  cashConservative30dBRL: number;
  cashPotential30dBRL: number;
  cashAggressive30dBRL: number;
  projection12mBRL: number;
  hoursRecoveredMonthly: number;
  criticalItemsCount: number;
  comparisonBars: ComparisonBarMetric[];
}

export interface FinancialAuditResult {
  moduleId: AuditModuleId;
  nicheId: NicheId;
  nicheLabel: string;
  summary: FinancialAuditSummary;
  details: WhatsappAuditDetails | PricingAuditDetails | AutomationAuditDetails;
}

export interface ActionStep48h {
  window: string;
  title: string;
  action: string;
  expectedImpact: string;
}

export interface AuditDeliverable {
  title: string;
  badge: string;
  content: string;
  usageTip: string;
}

export interface BusinessAnalysisOutput {
  executiveHeadline: string;
  rootCauseDiagnosis: string;
  plan48h: ActionStep48h[];
  deliverables: AuditDeliverable[];
  implementationSplit: {
    teamWithAiTraining: string[];
    customEngineeringStudio: string[];
  };
}
