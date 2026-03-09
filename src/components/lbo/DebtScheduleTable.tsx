import { useActiveOutputs } from '../../hooks/useActiveOutputs';
import { useModelStore } from '../../stores/modelStore';
import { formatFinancial } from '../../engine/format';

export function DebtScheduleTable() {
  const outputs = useActiveOutputs();
  const converged = outputs?.converged ?? true;
  const schedule = outputs?.debtSchedule ?? null;

  const activeScenario = useModelStore((s) => s.activeScenario);

  if (!schedule) {
    return (
      <div className="text-gray-600 text-sm italic p-4 text-center">—</div>
    );
  }

  const label = activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Debt Schedule — {label}
        </h3>
        {!converged && (
          <span className="text-xs text-yellow-400 bg-yellow-950/40 border border-yellow-800 px-2 py-1 rounded">
            Debt schedule did not fully converge
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-xs text-gray-300 whitespace-nowrap">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Year</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Tranche</th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">Beg. Balance</th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">Interest</th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">Mand. Amort</th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">Cash Sweep</th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">End. Balance</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-800 hover:bg-gray-800/40"
              >
                <td className="px-3 py-2 text-gray-400">{row.year}</td>
                <td className="px-3 py-2 font-medium text-gray-300">{row.tranche}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatFinancial(row.beginningBalance, 'currency_mm')}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatFinancial(row.interestExpense, 'currency_mm')}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatFinancial(row.mandatoryAmort, 'currency_mm')}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatFinancial(row.cashSweep, 'currency_mm')}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatFinancial(row.endingBalance, 'currency_mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
