# Research Summary: PE Deal Workbench

**Project:** PE Deal Workbench — browser-based LBO / DCF / Comps analysis tool for interview prep
**Synthesized:** 2026-03-10
**Source files:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall confidence:** HIGH (all four research streams corroborated across authoritative sources)

---

## Executive Summary

The PE Deal Workbench is a single-page, fully client-side financial modeling tool targeting entry-level PE and IB candidates who need a credible, live demo of LBO, DCF, and comparable company analysis. The research is clear on how experts build this class of product: a layered architecture separates a pure TypeScript calculation engine from Zustand-managed state, a React/Recharts UI layer, and a data I/O layer for file parsing and export. No backend is required for v1. The entire tool — including PDF tearsheet generation and Excel export — runs in the browser, which is both architecturally correct and a legitimate selling point for a recruiting demo ("your uploaded financials never leave your browser").

The recommended stack is opinionated and well-justified: Vite over Next.js (no SSR benefit for a static SPA), Recharts over D3 or Plotly (right abstraction level for financial charts), ExcelJS over SheetJS (active CVEs in SheetJS Community Edition), and Financial Modeling Prep over Alpha Vantage or Polygon for comps data (the only free API providing both fundamentals and EV multiples). The single highest-leverage technical decision is using `decimal.js` for all financial arithmetic from day one — JavaScript's IEEE 754 floating-point errors compound catastrophically in financial models and destroy interviewer confidence.

The credibility bar for this tool is set by what a PE associate would expect from an analyst's first-day deliverable: a three-methodology valuation (LBO/DCF/comps) with live scenario toggling, color-coded sensitivity tables, a publication-quality one-page tearsheet, and a working Excel export. The research identifies 8 critical pitfalls — several of which would invalidate model output silently — and establishes a build order that eliminates them before they can propagate into the UI.

---

## Key Findings

### From STACK.md

**Core technologies (all verified against official docs and community usage as of 2026-03):**

| Technology | Rationale |
|------------|-----------|
| React 19 + TypeScript 5.8 | Hooks model maps cleanly to live scenario recalculation; typed interfaces enforce input/output contracts across engine |
| Vite 6 | SPA with no SSR requirement — Next.js adds server complexity with zero benefit |
| Zustand 5 | Minimal API, no Provider wrapping; flat store with slices is right for global financial state |
| React Hook Form + Zod | Avoids controlled re-renders on every keystroke; Zod schema shared between form and engine layer |
| Recharts 3 | D3-based composable API; v3 (Oct 2025) rewrote state management; waterfall via transparent base bar pattern |
| @react-pdf/renderer 4 | Declarative React component tree to vector PDF; fully client-side; never use html2canvas |
| ExcelJS 4 | Styled cells, formula support, multi-sheet; SheetJS CE has active CVEs (avoid) |
| PapaParse 5 + pdfjs-dist 4 | De facto CSV parser; Mozilla PDF.js for text extraction from 10-Ks |
| Financial Modeling Prep (free) | Only free API with both fundamental financials and EV multiples; 250 req/day |
| decimal.js 10 | Mandatory for all arithmetic; IEEE 754 floating point destroys financial model precision |
| Tailwind CSS 4 + shadcn/ui | CSS-native v4; shadcn is owned code — no design system lock-in |
| Vercel (Hobby) | Zero-config Vite detection; permanent free tier for static SPAs |

**Critical version flags:**
- Recharts 3.x only — do not use 2.x (unmaintained)
- Vite 6 requires Node 20.19+ or 22.12+
- Tailwind 4 has no `tailwind.config.js` — follow the Vite plugin setup path
- Two react-pdf packages with opposite purposes: `@react-pdf/renderer` creates PDFs; `react-pdf` displays them — install both, use correctly

---

### From FEATURES.md

**Table stakes (must ship — missing any fails the credibility test):**

