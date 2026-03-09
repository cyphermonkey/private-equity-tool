# Architecture Patterns

**Domain:** Browser-based PE Deal Workbench (financial modeling tool)
**Researched:** 2026-03-10
**Overall confidence:** HIGH (core architecture), MEDIUM (PDF export tradeoffs)

---

## Recommended Architecture

The workbench follows a **layered client-side architecture** with four distinct layers that never bleed into each other. No backend is required for v1. The layers communicate top-down: UI components call the State layer, the State layer calls the Calculation Engine, and the Data layer feeds both.

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer (React Components)                            │
│  Renders outputs, accepts inputs, fires events          │
│  No math, no parsing, no file I/O                       │
├─────────────────────────────────────────────────────────┤
│  State Layer (Zustand stores)                           │
│  Holds assumption sets, scenario registry,              │
│  parsed financials, derived outputs                     │
│  Calls engine on state change                           │
├─────────────────────────────────────────────────────────┤
│  Calculation Engine (pure TypeScript functions)         │
│  LBO engine, DCF engine, Comps engine                   │
│  Input: assumptions object → Output: results object     │
│  No React, no side effects, fully unit-testable         │
├─────────────────────────────────────────────────────────┤
│  Data Layer (parsers + export adapters)                 │
│  CSV parser (PapaParse), PDF extractor (pdf.js)         │
│  Excel export (SheetJS), PDF tearsheet (@react-pdf)     │
└─────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

### 1. UI Layer — React Components

**Responsibility:** Render what the state layer provides. Accept user inputs and dispatch updates to the state layer. No financial logic lives here.

**Key components:**
- `AssumptionPanel` — input controls per model (LBO, DCF, comps)
- `ScenarioToggle` — base / bull / bear switcher
- `OutputSection` — renders LBO returns table, DCF summary, comps table
- `ChartSection` — IRR waterfall, returns bridge, football field
- `TearsheetPreview` — shows what the PDF will look like
- `UploadZone` — handles file drop/select, delegates to data layer

**Communicates with:** State layer only (via Zustand selectors and actions). Does not call engine functions directly. Does not parse files directly.

---

### 2. State Layer — Zustand Stores

**Responsibility:** Single source of truth for all model state. When assumptions change, the state layer invokes the calculation engine and stores results. The UI reads from this layer reactively.

**Store structure (two stores, kept separate to avoid cross-concern coupling):**

```typescript
// modelStore.ts — assumptions and outputs
interface ModelStore {
  scenarios: {
    base: AssumptionSet;
    bull: AssumptionSet;
    bear: AssumptionSet;
  };
  activeScenario: 'base' | 'bull' | 'bear';
  outputs: {
    base: ModelOutputs;
    bull: ModelOutputs;
    bear: ModelOutputs;
  };
  activeModules: {
    lbo: boolean;
    dcf: boolean;
    comps: boolean;
  };
  setAssumption: (scenario, key, value) => void;
  setActiveScenario: (scenario) => void;
}

// dataStore.ts — parsed financials and company metadata
interface DataStore {
  parsedFinancials: ParsedFinancials | null;
  company: CompanyMeta | null;
  compsData: CompsRow[];
  setFinancials: (data: ParsedFinancials) => void;
}
```

**Scenario calculation pattern:** All three scenarios are computed on every assumption change, not just the active one. This means switching scenarios is instant (toggle renders pre-computed outputs) with no recalculation latency. Calculation cost is low enough (pure math, no I/O) that computing all three in sequence is negligible.

**Communicates with:** Calculation Engine (calls engine functions inside `setAssumption` actions), UI Layer (exposes state via hooks).

---

### 3. Calculation Engine — Pure TypeScript Functions

**Responsibility:** Take an `AssumptionSet` and return a `ModelOutputs` object. Stateless, deterministic, framework-free.

**Design rule:** Every function in this layer must be a pure function. Same input always produces same output. No React, no Zustand, no fetch, no side effects. This makes the engine fully unit-testable with Vitest and fully portable if the UI framework changes.

**Module structure:**

