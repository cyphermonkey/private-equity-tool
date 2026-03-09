# PE Deal Workbench — Roadmap

**Project:** PE Deal Workbench
**Milestone:** v1
**Created:** 2026-03-10
**Granularity:** Coarse (3 phases)
**Coverage:** 24/24 v1 requirements mapped

---

## Phases

- [ ] **Phase 1: Foundation + LBO Engine** — Working LBO model with CSV/PDF ingestion, scenario toggle, and live deployment on Vercel
- [ ] **Phase 2: DCF + Comps** — Full valuation suite with DCF engine, WACC sensitivity, and comparable company analysis via FMP API
- [ ] **Phase 3: Visualizations + Export** — Publication-quality charts (waterfall, bridge, football field), one-click PDF tearsheet, and Excel model export

---

## Phase Details

### Phase 1: Foundation + LBO Engine

**Goal**: An analyst can upload company financials, configure LBO assumptions across three scenarios, and see live IRR/MOIC output — deployed at a public URL they can open in any interview.

**Depends on**: Nothing (first phase)

**Requirements**: INGEST-01, INGEST-02, INGEST-03, LBO-01, LBO-02, LBO-03, LBO-04, SCEN-01, SCEN-02, SCEN-03, DEPLOY-01

**Success Criteria** (what must be TRUE when this phase completes):
  1. User can upload a CSV of financial data and see revenue, EBITDA, capex, and D&A auto-populated into LBO assumption inputs
  2. User can upload a 10-K PDF and see partial financial extraction with a clear prompt to review and correct each field
  3. User can configure Sources & Uses (entry multiple, equity %, debt tranches) and see a multi-year debt schedule with mandatory amortization and cash sweep
  4. User can set exit year and exit multiple, then see IRR and MOIC output update immediately
  5. User can toggle between base, bull, and bear scenarios and all LBO outputs (debt schedule, IRR, MOIC) update in the same render cycle — no perceptible lag
  6. App is accessible via a public Vercel URL with no install required

**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold + Vitest + LBO engine (types, computeLBO, XIRR, formatFinancial) + all engine tests GREEN
- [ ] 01-02-PLAN.md — Zustand stores (modelStore, dataStore) + data ingestion (CSV parser, PDF extractor, normalizer) + all store/data tests GREEN
- [ ] 01-03-PLAN.md — React UI (upload zone, assumption panel, output table, scenario toggle) + Vercel deployment

**Tech Notes**:
- Scaffold: `npm create vite@latest pe-deal-workbench -- --template react-ts` — no Next.js, this is a static SPA
- Engine layer first: write `computeLBO()` as a pure TypeScript function before any UI. Define `LBOAssumptions` and `LBOOutputs` types as the contract all layers build against
- Use `decimal.js` for every arithmetic operation in the engine — no native JS number math on financial values. Write a unit test asserting `0.1 + 0.2 === 0.3` via the library before touching the LBO formula
- Debt schedule circular reference (interest expense ↔ cash available for paydown): resolve with fixed-point iteration (3–5 passes until delta < $0.01). Use beginning-of-period balances as a named fallback if iteration fails to converge
- XIRR implementation required (not plain IRR): accept `[cashflow, date]` pairs. Validate against a known result: $100 invested, $200 returned at 5 years = 14.87% IRR
- Zustand stores: `modelStore` (assumption sets keyed by scenario, pre-computed outputs for all three scenarios) and `dataStore` (parsed financials). Compute all three scenarios on every assumption change — scenario toggle is then a display filter with zero recalculation cost
- Sources & Uses: enforce `sponsor_equity = total_equity - management_rollover` as a hard constraint — never allow independent entry of both
- CSV parsing: PapaParse with column header matching → `ParsedFinancials` schema. Post-parse: if fewer than 200 characters extracted from a multi-page PDF, surface "appears to be a scanned document" error — do not silently zero-fill
- Market data caching: even though comps are Phase 2, implement the 24h `localStorage` cache layer in Phase 1 data architecture so it is ready
- `formatFinancial(value, type)` utility must be built before any output UI: types for `currency_mm`, `percentage_2dp`, `multiple_2dp`. Accounting-style parentheses for negative values, never a minus sign in tables
- Vercel deployment: add `vercel.json` with SPA rewrite rule (`"source": "/(.*)", "destination": "/index.html"`) before first deploy

