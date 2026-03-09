import { create } from 'zustand';
import type { ParsedFinancials } from '../engine/types';

export interface DataStore {
  parsedFinancials: ParsedFinancials | null;
  parseSource: 'csv' | 'pdf' | 'manual' | null;
  setFinancials: (data: ParsedFinancials) => void;
  overrideField: (
    field: keyof Pick<ParsedFinancials, 'revenue' | 'ebitda' | 'capex' | 'da'>,
    yearIndex: number,
    value: string
  ) => void;
  clearFinancials: () => void;
}

export const useDataStore = create<DataStore>((set, get) => ({
  parsedFinancials: null,
  parseSource: null,

  setFinancials: (data) => {
    set({
      parsedFinancials: data,
      parseSource: data.source,
    });
  },

  overrideField: (field, yearIndex, value) => {
    const current = get().parsedFinancials;
    if (!current) return;

    // Immutable update of the specific field/year
    const updatedArray = [...current[field]];
    updatedArray[yearIndex] = value;

    const updatedConfidence = {
      ...current.confidence,
      [field]: 'low' as const,
    };

    set({
      parsedFinancials: {
        ...current,
        [field]: updatedArray,
        confidence: updatedConfidence,
      },
    });
  },

  clearFinancials: () => {
    set({ parsedFinancials: null, parseSource: null });
  },
}));
