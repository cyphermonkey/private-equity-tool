import { describe, it, expect } from 'vitest';
import { parseCSVFromString } from '../csvParser';

const SAMPLE_CSV = `Year,Net Revenue,Adjusted EBITDA,Capital Expenditures,Depreciation & Amortization
2020,800000000,240000000,40000000,24000000
2021,840000000,252000000,42000000,25200000
2022,882000000,264600000,44100000,26460000
2023,926100000,277830000,46305000,27783000
2024,972405000,291721500,48620250,29172150`;

const CANONICAL_CSV = `Year,Revenue,EBITDA,Capex,D&A
2020,800000000,240000000,40000000,24000000
2021,840000000,252000000,42000000,25200000`;

const UNRECOGNIZED_HEADER_CSV = `Year,Revenue,EBITDA,Capex,D&A,Weird Column
2020,100000,30000,5000,3000,99999`;

describe('csvParser', () => {
  it('INGEST-01: parseCSVFromString with CapIQ alias headers resolves to ParsedFinancials', async () => {
    const result = await parseCSVFromString(SAMPLE_CSV);
    expect(result.revenue).toHaveLength(5);
    expect(result.ebitda).toHaveLength(5);
    expect(result.capex).toHaveLength(5);
    expect(result.da).toHaveLength(5);
    expect(result.years).toHaveLength(5);
  });

  it('INGEST-01: revenue[0] === "800000000" from fixture data', async () => {
    const result = await parseCSVFromString(SAMPLE_CSV);
    expect(result.revenue[0]).toBe('800000000');
  });

  it('INGEST-01: alias "Net Revenue" resolves to revenue field', async () => {
    const result = await parseCSVFromString(SAMPLE_CSV);
    // If alias resolved correctly, revenue array is populated
    expect(result.revenue[0]).toBe('800000000');
    expect(result.revenue[4]).toBe('972405000');
  });

  it('INGEST-01: canonical headers (Revenue, EBITDA, Capex, D&A) parse correctly', async () => {
    const result = await parseCSVFromString(CANONICAL_CSV);
    expect(result.revenue[0]).toBe('800000000');
    expect(result.ebitda[0]).toBe('240000000');
    expect(result.capex[0]).toBe('40000000');
    expect(result.da[0]).toBe('24000000');
  });

  it('INGEST-01: unrecognized column header produces a warning — not a thrown error', async () => {
    const result = await parseCSVFromString(UNRECOGNIZED_HEADER_CSV);
    expect(result.parseWarnings.length).toBeGreaterThan(0);
    // Should not throw — result should still be valid
    expect(result.revenue[0]).toBe('100000');
  });

  it('source is csv', async () => {
    const result = await parseCSVFromString(SAMPLE_CSV);
    expect(result.source).toBe('csv');
  });

  it('returns 5 year-indexed arrays from sample fixture', async () => {
    const result = await parseCSVFromString(SAMPLE_CSV);
    expect(result.years).toEqual([2020, 2021, 2022, 2023, 2024]);
    expect(result.revenue).toHaveLength(5);
  });
});
