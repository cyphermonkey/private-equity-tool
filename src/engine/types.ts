export type ScenarioKey = 'base' | 'bull' | 'bear';
export type FormatType = 'currency_mm' | 'percentage_2dp' | 'multiple_2dp' | 'basis_points';

export interface DebtTranche {
  name: string;           // 'TLA', 'TLB', 'Revolver'
  principal: string;      // Decimal-compatible string in dollars
  rate: string;           // total rate as percent, e.g. '7.5'
  mandatoryAmortPct: string; // % of original principal per year
  maturityYear: number;
  isBullet: boolean;
}

export interface DebtYearRow {
  year: number;
  tranche: string;
  beginningBalance: string;
  interestExpense: string;
  mandatoryAmort: string;
  cashSweep: string;
  endingBalance: string;
}

export interface LBOAssumptions {
  entryEBITDA: string;
  entryMultiple: string;
  equityPct: string;
  managementRollover: string;
  debtTranches: DebtTranche[];
  revenueGrowthByYear: string[];   // length = exitYear; e.g. ['5','5','5','5','5']
  ebitdaMarginByYear: string[];    // % EBITDA margin per year
  capexPctByYear: string[];        // % of revenue per year
  daPctByYear: string[];           // % of revenue per year
  exitMultiple: string;
  exitYear: number;
  closingDate: Date;
}

export interface LBOOutputs {
  entryEV: string;
  totalEquity: string;
  sponsorEquity: string;
  managementRollover: string;
  totalDebt: string;
  purchasePrice: string;
  debtSchedule: DebtYearRow[];
  exitEBITDA: string;
  exitEV: string;
  exitEquity: string;
  irr: string;     // raw decimal, e.g. '0.2587' — format with formatFinancial before display
  moic: string;    // raw decimal, e.g. '3.12'
  converged: boolean;
}

export interface ParsedFinancials {
  years: number[];
  revenue: string[];
  ebitda: string[];
  capex: string[];
  da: string[];
  source: 'csv' | 'pdf' | 'manual';
  confidence: Record<string, 'high' | 'low'>;
  rawText?: string;
  parseWarnings: string[];
}
