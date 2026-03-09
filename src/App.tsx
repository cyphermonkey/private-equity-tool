import { useModelStore } from './stores/modelStore';
import { ScenarioToggle } from './components/scenario/ScenarioToggle';
import { UploadZone } from './components/upload/UploadZone';
import { ParsedPreview } from './components/upload/ParsedPreview';
import { AssumptionPanel } from './components/lbo/AssumptionPanel';
import { SourcesUses } from './components/lbo/SourcesUses';
import { OutputTable } from './components/lbo/OutputTable';
import { DebtScheduleTable } from './components/lbo/DebtScheduleTable';

export default function App() {
  const activeScenario = useModelStore((s) => s.activeScenario);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">PE Deal Workbench</h1>
            <p className="text-xs text-gray-500 mt-0.5">LBO Analysis — Foundation</p>
          </div>
          <span className="text-xs text-gray-600 font-mono">v0.1</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6 lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">

        {/* Left column: upload + assumptions */}
        <div className="lg:col-span-1 space-y-5">

          {/* Upload zone */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Data Ingestion
            </h2>
            <UploadZone />
            <ParsedPreview />
          </section>

          {/* Scenario toggle */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Scenario
            </h2>
            <ScenarioToggle />
          </section>

          {/* Assumption panel */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <AssumptionPanel scenario={activeScenario} />
          </section>
        </div>

        {/* Right column: outputs */}
        <div className="lg:col-span-2 space-y-5">

          {/* Sources & Uses */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <SourcesUses />
          </section>

          {/* Returns summary */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <OutputTable />
          </section>

          {/* Debt schedule */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <DebtScheduleTable />
          </section>
        </div>
      </main>
    </div>
  );
}