- LBO: Sources and Uses, 3-tranche debt schedule (TLA/TLB/revolver), FCF sweep, exit assumptions, IRR/MOIC output, 2D sensitivity heatmap (entry × exit multiple × hold year)
- DCF: 5-year FCF projection, full WACC build (CAPM components, not a raw input), terminal value by two methods (Gordon Growth + exit multiple), WACC × terminal growth sensitivity table, implied share price
- Comps: Peer table with EV/EBITDA, EV/Revenue, P/E (LTM and NTM), summary statistics (median/mean/quartiles), implied valuation range, inline manual override
- Scenario toggle: base / bull / bear; must update all outputs and charts simultaneously
- Football field chart: unified valuation range from all three methodologies — required in every PE deck

**Ship in v1 for the "wow" moment:**
- IRR sensitivity heatmap with color coding (entry × exit multiple)
- One-click PDF tearsheet: company name, deal stats, LBO returns, DCF range, comps table, football field — must be clean and printable
- Excel export: full workbook with IS, assumptions, debt schedule, LBO, DCF, comps — with live formulas, not values-only

**Ship after core is stable:**
- CSV / 10-K upload to auto-populate inputs
- Auto-pulled comps via FMP API with manual override
- IRR waterfall / value creation attribution chart (EBITDA growth vs. multiple expansion vs. debt paydown)

**Explicitly defer to v2+:**
- Full three-statement model with circular references
- AI document parsing (CIM, earnings call transcripts)
- Sector-specific templates
- Fund-level waterfall / LP-GP carried interest
- Monte Carlo simulation

**Feature dependency graph (governs build order):**
Financial Inputs → LBO module → IRR/MOIC → sensitivity heatmap + waterfall chart. Financial Inputs → DCF module → WACC × TV sensitivity → implied share price. Peer Set → Comps → implied range. All three → Football field. Football field + LBO summary + comps + scenario returns → PDF tearsheet → Excel export.

---

### From ARCHITECTURE.md

**Recommended pattern: four-layer client-side architecture**

```
UI Layer (React components)          — render outputs, accept inputs; no math, no parsing
State Layer (Zustand stores)         — single source of truth; calls engine on assumption change
Calculation Engine (pure TypeScript) — stateless, deterministic, no React, fully testable
Data Layer (parsers + export adapters) — CSV/PDF inbound; @react-pdf/Excel outbound
```

**Key architectural decisions:**

- All three scenarios (base/bull/bear) are computed on every assumption change, not just the active one. Switching scenarios is instant — it is a display filter, not a recalculation trigger. This is required for the football field chart to show all three simultaneously.
- The calculation engine is pure TypeScript functions with no side effects. `computeLBO(assumptions) → outputs`. This makes it framework-portable and fully unit-testable with Vitest before any UI exists.
- Two Zustand stores: `modelStore` (assumptions + computed outputs per scenario + active module flags) and `dataStore` (parsed financials + company metadata + comps data). Kept separate to prevent cross-concern coupling.
- Do not use HyperFormula or a custom DAG spreadsheet engine. PE models have fixed calculation sequences with no user-written formulas. Pure functions are faster, simpler, and fully sufficient.
- Comps API calls go directly from the browser to FMP. If CORS is an issue, a single Vercel Edge Function (<10 lines) is the only server-side component needed.

**Suggested build order (dependency-driven, matches pitfall mitigation timing):**
1. Calculation Engine — define TypeScript types and engine functions; write Vitest tests against hand-computed outputs before wiring anything
2. State Layer — wire Zustand stores around engine; test with store unit tests before building UI
3. Data Layer (parsers) — CSV and PDF ingestion; normalizer to ParsedFinancials schema
4. Core UI + Charts — assumption panels, output tables, scenario toggle, Recharts visualizations
5. Export Layer — PDF tearsheet template, Excel workbook with formula strings

**Anti-patterns to actively reject:**
- Financial math inside React components (untestable, stale closure bugs)
- Computing only the active scenario on toggle (football field cannot work; visible latency)
- html2canvas for PDF export (rasterized, non-selectable, blurry at print DPI)
- Puppeteer for PDF (requires a server; incompatible with static deployment)
- HyperFormula or spreadsheet engine (unnecessary complexity for fixed-schema models)

