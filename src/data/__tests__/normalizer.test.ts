import { describe, it, expect } from 'vitest';
import { normalizeRawRows, REVENUE_ALIASES, EBITDA_ALIASES } from '../normalizer';

const SAMPLE_ROWS = [
  { Year: 2020, 'Net Revenue': 800000000, 'Adjusted EBITDA': 240000000, 'Capital Expenditures': 40000000, 'Depreciation & Amortization': 24000000 },
  { Year: 2021, 'Net Revenue': 840000000, 'Adjusted EBITDA': 252000000, 'Capital Expenditures': 42000000, 'Depreciation & Amortization': 25200000 },
  { Year: 2022, 'Net Revenue': 882000000, 'Adjusted EBITDA': 264600000, 'Capital Expenditures': 44100000, 'Depreciation & Amortization': 26460000 },
];

describe('normalizer', () => {
  it('exports REVENUE_ALIASES and EBITDA_ALIASES arrays', () => {
    expect(Array.isArray(REVENUE_ALIASES)).toBe(true);
    expect(Array.isArray(EBITDA_ALIASES)).toBe(true);
    expect(REVENUE_ALIASES.length).toBeGreaterThan(0);
    expect(EBITDA_ALIASES.length).toBeGreaterThan(0);
  });

  it('normalizeRawRows with 3-year dataset returns arrays of length 3', () => {
    const result = normalizeRawRows(SAMPLE_ROWS);
    expect(result.years).toHaveLength(3);
    expect(result.revenue).toHaveLength(3);
    expect(result.ebitda).toHaveLength(3);
    expect(result.capex).toHaveLength(3);
    expect(result.da).toHaveLength(3);
  });

  it('resolves alias headers to correct ParsedFinancials fields', () => {
    const result = normalizeRawRows(SAMPLE_ROWS);
    expect(result.revenue[0]).toBe('800000000');
    expect(result.ebitda[0]).toBe('240000000');
    expect(result.capex[0]).toBe('40000000');
    expect(result.da[0]).toBe('24000000');
  });

  it('extracts years correctly', () => {
    const result = normalizeRawRows(SAMPLE_ROWS);
    expect(result.years[0]).toBe(2020);
    expect(result.years[1]).toBe(2021);
    expect(result.years[2]).toBe(2022);
  });

  it('source is csv', () => {
    const result = normalizeRawRows(SAMPLE_ROWS);
    expect(result.source).toBe('csv');
  });

  it('unrecognized columns produce a warning in parseWarnings', () => {
    const rowsWithUnknown = [
      { Year: 2020, Revenue: 100, 'Mystery Column': 999 },
    ];
    const result = normalizeRawRows(rowsWithUnknown as Record<string, unknown>[]);
    expect(result.parseWarnings.some((w) => /mystery/i.test(w) || /unrecognized/i.test(w))).toBe(true);
  });

  it('missing expected field produces a warning in parseWarnings', () => {
    const rowsWithNoEBITDA = [
      { Year: 2020, Revenue: 100 },
    ];
    const result = normalizeRawRows(rowsWithNoEBITDA as Record<string, unknown>[]);
    expect(result.parseWarnings.some((w) => /ebitda/i.test(w))).toBe(true);
  });

  it('canonical headers (Revenue, EBITDA, Capex, D&A) also resolve correctly', () => {
    const canonicalRows = [
      { Year: 2020, Revenue: 500000, EBITDA: 150000, Capex: 25000, 'D&A': 15000 },
    ];
    const result = normalizeRawRows(canonicalRows as Record<string, unknown>[]);
    expect(result.revenue[0]).toBe('500000');
    expect(result.ebitda[0]).toBe('150000');
    expect(result.capex[0]).toBe('25000');
    expect(result.da[0]).toBe('15000');
  });
});