---

### Phase 2: DCF + Comps

**Goal**: The workbench delivers a complete valuation suite — an analyst can compute a DCF with WACC sensitivity and pull live public comps to anchor the entry/exit multiple conversation.

**Depends on**: Phase 1 (calculation engine architecture, Zustand stores, scenario state, `ParsedFinancials` schema)

**Requirements**: DCF-01, DCF-02, DCF-03, DCF-04, DCF-05, COMP-01, COMP-02, COMP-03

**Success Criteria** (what must be TRUE when this phase completes):
  1. User can input per-year revenue growth, EBITDA margin, and capex assumptions and see a 5-year unlevered FCF projection
  2. User can build WACC from its components (cost of equity via CAPM, pre-tax cost of debt, tax rate, capital structure weights) and see the derived WACC — not a raw input field
  3. User can select Gordon Growth or exit multiple as the terminal value method and see implied enterprise value and per-share price
  4. A WACC × terminal growth rate sensitivity table (at minimum 5×5) displays with color coding — green cells above current implied price, red below
  5. User can search for a public company ticker and add it to the comps table, with EV/EBITDA, EV/Revenue, and P/E multiples auto-populated from the FMP API
  6. User can manually edit any metric in the comps table and see summary statistics (median, mean, 25th/75th percentile) update immediately
  7. All DCF and comps outputs change when the user switches scenarios

**Plans**: TBD

**Tech Notes**:
- `computeDCF()` pure function: implement terminal value in two explicit named steps (`tv_at_horizon`, `tv_at_present`) — never collapse into a single expression. Add validation: if terminal value / total EV exceeds 80%, surface a yellow warning in the UI
- Hard constraint: terminal growth rate must be less than WACC or produce a form validation error (prevents negative denominator in Gordon Growth formula)
- WACC: collect equity weight, debt weight, cost of equity, pre-tax cost of debt, tax rate — compute WACC programmatically. Provide a beta re-levering calculator (Hamada equation) as an expandable helper alongside the beta input field. Pre-populate risk-free rate from a labeled static value ("10-Year UST as of [date]") — never a magic number in source code
- FCF type enforcement: UFCF discounted at WACC. The UI must not allow a user to enter a "discount rate" without it being derived as WACC from components
- Sensitivity table: compute lazily (only when the sensitivity tab is active) to avoid running N×M engine calls on every keystroke. This is the primary performance protection for the DCF module
- FMP API: implement `localStorage` 24h cache before wiring any comps UI. Pre-bundle 15–20 large-cap fixture tickers as static JSON fallback for demo resilience — API quota exhaustion during an interview must not break the comps table
- EV formula: `Market Cap + Total Debt + Preferred + Minority Interest - Cash` — not the shortened `Market Cap + Net Debt`. Source all components from the FMP API response
- `computeComps()` outputs an implied valuation range from the median EV/EBITDA applied to the target's EBITDA — this feeds directly into the football field chart in Phase 3
- Performance: if any assumption change causes noticeable main-thread freeze, move the calculation engine into a Web Worker at this point. Debounce all numeric inputs to 200ms

---

### Phase 3: Visualizations + Export

**Goal**: The workbench produces the outputs that make it a portfolio piece — publication-quality charts an analyst can discuss in an interview, a one-click PDF tearsheet they can hand across a table, and an Excel model a recruiter can open and stress-test.

**Depends on**: Phase 2 (all three model engines producing stable outputs, all three scenario outputs simultaneously available in the store)