---

### From PITFALLS.md

**Top critical pitfalls (any one of these invalidates the demo):**

| Pitfall | Phase | Prevention |
|---------|-------|-----------|
| IEEE 754 floating-point errors compound across all calculations | P1 | `decimal.js` for every financial arithmetic operation; enforce with unit test from day one |
| LBO circular reference (interest ↔ cash ↔ debt) computed incorrectly | P1 | Fixed-point iteration with convergence check; document assumption; assert delta < $0.01 after 10 iterations |
| DCF discount rate / FCF type mismatch (UFCF discounted at cost of equity) | P1 | Enforce pairing in model layer; build WACC as derived output from components, not raw input |
| Terminal value not discounted back to Year 0 | P1 | Two named variables (`tv_at_horizon`, `tv_at_present`); add % TV / EV validation with warning at 80% |
| IRR uses equal-spacing assumption instead of XIRR with date arrays | P1 | XIRR implementation; validate against Excel on same inputs before shipping |
| Management rollover double-counted as additional equity source | P1 | `sponsor_equity = total_equity - management_rollover` hard-coded constraint |
| PDF tearsheet rasterized via html2canvas (non-selectable text, blurry charts) | P2 | `@react-pdf/renderer` only; prototype renderer before designing tearsheet layout |
| Excel export produces values-only workbook (no formulas, no stress-testing) | P2 | Maintain formula strings alongside computed values; use ExcelJS for rich formatting |

**Moderate pitfalls (degrade demo quality but do not invalidate):**
- Free API rate limit hits during demo: cache all responses in localStorage with 24h TTL; pre-bundle static JSON fixtures for 15-20 common tickers as fallback
- Scanned PDFs return empty text with no error: check extracted text length; surface clear error; always support CSV as primary input
- Main-thread freeze on recalculation: Web Worker for engine; 200ms debounce on inputs; lazy sensitivity table computation
- Beta not re-levered for WACC (first question an interviewer asks): Hamada equation calculator built-in; labeled risk-free rate (never a magic number)

**Minor pitfalls (polish but recoverable):**
- Incomplete EV formula (missing preferred equity and minority interest)
- Number formatting does not match accounting convention (parentheses for negatives, $MM scale, 2dp multiples): build `formatFinancial(value, type)` utility before any output UI
- Scenario toggle updates LBO returns but not DCF or football field: single global scenario context in Zustand from the start

---

## Implications for Roadmap

### Recommended phase structure

The dependency graph from FEATURES.md and the build order from ARCHITECTURE.md, cross-referenced with the pitfall phase warnings, point clearly to a 5-phase structure:

---

**Phase 1: Calculation Engine + Foundation (weeks 1-2)**

Rationale: The engine is the only layer with zero external dependencies. All pitfalls rated "Address in Phase 1" live here. Bugs fixed at this layer are cheap; the same bugs found after the UI is built require tearing down two layers.

Delivers: Verified, testable financial computation for LBO, DCF, and comps — the intellectual core of the entire product.

Features: LBO (sources/uses, debt schedule, FCF sweep, IRR/MOIC), DCF (FCF projection, WACC build, terminal value by two methods, sensitivity grid), Comps (multiple statistics, implied range), number formatting utility, Zustand stores wired to engine.

Pitfalls to address: decimal.js adoption, circular reference iteration, UFCF/WACC pairing enforcement, terminal value discounting, XIRR implementation, management rollover constraint, WACC component-based build, EV formula completeness, `formatFinancial()` utility, global scenario state.

Research flag: Standard patterns well-documented. No additional phase research needed.

---

**Phase 2: Core UI + Data Ingestion (weeks 3-4)**

Rationale: State layer is stable; now wire assumption panels and output displays against real computed data. Bring real financial data into the tool via file upload before building charts — building charts against fixtures creates throwaway work.