```typescript
// engine/lbo.ts
export function computeLBO(assumptions: LBOAssumptions): LBOOutputs {
  // Step 1: Sources & Uses
  // Step 2: Debt schedule (tranche by tranche, year by year)
  // Step 3: P&L projection
  // Step 4: Exit proceeds
  // Step 5: IRR, MOIC, cash-on-cash
}

// engine/dcf.ts
export function computeDCF(assumptions: DCFAssumptions): DCFOutputs {
  // Step 1: FCF projection
  // Step 2: Terminal value (Gordon Growth or EV/EBITDA)
  // Step 3: Discount to PV
  // Step 4: Sensitivity table (WACC x terminal growth grid)
}

// engine/comps.ts
export function computeComps(
  comps: CompsRow[],
  target: TargetMetrics
): CompsOutputs {
  // Median / mean multiples
  // Implied valuation range
}
```

**Why pure functions over a reactive/spreadsheet engine:** A spreadsheet-style dependency graph (like HyperFormula or a custom DAG) adds significant complexity and is only warranted when cells are user-editable in freeform. For a workbench with structured assumption panels (not a freeform grid), pure functions are simpler, faster to build, easier to test, and produce identical results. The LBO and DCF models have well-defined calculation sequences with no circular references, making a spreadsheet engine unnecessary overhead.

**Communicates with:** Called by the State Layer only. Returns plain JavaScript objects.

---

### 4. Data Layer — Parsers and Export Adapters

**Responsibility:** Handle all I/O that is not financial calculation. Two directions: inbound (parse files into structured data) and outbound (export to PDF or Excel).

**Inbound parsers:**

```
CSV upload  → PapaParse → ParsedFinancials object → dataStore
PDF upload  → pdf.js (pdfjs-dist) → raw text → heuristic extractor
             → ParsedFinancials object → dataStore
```

Note on PDF parsing: pdf.js can extract text from a 10-K, but parsing financial tables from unstructured text is inherently fragile. The recommended approach for v1 is to extract text and use keyword matching to find income statement / balance sheet sections, then offer the user a correction UI. Do not promise automatic accuracy on PDFs — frame it as "assisted extraction with manual verification."

**Outbound adapters:**

```
PDF tearsheet: @react-pdf/renderer (client-side, searchable vector text)
Excel model:   SheetJS/xlsx (client-side, no server needed)
```

**Communicates with:** dataStore (writes parsed data), UI Layer (triggered by user upload actions), outputs from State Layer (reads model outputs for export).

---

## Data Flow

### File Upload → Parse → Calculate → Visualize → Export

```
User drops CSV/PDF
       │
       ▼
[Data Layer: PapaParse / pdf.js]
  Extracts raw financial rows
       │
       ▼
[Data Layer: normalizer]
  Maps raw → ParsedFinancials
  (Revenue, EBITDA, Capex, D&A by year)
       │
       ▼
[dataStore.setFinancials()]
  Stores ParsedFinancials
  Triggers: auto-populate LBO/DCF assumptions
            from parsed data
       │
       ▼
[modelStore.setAssumption()]
  Updates all three scenario stores
  Calls computeLBO(), computeDCF(), computeComps()
  for base, bull, and bear in sequence
  Stores all outputs in modelStore.outputs
       │
       ▼
[UI Layer: OutputSection, ChartSection]
  Reads activeScenario outputs from store
  Renders tables and charts reactively
       │
       ▼
[User: export action]
  PDF: @react-pdf/renderer renders ModelOutputs → .pdf download
  Excel: SheetJS builds workbook from ModelOutputs → .xlsx download
```

---

## Scenario Analysis Pattern

**Pattern:** Scenario-keyed assumption sets + pre-computed outputs.

All three scenarios (base, bull, bear) are stored as independent `AssumptionSet` objects in modelStore. When any assumption changes in any scenario, all three engine calls are re-run and outputs stored. The active scenario is just a display filter — switching it triggers zero computation.

```typescript
// On any assumption change:
function setAssumption(scenario, key, value) {
  // Update the specific scenario's assumption
  state.scenarios[scenario][key] = value;

  // Recompute all three scenarios
  state.outputs.base = computeAll(state.scenarios.base, parsedFinancials);
  state.outputs.bull = computeAll(state.scenarios.bull, parsedFinancials);
  state.outputs.bear = computeAll(state.scenarios.bear, parsedFinancials);
}
```

**Why not compute only the active scenario:** The scenario toggle is meant to feel instant. If computation only ran on the selected scenario, switching would produce a visible flash while calculations ran. Pre-computing all three eliminates this. Model computations run in under 10ms for typical PE deal sizes (5–7 year projections), so the overhead of computing three is trivial.