**Requirements**: VIZ-01, VIZ-02, VIZ-03, EXP-01, EXP-02

**Success Criteria** (what must be TRUE when this phase completes):
  1. An IRR waterfall chart displays the decomposition of returns by value driver (EBITDA growth, multiple expansion, debt paydown) with signed, floating bars
  2. A returns bridge chart is visible alongside the waterfall, showing beginning and ending equity value with intermediate value creation bars
  3. A valuation football field chart displays side-by-side horizontal bars for LBO implied equity value, DCF implied equity value, and comps implied range — all three simultaneously, not toggled
  4. User can click "Export PDF" and download a one-page tearsheet under 500KB with all text selectable (not a rasterized screenshot), containing deal name, LBO returns by scenario, DCF output, comps summary, and the football field chart
  5. User can click "Export Excel" and download an .xlsx workbook where changing an assumption cell propagates through dependent formula cells (not a static value dump)

**Plans**: TBD

**Tech Notes**:
- Charts: Recharts 3.x (not Plotly, not Chart.js). Waterfall and bridge charts use a stacked `BarChart` with a transparent "invisible" base bar — standard pattern, approximately 30 lines of data transformation
- Football field chart: reads from all three simultaneously pre-computed scenario outputs in the Zustand store — no toggle needed, all ranges render in a single pass
- PDF export: `@react-pdf/renderer` only. No html2canvas. No jsPDF. The tearsheet is a React component tree that renders to a vector PDF with selectable text. Chart embedding pattern: convert Recharts SVG output to PNG via the `canvas` API, then embed as `<Image>` in the PDF component
- Target: PDF file size under 500KB, all text selectable, charts not pixelated at 2x zoom in a PDF viewer
- Excel export: use ExcelJS (not SheetJS CE — active CVEs). Lazy-load ExcelJS via dynamic `import()` so it does not affect initial bundle size. Export formula strings (`{f: "=B2*C2"}`) alongside computed values so the workbook recalculates natively in Excel. Structure with named ranges for key inputs
- Test the Excel export: open in Excel, change one input cell, verify dependent cells update. This is the acceptance criterion for EXP-02
- IRR waterfall value attribution math: `total_return = ebitda_growth_component + multiple_expansion_component + leverage_paydown_component`. Each signed bar must sum to total MOIC. Verify attribution against hand-calculation before wiring the chart

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + LBO Engine | 2/3 | In Progress|  |
| 2. DCF + Comps | 0/? | Not started | - |
| 3. Visualizations + Export | 0/? | Not started | - |

---

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGEST-01 | Phase 1 | Pending |
| INGEST-02 | Phase 1 | Pending |
| INGEST-03 | Phase 1 | Pending |
| LBO-01 | Phase 1 | Pending |
| LBO-02 | Phase 1 | Pending |
| LBO-03 | Phase 1 | Pending |
| LBO-04 | Phase 1 | Pending |
| SCEN-01 | Phase 1 | Pending |
| SCEN-02 | Phase 1 | Pending |
| SCEN-03 | Phase 1 | Pending |
| DEPLOY-01 | Phase 1 | Pending |
| DCF-01 | Phase 2 | Pending |
| DCF-02 | Phase 2 | Pending |
| DCF-03 | Phase 2 | Pending |
| DCF-04 | Phase 2 | Pending |
| DCF-05 | Phase 2 | Pending |
| COMP-01 | Phase 2 | Pending |
| COMP-02 | Phase 2 | Pending |
| COMP-03 | Phase 2 | Pending |
| VIZ-01 | Phase 3 | Pending |
| VIZ-02 | Phase 3 | Pending |
| VIZ-03 | Phase 3 | Pending |
| EXP-01 | Phase 3 | Pending |
| EXP-02 | Phase 3 | Pending |

**v1 coverage: 24/24 requirements mapped. 0 unmapped.**

---

*Roadmap created: 2026-03-10*
*Last updated: 2026-03-10 after Phase 1 planning*