Delivers: Working assumption inputs, live output tables, CSV and PDF upload with parse-and-populate flow.

Features: AssumptionPanel (LBO, DCF, comps), OutputSection (returns tables, DCF summary, comps table), ScenarioToggle wired globally, UploadZone + PapaParse CSV parser + pdfjs-dist text extractor, ParsedFinancials normalizer, manual override fields for all parsed values.

Pitfalls to address: Scanned PDF detection and error messaging, parse failure states, scenario toggle propagation across all outputs.

Research flag: Standard patterns. No additional research needed.

---

**Phase 3: Visualizations (week 5)**

Rationale: Charts require stable, production-like outputs. Building charts against incomplete model outputs produces throwaway layout work. Recharts waterfall pattern (transparent base bar) requires knowing the final data shape.

Delivers: Full visual dashboard — IRR heatmap, football field, IRR waterfall, returns bridge.

Features: IRR sensitivity heatmap (color-coded), football field (horizontal bar ranges for all three methodologies), IRR waterfall / value creation attribution (EBITDA growth + multiple expansion + debt paydown), returns bridge chart, module enable/disable controls.

Pitfalls to address: All-scenario pre-computation for football field (already addressed in P1 architecture), Web Worker if profiling shows main-thread jank during chart re-renders.

Research flag: Recharts waterfall chart pattern (transparent base bar stacked BarChart) may benefit from a quick spike before committing to the full chart layout. Low risk.

---

**Phase 4: Export Layer (week 6)**

Rationale: Export quality depends entirely on having stable, production-like outputs to render. Building tearsheet layout before outputs are final produces throwaway design work. Prototype the PDF renderer first to confirm layout decisions are compatible with @react-pdf/renderer's constraints.

Delivers: One-click PDF tearsheet and Excel workbook export — the two "wow" deliverables.

Features: @react-pdf/renderer tearsheet (company branding, deal stats, LBO returns, DCF range, comps table, football field embedded as PNG), ExcelJS workbook (assumptions sheet, debt schedule, LBO outputs, DCF outputs, comps — with formula strings and named ranges), lazy-loaded ExcelJS (dynamic import on click).

Pitfalls to address: Vector PDF (not rasterized), selectable text, SVG-to-PNG chart conversion for embedding, Excel formula strings alongside computed values, lazy-load ExcelJS to protect initial bundle size.

Research flag: SVG to PNG conversion for PDF chart embedding may require a spike. The @react-pdf/renderer `<Image>` component requires a raster input; the Recharts SVG-to-PNG conversion path needs validation. Flag for research before this phase begins.

---

**Phase 5: Live Market Data + Polish (week 7)**

Rationale: Auto-pulled comps data and financial statement upload are differentiators, not table stakes. The core analytical tool must be credible before adding live data dependencies that can fail during a demo.

Delivers: Real-time comps data with graceful degradation, 10-K upload with assisted extraction, demo-ready polish.

Features: FMP API integration for comps (EV/EBITDA, revenue, EBITDA, P/E), localStorage cache with 24h TTL, static JSON fixture fallback for 20 common tickers, data freshness display ("Prices as of [timestamp]"), PDF 10-K upload with text extraction and manual correction UI, deal name/logo/analyst name branding on tearsheet.

Pitfalls to address: API rate limit during demo (caching + fixtures), scanned PDF handling (already addressed in P2 but validate end-to-end here), CORS handling via Vercel Edge Function if needed.

Research flag: FMP API response schema and CORS behavior should be validated in a quick spike before building the comps data pipeline. Free tier behavior is well-documented but confirm endpoint structure for EV multiples.

---

### Phase summary

