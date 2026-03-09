import { useRef } from 'react';
import { useModelStore } from '../../stores/modelStore';
import type { ScenarioKey, LBOAssumptions } from '../../engine/types';

interface Props {
  scenario: ScenarioKey;
}

function useDebounced<T>(callback: (val: T) => void, delay = 300) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (val: T) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(val), delay);
  };
}

export function AssumptionPanel({ scenario }: Props) {
  const assumptions = useModelStore((s) => s.scenarios[scenario]);
  const setAssumption = useModelStore((s) => s.setAssumption);

  function set<K extends keyof LBOAssumptions>(key: K, value: LBOAssumptions[K]) {
    setAssumption(scenario, key, value);
  }

  // Debounced setters for text inputs to avoid firing computeLBO on every keystroke
  const debouncedEntryEBITDA = useDebounced<string>((v) => set('entryEBITDA', v));
  const debouncedEntryMultiple = useDebounced<string>((v) => set('entryMultiple', v));
  const debouncedEquityPct = useDebounced<string>((v) => set('equityPct', v));
  const debouncedManagementRollover = useDebounced<string>((v) => set('managementRollover', v));
  const debouncedExitMultiple = useDebounced<string>((v) => set('exitMultiple', v));

  const inputClass =
    'w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500';
  const labelClass = 'block text-xs text-gray-400 mb-1 font-medium';

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        {scenario.charAt(0).toUpperCase() + scenario.slice(1)} Scenario Assumptions
      </h3>

      {/* Entry assumptions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Entry EBITDA ($)</label>
          <input
            type="number"
            defaultValue={assumptions.entryEBITDA}
            onChange={(e) => debouncedEntryEBITDA(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Entry Multiple (x)</label>
          <input
            type="number"
            step="0.5"
            defaultValue={assumptions.entryMultiple}
            onChange={(e) => debouncedEntryMultiple(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Equity % (%)</label>
          <input
            type="number"
            step="1"
            defaultValue={assumptions.equityPct}
            onChange={(e) => debouncedEquityPct(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Management Rollover ($)
            <span className="ml-1 text-gray-600 font-normal">(Rollover)</span>
          </label>
          <input
            type="number"
            defaultValue={assumptions.managementRollover}
            onChange={(e) => debouncedManagementRollover(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-gray-600 mt-1">
            Sponsor equity = Total equity - Rollover (enforced)
          </p>
        </div>
        <div>
          <label className={labelClass}>Exit Multiple (x)</label>
          <input
            type="number"
            step="0.5"
            defaultValue={assumptions.exitMultiple}
            onChange={(e) => debouncedExitMultiple(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Exit Year</label>
          <select
            defaultValue={assumptions.exitYear}
            onChange={(e) => set('exitYear', Number(e.target.value))}
            className={inputClass}
          >
            {[3, 4, 5, 6, 7].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Debt tranches */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Debt Tranches
        </h4>
        <div className="space-y-3">
          {assumptions.debtTranches.map((tranche, idx) => (
            <div key={idx} className="bg-gray-800/60 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-300">{tranche.name}</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelClass}>Principal ($)</label>
                  <input
                    type="number"
                    defaultValue={tranche.principal}
                    onChange={(e) => {
                      const updated = assumptions.debtTranches.map((t, i) =>
                        i === idx ? { ...t, principal: e.target.value } : t
                      );
                      setAssumption(scenario, 'debtTranches', updated);
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Rate (%)</label>
                  <input
                    type="number"
                    step="0.25"
                    defaultValue={tranche.rate}
                    onChange={(e) => {
                      const updated = assumptions.debtTranches.map((t, i) =>
                        i === idx ? { ...t, rate: e.target.value } : t
                      );
                      setAssumption(scenario, 'debtTranches', updated);
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Amort (%)</label>
                  <input
                    type="number"
                    step="1"
                    defaultValue={tranche.mandatoryAmortPct}
                    onChange={(e) => {
                      const updated = assumptions.debtTranches.map((t, i) =>
                        i === idx ? { ...t, mandatoryAmortPct: e.target.value } : t
                      );
                      setAssumption(scenario, 'debtTranches', updated);
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