**Football field chart:** Because all three scenario outputs are always available simultaneously in the store, the football field visualization can read all three without any additional fetching or toggling.

---

## Client-Side vs. Server-Side Decision

**Decision: Fully client-side for v1.**

Rationale:

| Concern | Client-Side Assessment |
|---------|----------------------|
| Performance | LBO/DCF calculations run in <10ms; no backend needed |
| Privacy | Uploaded financials never leave the user's browser (strong recruiting demo point) |
| Deployment | Static hosting (Vercel, Netlify) — no server infra cost or maintenance |
| PDF export | @react-pdf/renderer runs entirely in browser, produces quality output |
| Excel export | SheetJS runs entirely in browser |
| Comps data | One external API call (Financial Modeling Prep or similar) — can be proxied via a free Vercel edge function if CORS is needed |
| Complexity | No authentication, sessions, or database to manage |

**The only case for a server:** PDF export quality. Puppeteer (headless Chrome on the server) produces pixel-perfect PDFs from existing HTML. However, @react-pdf/renderer produces publication-quality vector PDFs from React component trees — sufficient for interview use. A Puppeteer server adds deployment complexity without meaningful quality gain for this use case.

**Final call:** No backend required. Comps API calls go directly to the provider from the browser. If CORS is an issue, a single Vercel Edge Function (< 10 lines) as a pass-through proxy is the only server-side component needed.

---

## Suggested Build Order

Build in dependency order — each layer depends on the one below it being stable.

### Phase 1: Calculation Engine (foundation)

Build the pure TypeScript engine first, with no UI. Write Vitest tests against known PE model outputs (verify IRR, MOIC, implied equity value against hand-computed or Excel results).

- `LBOAssumptions` and `LBOOutputs` types
- `computeLBO()` — debt schedule, P&L, exit, IRR/MOIC
- `DCFAssumptions` and `DCFOutputs` types
- `computeDCF()` — FCF projection, terminal value, discount, sensitivity grid
- `CompsAssumptions` and `CompsOutputs` types
- `computeComps()` — multiple statistics, implied ranges
- Unit tests for all three

**Why first:** The engine is the only layer with zero external dependencies. Building it first forces you to define the data contracts (AssumptionSet, ParsedFinancials, ModelOutputs) that every other layer depends on. Bugs found here are cheap; bugs found after wiring UI cost more.

### Phase 2: State Layer

Wire Zustand stores around the engine. Build the scenario registry pattern. No UI yet — test with store unit tests.

- `modelStore` with scenario-keyed assumptions and outputs
- `dataStore` for parsed financials
- Action functions that call engine and store results

**Why second:** State types and actions define the interface the UI will program against. Getting this stable before building components avoids repeated UI rewrites.

### Phase 3: Data Layer — Parsers

Build the inbound parsers.

- CSV parser with PapaParse: map column headers → ParsedFinancials schema
- PDF parser with pdf.js: extract text, find income statement rows
- Normalizer: convert raw extracted data → ParsedFinancials
- Upload zone component (thin UI shell, no logic)

**Why third:** Parsers are independent of visualization. Getting real financial data flowing into the store early lets you test the engine with realistic inputs, not just test fixtures.

### Phase 4: Core UI + Charts

Build the assumption panels, outputs tables, and charts.

- `AssumptionPanel` per model type (LBO, DCF, comps)
- `ScenarioToggle` + active scenario display
- `OutputSection` — returns table, DCF output, comps table
- Chart components: IRR waterfall (Recharts), returns bridge, football field
- Module enable/disable controls

**Why fourth:** By now the store has real data and real outputs. Building UI against live data avoids building against mock data that doesn't match real model shape.

### Phase 5: Export Layer

Build PDF tearsheet and Excel export last.

- `@react-pdf/renderer` tearsheet template — 1-page summary
- SheetJS Excel export — assumptions + outputs across sheets
- Export trigger buttons wired to Data Layer adapters

**Why last:** Export quality depends on having stable, production-like outputs to render. Building export against incomplete outputs produces throwaway work.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calculation Logic in React Components

