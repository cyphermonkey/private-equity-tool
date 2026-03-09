---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-03-09T21:17:47.529Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 3
  completed_plans: 2
  percent: 33
---

# Project State: PE Deal Workbench

---

## Project Reference

**Core value:** A fully configurable deal workbench that produces publication-quality visuals and a one-click PDF tearsheet — so an analyst can walk into any interview, open a URL, and show live deal work.

**Current focus:** Phase 1 — Foundation + LBO Engine

**Milestone:** v1

---

## Current Position

**Phase:** 1 of 3
**Plan:** 01-02 complete (01-03 next)
**Status:** Phase 1 in progress — engine layer + state layer + data ingestion complete.

```
Progress: [███████░░░] 67%
Phase 1: [2/3] Foundation + LBO Engine (plans 01-02 complete)
Phase 2: [ ] DCF + Comps
Phase 3: [ ] Visualizations + Export
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases defined | 3 |
| Requirements covered | 24/24 |
| Plans complete | 2 |
| Phases complete | 0/3 |
| Session count | 2 |
| Last active | 2026-03-10 |

---
| Phase 01-foundation-lbo-engine P01 | 37 | 2 tasks | 15 files |
| Phase 01-foundation-lbo-engine P02 | 4 | 2 tasks | 11 files |

## Accumulated Context

### Decisions from Plan Execution

| Phase-Plan | Decision | Rationale |
|------------|----------|-----------|
| 01-01 | Cash sweep = EBITDA - capex - interest - mandatory amort | Without capex deduction IRR was ~29%; including it aligns with VALIDATION.md Excel benchmark (25-28%) |
| 01-01 | XIRR via Newton-Raphson, date-explicit cashflows | Validates at 14.87% for $100/$200 at 5y; plain IRR rejected per financial model constraints |
| 01-01 | computeLBO returns raw Decimal strings, formatFinancial() is UI-only | Engine is pure; formatting is a display concern not a calculation concern |
| 01-01 | index.html replaced with Vite SPA entry | PE Deal Workbench replaces static portfolio site in this repo |
| 01-02 | Zustand getState() in tests — no renderHook needed for pure store logic | Simpler pattern; stores are plain JS objects accessed via getState() |
| 01-02 | parseCSVFromString exported for testing without File API | PapaParse parses strings identically to files; avoids jsdom File mock complexity |
| 01-02 | Scanned PDF guard: < 200 chars AND numPages > 1 | Single-page PDFs (cover, summary) legitimate; multi-page with no text is scanned |

### Architecture Decisions Locked

| Decision | What | Why |
|----------|------|-----|
| Build tool | Vite 6 + React 19 + TypeScript 5.8 | Static SPA — no SSR or server components needed; no Next.js |
| State | Zustand 5 (two stores: modelStore + dataStore) | Flat store model fits financial state well; no Redux boilerplate |
| Calculation engine | Pure TypeScript functions (no framework coupling) | Fully unit-testable; defines data contracts before UI is built |
| Scenario pattern | Compute all 3 scenarios on every assumption change; toggle is display-only | Instant toggle, football field chart reads all three simultaneously |
| Math library | decimal.js — mandatory for all financial arithmetic | IEEE 754 floating-point errors destroy credibility in a PE demo |
| CSV parsing | PapaParse 5 | Browser-native, RFC 4180 compliant, worker thread support |
| PDF parsing | pdfjs-dist 4 (Mozilla pdf.js) | Client-side text extraction; treat as best-effort, manual override required |
| Market data | FMP free tier (250 req/day) | Only free API with EV/EBITDA multiples and fundamentals in same call |
| Comps caching | 24h localStorage cache + 15-20 static fixture fallback | Rate limit during demo must not break comps table |
| Charts | Recharts 3 | React-native, sufficient for waterfall/bridge/football field; not D3 or Plotly |
| PDF export | @react-pdf/renderer 4 | Vector PDF, selectable text, client-side — no html2canvas, no Puppeteer |
| Excel export | ExcelJS 4 (lazy-loaded) | Formula strings exported, not value dumps; SheetJS CE has active CVEs |
| Deployment | Vercel Hobby (static hosting) | Zero-config Vite detection; free permanent tier for personal projects |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first, no opinionated design system to fight against |

### Financial Model Constraints (non-negotiable)

- **Floating point**: No native JS arithmetic on any financial value. decimal.js wraps every operation.
- **IRR**: XIRR implementation (date-explicit cash flows), not plain IRR. Validate against known result: $100 in, $200 out at 5 years = 14.87%.
- **Debt schedule circular**: Fixed-point iteration (3–5 passes, delta < $0.01). Beginning-of-period balance as documented fallback.
- **Sources & Uses**: `sponsor_equity = total_equity - management_rollover`. Hard constraint, not a UX suggestion.
- **WACC**: Always derived from components (equity weight, debt weight, cost of equity, pre-tax cost of debt, tax rate). Never a raw user input field.
- **Beta**: Hamada re-levering calculator built in. Risk-free rate labeled with date, never a magic number.
- **Terminal value**: Two named variables (`tv_at_horizon`, `tv_at_present`). Warning if TV/EV > 80%. Hard error if terminal growth >= WACC.
- **FCF/discount rate pairing**: UFCF discounted at WACC. Cannot enter "discount rate" without it being derived as WACC.
- **EV formula**: `Market Cap + Total Debt + Preferred + Minority Interest - Cash`. Full formula, not the shortened version.
- **Number formatting**: `formatFinancial(value, type)` utility built in Phase 1 before any output UI. Parentheses for negatives, never minus signs in tables.
- **PDF text layer**: Target under 500KB, all text selectable. No rasterized output.
- **Excel formulas**: ExcelJS exports formula strings alongside computed values. Acceptance test: change one input in Excel, verify downstream cells update.

### Pitfalls to Watch Per Phase

**Phase 1:**
- Floating-point arithmetic before decimal.js is wired in
- LBO circular not handled (interest ↔ cash sweep)
- Plain IRR instead of XIRR
- Scanned PDF → silent zero-fill (add text-length check post-parse)
- Partial scenario propagation (global Zustand scenario before any module UI)
- Management rollover double-counting in Sources & Uses

**Phase 2:**
- Undiscounted terminal value (the most common DCF error)
- WACC entered as a raw number instead of derived from components
- Beta used without re-levering for the target's capital structure
- Sensitivity table running N×M engine calls on every keystroke (lazy-compute)
- FMP API fails during demo (caching + fixture fallback must be in place)

**Phase 3:**
- html2canvas for PDF (reject this path entirely)
- SheetJS CE for Excel (use ExcelJS instead, CVE risk)
- Excel export with static values only (must export formula strings)
- IRR waterfall attribution math not summing to total MOIC

### Todos / Open Questions

- [ ] Confirm FMP API key procurement before Phase 2 comps work begins
- [ ] Decide CSV column header convention for ingested financials (document expected schema for users)
- [ ] Decide: will sensitivity table be a separate tab or inline in the DCF section?
- [ ] Decide: company branding/logo on PDF tearsheet — placeholder or user-uploadable image?

### Blockers

None.

---

## Session Continuity

### Last Session (2026-03-10)

- Executed Plan 01-02: Zustand state layer + data ingestion layer
- modelStore (3-scenario management, all-scenario recompute), dataStore (parsedFinancials + overrideField)
- CSV parser (PapaParse + alias normalization), PDF extractor (pdfjs-dist + scanned guard), normalizer
- 52 Vitest tests GREEN (21 engine + 12 stores + 19 data); tsc clean
- Stopped at: Completed 01-foundation-lbo-engine/01-02-PLAN.md

### Next Session

Continue Phase 1 with Plan 03 (React UI components).
- Assumption input panel wired to modelStore.setAssumption
- Output display reading from modelStore.outputs[activeScenario]
- File upload UI for CSV/PDF ingestion via dataStore
- Scenario toggle (base/bull/bear) wired to modelStore.setActiveScenario

---

*State initialized: 2026-03-10*
*Last updated: 2026-03-10*
