# Project State: PE Deal Workbench

---

## Project Reference

**Core value:** A fully configurable deal workbench that produces publication-quality visuals and a one-click PDF tearsheet — so an analyst can walk into any interview, open a URL, and show live deal work.

**Current focus:** Phase 1 — Foundation + LBO Engine

**Milestone:** v1

---

## Current Position

**Phase:** 1 of 3
**Plan:** None started
**Status:** Planning complete. Ready to begin Phase 1.

```
Progress: [----------] 0% complete
Phase 1: [ ] Foundation + LBO Engine
Phase 2: [ ] DCF + Comps
Phase 3: [ ] Visualizations + Export
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases defined | 3 |
| Requirements covered | 24/24 |
| Plans complete | 0 |
| Phases complete | 0/3 |
| Session count | 1 |
| Last active | 2026-03-10 |

---

## Accumulated Context

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

- Initialized project with `/gsd:new-project`
- Defined PROJECT.md, REQUIREMENTS.md (24 v1 requirements)
- Completed research: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
- Created ROADMAP.md (3 phases, 24/24 requirements mapped)
- Created STATE.md (this file)
- Status: planning complete, Phase 1 not started

### Next Session

Start Phase 1 planning with `/gsd:plan-phase 1`.

The plan for Phase 1 should address these build-order concerns from ARCHITECTURE.md:
1. Calculation engine (`computeLBO()`, types, unit tests) — no UI
2. Zustand stores (`modelStore`, `dataStore`) wired to engine
3. Data layer (PapaParse CSV parser, pdf.js extractor, normalizer, parse failure states)
4. Core UI (assumption panels, scenario toggle, output tables)
5. Vercel deployment with `vercel.json` SPA rewrite rule

---

*State initialized: 2026-03-10*
*Last updated: 2026-03-10*