| Phase | Focus | Duration | Research Flag |
|-------|-------|----------|---------------|
| 1 | Calculation Engine + Foundation | 2 weeks | None — standard patterns |
| 2 | Core UI + Data Ingestion | 2 weeks | None — standard patterns |
| 3 | Visualizations | 1 week | Spike: Recharts waterfall pattern |
| 4 | Export Layer | 1 week | Spike: SVG-to-PNG for PDF chart embedding |
| 5 | Live Market Data + Polish | 1 week | Spike: FMP API schema + CORS validation |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major choices verified against official docs, npm download data, and community comparisons. ExcelJS vs SheetJS decision corroborated by documented CVEs. FMP free tier limits confirmed against current pricing page. |
| Features | HIGH | Corroborated across Wall Street Prep, WSO, CFI, Macabacus, and PE practitioner sources. Feature prioritization reflects actual interview testing patterns, not assumptions. |
| Architecture | HIGH (core), MEDIUM (PDF export) | Four-layer pattern is well-established for financial SPA products. PDF export tradeoffs confirmed across multiple library comparison sources. Some uncertainty on @react-pdf/renderer SVG embedding path — validate early. |
| Pitfalls | HIGH (financial model logic), MEDIUM (browser implementation) | Financial model pitfalls verified against Wall Street Prep, UpLevered, and WSO practitioner sources. Browser-specific implementation pitfalls (Web Worker timing, PapaParse encoding edge cases) are well-documented but context-dependent. |

---

## Gaps to Address During Planning

1. **SVG-to-PNG conversion for PDF chart embedding.** @react-pdf/renderer requires raster images; Recharts renders to SVG. The `canvas` API conversion path is documented but needs a working prototype before the tearsheet layout is finalized. If it fails, an alternative (pre-rendered PNG from the chart library) must be ready.

2. **FMP API schema validation.** PITFALLS.md notes that IEX Cloud shut down in August 2024 and Yahoo Finance's unofficial API breaks without warning. FMP is the recommended alternative but the exact endpoint structure for EV multiples and the CORS behavior from a browser-side call should be confirmed in a quick spike before the comps data pipeline is architected.

3. **Vitest test fixtures for known PE model outputs.** The architecture recommends building the engine first and testing it against hand-computed or Excel-verified outputs. A set of 3-5 reference deals (a standard 5-year LBO at 5x entry/10x exit, a DCF at 10% WACC / 3% terminal growth, a 5-peer comps set) should be documented as test fixtures before engine development begins. Without these, test assertions cannot catch formula errors.

4. **Excel formula string maintenance strategy.** PITFALLS.md flags that values-only Excel export is a known failure mode, and maintaining formula strings alongside computed values requires a deliberate strategy. This should be architected at the engine layer (Phase 1), not retrofitted in the export layer (Phase 4).

5. **PDF parsing quality ceiling for 10-K filings.** Both STACK.md and ARCHITECTURE.md note that PDF text extraction from financial tables is inherently fragile. The v1 design should document the expected CSV format for reliable ingestion and frame PDF as "assisted extraction with manual verification" — not automatic parsing. User-facing copy for this feature should be drafted before the upload UI is built.

---

## Aggregated Sources

- Wall Street Prep: LBO modeling, comps analysis, football field chart, DCF errors
- Wall Street Oasis: Circular references, scenario modeling, PE interview requirements
- Corporate Finance Institute: LBO model construction
- Macabacus: LBO capital structure, comps analysis
- UpLevered: LBO modeling traps, IRR pitfalls
- Mergers & Inquisitions: PE interview guide
- React docs (react.dev), Vite docs (vite.dev), Recharts 3.0 migration guide
- npm: @react-pdf/renderer, ExcelJS, PapaParse, pdfjs-dist, decimal.js, Zustand
- SheetJS CVE advisories (GHSA-4r6h-8v6p-xvw6, CVE-2023-30533, CVE-2024-22363)
- Financial Modeling Prep pricing (free tier confirmation)
- Martin Fowler: Modularizing React Apps (layered architecture)
- Modern Treasury: floats and financial precision
- Damodaran (NYU): equity risk premium data (referenced in WACC section)
- Vercel: SPA deployment configuration
- Mozilla pdf.js documentation
