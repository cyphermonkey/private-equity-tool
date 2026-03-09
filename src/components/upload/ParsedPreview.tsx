import { useState } from 'react';
import { useDataStore } from '../../stores/dataStore';

type FieldKey = 'revenue' | 'ebitda' | 'capex' | 'da';

const FIELD_LABELS: Record<FieldKey, string> = {
  revenue: 'Revenue',
  ebitda: 'EBITDA',
  capex: 'Capex',
  da: 'D&A',
};

const FIELDS: FieldKey[] = ['revenue', 'ebitda', 'capex', 'da'];

export function ParsedPreview() {
  const parsedFinancials = useDataStore((s) => s.parsedFinancials);
  const overrideField = useDataStore((s) => s.overrideField);
  const [warningDismissed, setWarningDismissed] = useState(false);

  if (!parsedFinancials) return null;

  const { years, revenue, ebitda, capex, da, confidence, parseWarnings } = parsedFinancials;
  const data: Record<FieldKey, string[]> = { revenue, ebitda, capex, da };

  const hasWarnings = parseWarnings.length > 0 && !warningDismissed;

  return (
    <div className="space-y-3">
      {hasWarnings && (
        <div className="bg-yellow-950/60 border border-yellow-700 rounded-md px-4 py-2 flex items-start justify-between gap-2">
          <ul className="text-yellow-300 text-sm space-y-1">
            {parseWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-yellow-500 hover:text-yellow-300 text-xs flex-shrink-0 mt-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {years.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-xs text-gray-300">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-700">
                <th className="text-left px-3 py-2 font-semibold text-gray-400 w-24">Field</th>
                {years.map((y) => (
                  <th key={y} className="px-3 py-2 font-semibold text-gray-400 text-right">
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((field) => (
                <tr key={field} className="border-b border-gray-800 hover:bg-gray-800/40">
                  <td className="px-3 py-2 font-medium text-gray-300 flex items-center gap-1">
                    {FIELD_LABELS[field]}
                    {confidence[field] === 'low' && (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0"
                        title="Low confidence — value may be inaccurate"
                      />
                    )}
                  </td>
                  {data[field].map((val, idx) => (
                    <td key={idx} className="px-2 py-1">
                      <input
                        type="number"
                        defaultValue={val}
                        onChange={(e) => overrideField(field, idx, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-right text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 text-sm italic px-1">
          No year-indexed data available. Enter values manually in the assumption panel.
        </div>
      )}
    </div>
  );
}
