import { create } from 'zustand';
import { computeLBO } from '../engine/lbo';
import type { LBOAssumptions, LBOOutputs, ScenarioKey, DebtTranche } from '../engine/types';

const DEFAULT_DEBT_TRANCHES: DebtTranche[] = [
  {
    name: 'TLA',
    principal: '200000000',
    rate: '6',
    mandatoryAmortPct: '20',
    maturityYear: 5,
    isBullet: false,
  },
  {
    name: 'TLB',
    principal: '400000000',
    rate: '7',
    mandatoryAmortPct: '1',
    maturityYear: 7,
    isBullet: false,
  },
];

const DEFAULT_ASSUMPTIONS: LBOAssumptions = {
  entryEBITDA: '100000000',
  entryMultiple: '10',
  equityPct: '40',
  managementRollover: '20000000',
  debtTranches: DEFAULT_DEBT_TRANCHES,
  revenueGrowthByYear: ['5', '5', '5', '5', '5'],
  ebitdaMarginByYear: ['30', '30', '30', '30', '30'],
  capexPctByYear: ['5', '5', '5', '5', '5'],
  daPctByYear: ['3', '3', '3', '3', '3'],
  exitMultiple: '12',
  exitYear: 5,
  closingDate: new Date('2024-01-01'),
};

function cloneAssumptions(a: LBOAssumptions): LBOAssumptions {
  return {
    ...a,
    debtTranches: a.debtTranches.map((t) => ({ ...t })),
    revenueGrowthByYear: [...a.revenueGrowthByYear],
    ebitdaMarginByYear: [...a.ebitdaMarginByYear],
    capexPctByYear: [...a.capexPctByYear],
    daPctByYear: [...a.daPctByYear],
    closingDate: new Date(a.closingDate),
  };
}

function safeCompute(a: LBOAssumptions): LBOOutputs | null {
  try {
    return computeLBO(a);
  } catch {
    return null;
  }
}

export interface ModelStore {
  scenarios: Record<ScenarioKey, LBOAssumptions>;
  outputs: Record<ScenarioKey, LBOOutputs | null>;
  activeScenario: ScenarioKey;
  setAssumption: (scenario: ScenarioKey, key: keyof LBOAssumptions, value: unknown) => void;
  setActiveScenario: (scenario: ScenarioKey) => void;
  recomputeAll: () => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  scenarios: {
    base: cloneAssumptions(DEFAULT_ASSUMPTIONS),
    bull: cloneAssumptions(DEFAULT_ASSUMPTIONS),
    bear: cloneAssumptions(DEFAULT_ASSUMPTIONS),
  },
  outputs: {
    base: null,
    bull: null,
    bear: null,
  },
  activeScenario: 'base',

  setAssumption: (scenario, key, value) => {
    const current = get().scenarios;
    const updatedScenarios: Record<ScenarioKey, LBOAssumptions> = {
      base: cloneAssumptions(current.base),
      bull: cloneAssumptions(current.bull),
      bear: cloneAssumptions(current.bear),
    };

    // Apply the update to the targeted scenario
    (updatedScenarios[scenario] as Record<string, unknown>)[key as string] = value;

    // Recompute ALL three scenarios
    const newOutputs: Record<ScenarioKey, LBOOutputs | null> = {
      base: safeCompute(updatedScenarios.base),
      bull: safeCompute(updatedScenarios.bull),
      bear: safeCompute(updatedScenarios.bear),
    };

    set({ scenarios: updatedScenarios, outputs: newOutputs });
  },

  setActiveScenario: (scenario) => {
    // Only update the display filter — do NOT call computeLBO
    set({ activeScenario: scenario });
  },

  recomputeAll: () => {
    const { scenarios } = get();
    const newOutputs: Record<ScenarioKey, LBOOutputs | null> = {
      base: safeCompute(scenarios.base),
      bull: safeCompute(scenarios.bull),
      bear: safeCompute(scenarios.bear),
    };
    set({ outputs: newOutputs });
  },
}));