**What:** Writing IRR or DCF math inside `useEffect`, event handlers, or component bodies.
**Why bad:** Untestable, entangled with render lifecycle, impossible to reuse, prone to stale closure bugs.
**Instead:** All math in the Calculation Engine. Components only read from store.

### Anti-Pattern 2: Computing Only the Active Scenario

**What:** Running `computeLBO()` only for the currently selected scenario, recalculating on toggle.
**Why bad:** Visible latency on scenario switch; the football field chart cannot show all three scenarios simultaneously without forcing the user to toggle.
**Instead:** Compute all three on every assumption change. Store all three outputs.

### Anti-Pattern 3: Spreadsheet Engine for Structured Models

**What:** Using HyperFormula or a custom DAG-based dependency engine to wire cells together.
**Why bad:** Massive added complexity. Circular reference handling, formula parsing, and dependency resolution are only necessary when users can write arbitrary formulas. PE models have fixed calculation chains.
**Instead:** Pure functions with defined input → output contracts.

### Anti-Pattern 4: html2canvas for PDF Export

**What:** Screenshotting the DOM to PNG, then embedding in a PDF.
**Why bad:** Produces rasterized, non-searchable text. Output looks pixelated at print resolution. Page breaks are uncontrolled.
**Instead:** `@react-pdf/renderer` generates vector PDFs with proper typography from React component trees. Text remains selectable and searchable.

### Anti-Pattern 5: Server-Side PDF with Puppeteer

**What:** Spinning up a headless Chrome instance on a server to render tearsheets.
**Why bad:** Requires a server, adds latency, adds cost, adds maintenance burden. Overkill for a single-user portfolio tool.
**Instead:** `@react-pdf/renderer` client-side. Sufficient quality for interview demos.

---

## Scalability Considerations

This is a single-user portfolio tool. Scalability is not a v1 concern. The architecture is designed for correctness and demo quality, not for multi-user throughput.

| Concern | At 1 user (v1) | If ever multi-user |
|---------|----------------|-------------------|
| Calculations | Client-side, instant | Move engine to Web Worker or server |
| State | Zustand in-browser | Replace with server-side sessions |
| Comps data | Direct API call | Cache on server, serve via API |
| PDF export | Client-side | Puppeteer on server for consistency |

For the portfolio use case, the client-side architecture is correct and final. The scenario where this needs to scale to multi-user is out of scope per PROJECT.md.

---

## Technology Decisions Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| UI Framework | React + TypeScript | Industry standard, component model fits modular workbench |
| State | Zustand | Simpler than Redux, better for global financial state than Jotai atoms |
| Calculation Engine | Pure TypeScript | Framework-free, fully testable, instant results |
| CSV Parser | PapaParse | De facto standard, browser-native, no server needed |
| PDF Parser | pdfjs-dist (Mozilla pdf.js) | Client-side, maintained by Mozilla, text extraction API |
| Charts | Recharts | Sufficient for financial charts; simpler API than visx/D3 for standard chart types |
| PDF Export | @react-pdf/renderer | Vector text, declarative React API, fully client-side |
| Excel Export | SheetJS (xlsx) | Client-side, multi-format, widely used |
| Testing | Vitest | Fast, TypeScript-native, ideal for pure function unit tests |

---

## Sources

- Martin Fowler: Modularizing React Apps — layered architecture pattern: https://martinfowler.com/articles/modularizing-react-apps.html
- Financial calculation pure function architecture: https://dev.to/cnivargi/why-we-ditched-react-and-built-financial-calculators-in-vanilla-javascript-and-how-it-made-2nl
- State management 2025 comparison (Zustand vs Jotai): https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k
- PDF generation library comparison 2025: https://dmitriiboikov.com/posts/2025/01/pdf-generation-comarison/
- @react-pdf/renderer vs jsPDF/html2canvas: https://npm-compare.com/@react-pdf/renderer,jspdf,pdfmake,react-pdf
- SheetJS React integration: https://docs.sheetjs.com/docs/demos/frontend/react/
- PapaParse CSV parsing: https://www.papaparse.com/
- Mozilla pdf.js text extraction: https://mozilla.github.io/pdf.js/
- React chart libraries 2025: https://blog.logrocket.com/best-react-chart-libraries-2025/
- Reactive programming and spreadsheet engines: https://dev.to/around-it/35-reactive-programming-from-spreadsheets-to-modern-web-frameworks
