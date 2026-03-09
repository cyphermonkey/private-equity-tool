import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('dataStore', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('initial parsedFinancials is null', async () => {
    const { useDataStore } = await import('../dataStore');
    expect(useDataStore.getState().parsedFinancials).toBeNull();
  });

  it('initial parseSource is null', async () => {
    const { useDataStore } = await import('../dataStore');
    expect(useDataStore.getState().parseSource).toBeNull();
  });

  it('setFinancials populates parsedFinancials', async () => {
    const { useDataStore } = await import('../dataStore');
    const financials = {
      years: [2020, 2021],
      revenue: ['100000000', '110000000'],
      ebitda: ['30000000', '33000000'],
      capex: ['5000000', '5500000'],
      da: ['3000000', '3300000'],
      source: 'csv' as const,
      confidence: { revenue: 'high' as const, ebitda: 'high' as const },
      parseWarnings: [],
    };
    useDataStore.getState().setFinancials(financials);
    expect(useDataStore.getState().parsedFinancials).toEqual(financials);
    expect(useDataStore.getState().parseSource).toBe('csv');
  });

  it('clearFinancials resets to null', async () => {
    const { useDataStore } = await import('../dataStore');
    const financials = {
      years: [2020],
      revenue: ['100000000'],
      ebitda: ['30000000'],
      capex: ['5000000'],
      da: ['3000000'],
      source: 'csv' as const,
      confidence: {},
      parseWarnings: [],
    };
    useDataStore.getState().setFinancials(financials);
    useDataStore.getState().clearFinancials();
    expect(useDataStore.getState().parsedFinancials).toBeNull();
  });

  it('INGEST-03: overrideField updates a specific field without re-parsing', async () => {
    const { useDataStore } = await import('../dataStore');
    const financials = {
      years: [2020, 2021, 2022],
      revenue: ['100000000', '110000000', '120000000'],
      ebitda: ['30000000', '33000000', '36000000'],
      capex: ['5000000', '5500000', '6000000'],
      da: ['3000000', '3300000', '3600000'],
      source: 'manual' as const,
      confidence: { revenue: 'high' as const },
      parseWarnings: [],
    };
    useDataStore.getState().setFinancials(financials);

    useDataStore.getState().overrideField('revenue', 0, '200000000');

    const updated = useDataStore.getState().parsedFinancials!;
    expect(updated.revenue[0]).toBe('200000000');
    // Other revenue years unchanged
    expect(updated.revenue[1]).toBe('110000000');
    expect(updated.revenue[2]).toBe('120000000');
    // Other fields unchanged
    expect(updated.ebitda[0]).toBe('30000000');
    // Confidence for overridden field is 'low'
    expect(updated.confidence['revenue']).toBe('low');
  });

  it('overrideField sets confidence to low for overridden field', async () => {
    const { useDataStore } = await import('../dataStore');
    const financials = {
      years: [2020],
      revenue: ['100000000'],
      ebitda: ['30000000'],
      capex: ['5000000'],
      da: ['3000000'],
      source: 'csv' as const,
      confidence: { revenue: 'high' as const, ebitda: 'high' as const },
      parseWarnings: [],
    };
    useDataStore.getState().setFinancials(financials);
    useDataStore.getState().overrideField('ebitda', 0, '999999');
    expect(useDataStore.getState().parsedFinancials!.confidence['ebitda']).toBe('low');
    // revenue confidence unchanged
    expect(useDataStore.getState().parsedFinancials!.confidence['revenue']).toBe('high');
  });
});
