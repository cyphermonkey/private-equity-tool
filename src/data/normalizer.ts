import type { ParsedFinancials } from '../engine/types';

export const REVENUE_ALIASES = ['revenue', 'net revenue', 'total revenue', 'net sales', 'total net revenue'];
export const EBITDA_ALIASES = ['ebitda', 'adjusted ebitda', 'operating ebitda', 'adj. ebitda', 'adj ebitda'];
export const CAPEX_ALIASES = ['capex', 'capital expenditures', 'capital expenditure', 'capex & other', 'purchases of property'];
export const DA_ALIASES = ['d&a', 'da', 'depreciation & amortization', 'depreciation and amortization', 'dep. & amort.', 'depreciation & amort.'];
export const YEAR_ALIASES = ['year', 'fiscal year', 'fy', 'period'];

function findColumn(headers: string[], aliases: string[]): string | null {
  for (const header of headers) {
    if (aliases.includes(header.toLowerCase())) {
      return header;
    }
  }
  return null;
}

function isKnownColumn(header: string): boolean {
  const lower = header.toLowerCase();
  return (
    REVENUE_ALIASES.includes(lower) ||
    EBITDA_ALIASES.includes(lower) ||
    CAPEX_ALIASES.includes(lower) ||
    DA_ALIASES.includes(lower) ||
    YEAR_ALIASES.includes(lower)
  );
}

export function normalizeRawRows(rows: Record<string, unknown>[]): ParsedFinancials {
  if (rows.length === 0) {
    return {
      years: [],
      revenue: [],
      ebitda: [],
      capex: [],
      da: [],
      source: 'csv',
      confidence: {},
      parseWarnings: ['No data rows found'],
    };
  }

  const headers = Object.keys(rows[0]);
  const parseWarnings: string[] = [];
  const confidence: Record<string, 'high' | 'low'> = {};

  const yearCol = findColumn(headers, YEAR_ALIASES);
  const revenueCol = findColumn(headers, REVENUE_ALIASES);
  const ebitdaCol = findColumn(headers, EBITDA_ALIASES);
  const capexCol = findColumn(headers, CAPEX_ALIASES);
  const daCol = findColumn(headers, DA_ALIASES);

  // Warn about missing expected fields
  if (!revenueCol) parseWarnings.push('Column "ebitda" not found; field set to empty — no revenue column detected');
  if (!ebitdaCol) parseWarnings.push('Column "ebitda" not found; field set to empty');
  if (!capexCol) parseWarnings.push('Column "capex" not found; field set to empty');
  if (!daCol) parseWarnings.push('Column "d&a" not found; field set to empty');

  // Warn about unrecognized columns
  for (const header of headers) {
    if (!isKnownColumn(header)) {
      parseWarnings.push(`Unrecognized column "${header}" ignored`);
    }
  }

  // Set confidence based on whether column was found directly or via alias
  if (revenueCol) {
    confidence['revenue'] = revenueCol.toLowerCase() === 'revenue' ? 'high' : 'high';
  }
  if (ebitdaCol) {
    confidence['ebitda'] = ebitdaCol.toLowerCase() === 'ebitda' ? 'high' : 'high';
  }
  if (capexCol) {
    confidence['capex'] = capexCol.toLowerCase() === 'capex' ? 'high' : 'high';
  }
  if (daCol) {
    confidence['da'] = daCol.toLowerCase() === 'd&a' || daCol.toLowerCase() === 'da' ? 'high' : 'high';
  }

  const years: number[] = [];
  const revenue: string[] = [];
  const ebitda: string[] = [];
  const capex: string[] = [];
  const da: string[] = [];

  rows.forEach((row, index) => {
    // Extract year: use year column if found, else use row index
    if (yearCol && row[yearCol] !== undefined) {
      const yearVal = Number(row[yearCol]);
      years.push(isNaN(yearVal) ? index : yearVal);
    } else {
      years.push(index);
    }

    // Extract each financial field, converting to string
    const toStr = (col: string | null): string => {
      if (!col || row[col] === undefined || row[col] === null) return '';
      return String(row[col]);
    };

    revenue.push(toStr(revenueCol));
    ebitda.push(toStr(ebitdaCol));
    capex.push(toStr(capexCol));
    da.push(toStr(daCol));
  });

  return {
    years,
    revenue,
    ebitda,
    capex,
    da,
    source: 'csv',
    confidence,
    parseWarnings,
  };
}
