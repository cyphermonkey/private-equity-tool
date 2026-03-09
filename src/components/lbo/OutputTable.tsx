import { useModelStore } from '../../stores/modelStore';
import { formatFinancial } from '../../engine/format';
import type { ScenarioKey, LBOOutputs } from '../../engine/types';

const SCENARIOS: ScenarioKey[] = ['base', 'bull', 'bear'];

interface Metric {
  label: string;
  key: keyof LBOOutputs;
  format: 'percentage_2dp' | 'multiple_2dp' | 'currency_mm';
}

const METRICS: Metric[] = [
  { label: 'IRR', key: 'irr', format: 'percentage_2dp' },
  { label: 'MOIC', key: 'moic', format: 'multiple_2dp' },
  { label: 'Entry EV', key: 'entryEV', format: 'currency_mm' },
  { label: 'Exit EV', key: 'exitEV', format: 'currency_mm' },
  { label: 'Exit Equity', key: 'exitEquity', format: 'currency_mm' },
  { label: 'Sponsor Equity', key: 'sponsorEquity', format: 'currency_mm' },
];

function fmt(output: LBOOutputs | null, metric: Metric): string {
  if (!output) return '—';
  const raw = output[metric.key];
  if (raw === undefined || raw === null || raw === '') return '—';
  try {
    return formatFinancial(raw as string, metric.format);
  } catch {
    return '—';
  }
}

export function OutputTable() {
  const outputs = useModelStore((s) => s.outputs);
  const activeScenario = useModelStore((s) => s.activeScenario);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        Returns Summary
      </h3>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Metric
              </th>
              {SCENARIOS.map((s) => (
                <th
                  key={s}
                  className={`px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide ${
                    s === activeScenario
                      ? 'bg-blue-950/50 text-blue-300'
                      : 'text-gray-400'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, idx) => (
              <tr
                key={metric.key}
                className={`border-b border-gray-800 ${
                  idx % 2 === 0 ? 'bg-gray-900/20' : ''
                }`}
              >
                <td className="px-4 py-2 text-xs text-gray-400 font-medium">{metric.label}</td>
                {SCENARIOS.map((s) => (
                  <td
                    key={s}
                    className={`px-4 py-2 text-right text-xs font-mono ${
                      s === activeScenario
                        ? 'bg-blue-950/30 text-blue-200 font-semibold'
                        : 'text-gray-300'
                    }`}
                  >
                    {fmt(outputs[s], metric)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
