import { useActiveOutputs } from '../../hooks/useActiveOutputs';
import { formatFinancial } from '../../engine/format';

export function SourcesUses() {
  const outputs = useActiveOutputs();

  if (!outputs) {
    return (
      <div className="text-gray-500 text-sm italic p-4 text-center">
        Configure assumptions to see Sources &amp; Uses
      </div>
    );
  }

  // Leverage ratio: totalDebt / entryEV — computed as plain JS for display label only
  const leverageRaw = Number(outputs.totalDebt) / Number(outputs.entryEV);

  const sources = [
    { label: 'Sponsor Equity', value: outputs.sponsorEquity },
    { label: 'Management Rollover', value: outputs.managementRollover },
    { label: 'Total Debt', value: outputs.totalDebt },
  ];

  const uses = [
    { label: 'Purchase Price (EV)', value: outputs.purchasePrice },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Sources &amp; Uses
        </h3>
        <span className="text-xs text-gray-400">
          Leverage: {formatFinancial(leverageRaw, 'percentage_2dp')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sources */}
        <div className="bg-gray-800/60 rounded-lg overflow-hidden">
          <div className="bg-gray-700/60 px-3 py-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Sources
          </div>
          <table className="w-full text-sm">
            <tbody>
              {sources.map(({ label, value }) => (
                <tr key={label} className="border-b border-gray-700/50">
                  <td className="px-3 py-2 text-gray-400 text-xs">{label}</td>
                  <td className="px-3 py-2 text-right text-gray-200 text-xs font-mono">
                    {formatFinancial(value, 'currency_mm')}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-700/30">
                <td className="px-3 py-2 text-gray-300 text-xs font-semibold">Total Sources</td>
                <td className="px-3 py-2 text-right text-gray-100 text-xs font-mono font-semibold">
                  {formatFinancial(outputs.entryEV, 'currency_mm')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Uses */}
        <div className="bg-gray-800/60 rounded-lg overflow-hidden">
          <div className="bg-gray-700/60 px-3 py-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Uses
          </div>
          <table className="w-full text-sm">
            <tbody>
              {uses.map(({ label, value }) => (
                <tr key={label} className="border-b border-gray-700/50">
                  <td className="px-3 py-2 text-gray-400 text-xs">{label}</td>
                  <td className="px-3 py-2 text-right text-gray-200 text-xs font-mono">
                    {formatFinancial(value, 'currency_mm')}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-700/30">
                <td className="px-3 py-2 text-gray-300 text-xs font-semibold">Total Uses</td>
                <td className="px-3 py-2 text-right text-gray-100 text-xs font-mono font-semibold">
                  {formatFinancial(outputs.purchasePrice, 'currency_mm')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
