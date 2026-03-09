import { useModelStore } from '../../stores/modelStore';
import type { ScenarioKey } from '../../engine/types';

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: 'base', label: 'Base' },
  { key: 'bull', label: 'Bull' },
  { key: 'bear', label: 'Bear' },
];

export function ScenarioToggle() {
  const activeScenario = useModelStore((s) => s.activeScenario);
  const setActiveScenario = useModelStore((s) => s.setActiveScenario);

  return (
    <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
      {SCENARIOS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveScenario(key)}
          className={
            activeScenario === key
              ? 'flex-1 px-4 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white transition-colors'
              : 'flex-1 px-4 py-2 rounded-md text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors'
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
