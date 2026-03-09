---
phase: 01-foundation-lbo-engine
plan: 01
subsystem: engine
tags: [vite, react, typescript, vitest, decimal.js, xirr, lbo, tdd]

# Dependency graph
requires: []
provides:
  - Vite 6 + React 19 + TypeScript 5.8 SPA scaffold with Vitest configured
  - LBOAssumptions, LBOOutputs, DebtTranche, DebtYearRow, ParsedFinancials, ScenarioKey — typed contracts
  - computeLBO() pure function — full 5-step LBO model (S&U, projection, debt schedule, exit, XIRR/MOIC)
  - xirr() Newton-Raphson XIRR with date-explicit cashflows (validates at 14.87%)
  - formatFinancial() centralized display formatting with parentheses-for-negatives accounting convention
  - vercel.json SPA rewrite rule for deep-link routing
  - 21 engine tests, all GREEN
affects:
  - 01-02 (Zustand stores will import LBOAssumptions, LBOOutputs, computeLBO)
  - 01-03 (data layer will use ParsedFinancials, LBOAssumptions types)
  - 01-04 (UI layer will import formatFinancial, LBOOutputs)
  - All future phases (engine contracts are the foundation)

# Tech tracking
tech-stack:
  added:
    - vite@6 (build + dev server)
    - react@19 + react-dom@19
    - typescript@5.8 (strict mode)
    - vitest@3 (test framework, globals enabled)
    - decimal.js@10 (all financial arithmetic)
    - zustand@5 (installed, not yet wired)
    - papaparse@5 (installed, not yet wired)
    - pdfjs-dist@4 (installed, not yet wired)
    - tailwindcss@4 + @tailwindcss/vite@4 (CSS-native, no config file)
    - react-hook-form@7 + zod@3 (installed, not yet wired)
  patterns:
    - TDD red-green: test stubs committed RED first, implementation committed GREEN second
    - All engine functions are pure TypeScript (no React dependencies)
    - decimal.js for all arithmetic — zero native JS number operations on financial values
    - formatFinancial() called only in UI layer — engine returns raw Decimal strings
    - Fixed-point iteration for LBO circular (interest ↔ cash sweep), convergence delta < $0.01
    - XIRR with Newton-Raphson (not plain IRR) — date-explicit cashflows

key-files:
  created:
    - src/engine/types.ts
    - src/engine/lbo.ts
    - src/engine/xirr.ts
    - src/engine/format.ts
    - src/engine/__tests__/lbo.test.ts
    - src/engine/__tests__/xirr.test.ts
    - src/engine/__tests__/format.test.ts
    - package.json
    - vite.config.ts
    - tsconfig.json + tsconfig.app.json + tsconfig.node.json
    - src/main.tsx + src/App.tsx + src/index.css
    - src/vite-env.d.ts
    - vercel.json
  modified:
    - index.html (replaced portfolio HTML with Vite SPA entry point)

key-decisions:
  - "Cash sweep deducts capex before applying to debt — FCF = EBITDA - capex - interest - mandatory amort — matching Excel VALIDATION.md expected ranges of 25-28% IRR, 3.0-3.5x MOIC"
  - "Decimal.js has no .min() instance method — replaced with conditional (greaterThan ? a : b) to avoid TypeError"
  - "vite.config.ts requires /// <reference types='vitest' /> triple-slash directive for the test: {} property to typecheck correctly alongside tsc -b"
  - "index.html replaced: the existing portfolio HTML was overwritten to become the Vite SPA root — the PE Deal Workbench replaces the static portfolio site in this repo"
  - "xirr() throws on all-positive or all-negative cashflows — caller (computeLBO) catches and sets irr='NaN', converged=false"

patterns-established:
  - "Engine layer is pure TypeScript: no React, no Zustand, no side effects — fully unit-testable in isolation"
  - "FormatType exported from types.ts, re-exported from format.ts — one source of truth"
  - "LBOOutputs.irr is a raw decimal string ('0.2587'), not a formatted percentage — formatFinancial() is the UI's job"
  - "Debt schedule built as flat DebtYearRow[] array, keyed by (year, tranche) — UI can filter/group as needed"

requirements-completed: [LBO-01, LBO-02, LBO-03, LBO-04, SCEN-01, SCEN-02, SCEN-03]

# Metrics
duration: 37min
completed: 2026-03-10
---

# Phase 1 Plan 01: Foundation + LBO Engine Summary

**Vite 6 + React 19 SPA scaffold with complete LBO calculation engine — computeLBO() using decimal.js arithmetic, XIRR Newton-Raphson, fixed-point debt schedule iteration, and formatFinancial() with accounting parentheses — all 21 Vitest tests GREEN**

## Performance

- **Duration:** 37 min
- **Started:** 2026-03-09T21:01:23Z
- **Completed:** 2026-03-09T21:38:16Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Complete Vite 6 + React 19 + TypeScript 5.8 project scaffold with Vitest configured (globals enabled), vercel.json SPA rewrite, and Tailwind v4 CSS-native setup
- Full LBO engine: computeLBO() covers Sources & Uses, 5-year revenue/EBITDA projection, fixed-point debt schedule (convergence delta < $0.01), exit proceeds (exitEV = exitMultiple × exitEBITDA), and XIRR/MOIC using date-explicit cashflows
- All 21 engine tests GREEN: XIRR 14.87% validation, sponsor equity constraint ($380M), IRR 25-28% range, MOIC 3.0-3.5x range, formatFinancial negative parentheses, debt schedule convergence — plus TypeScript strict mode clean, Vite build producing dist/

## Task Commits

1. **Task 1: Scaffold project + configure Vitest + write Wave 0 test stubs** - `76d2269` (test)
2. **Task 2: Implement engine layer — types, format, xirr, computeLBO — tests go GREEN** - `9ba70e4` (feat)

## Files Created/Modified

- `src/engine/types.ts` — LBOAssumptions, LBOOutputs, DebtTranche, DebtYearRow, ParsedFinancials, ScenarioKey, FormatType
- `src/engine/lbo.ts` — computeLBO() pure function with all 5 calculation steps
- `src/engine/xirr.ts` — Newton-Raphson XIRR, validates at 14.87% for $100/$200 at 5y
- `src/engine/format.ts` — formatFinancial() with currency_mm, percentage_2dp, multiple_2dp, basis_points
- `src/engine/__tests__/lbo.test.ts` — 10 tests covering LBO-01 through LBO-04 with standard fixture
- `src/engine/__tests__/xirr.test.ts` — 3 tests: 14.87% validation, negative-flow requirement, non-convergence
- `src/engine/__tests__/format.test.ts` — 8 tests: all four types, positive/negative, parentheses convention
- `package.json` — all Phase 1 dependencies declared
- `vite.config.ts` — Vite + React + Tailwind + Vitest test config
- `index.html` — Vite SPA entry point (replaced portfolio HTML)
- `vercel.json` — SPA rewrite rule for deep links
- `src/vite-env.d.ts` — Vite client type declarations for CSS imports

## Decisions Made

- **FCF sweep formula**: Cash sweep deducts capex before applying to debt (FCF = EBITDA - capex - interest - mandatory amort). Without capex deduction, IRR came out at ~29% vs. the VALIDATION.md expected range of 25-28%. Adding capex deduction brings the model in line with the pre-computed Excel benchmark.
- **Decimal.min() workaround**: Decimal.js does not expose `.min()` as an instance method (it's a static method). Used conditional expressions throughout lbo.ts.
- **vitest reference type**: `vite.config.ts` required a `/// <reference types="vitest" />` triple-slash directive to allow the `test: {}` property without TypeScript error during `tsc -b`.
- **index.html replaced**: The existing portfolio static HTML was overwritten — this repo now serves the PE Deal Workbench SPA instead of the personal portfolio pages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Decimal.js .min() is not an instance method**
- **Found during:** Task 2 (implement computeLBO)
- **Issue:** Three calls to `.min(value)` on Decimal instances threw `TypeError: (intermediate value).times(...).dividedBy(...).min is not a function` — Decimal.js only exposes min() as `Decimal.min(a, b)` static, not as instance method
- **Fix:** Replaced all `.min()` calls with conditional expressions: `value.greaterThan(cap) ? cap : value`
- **Files modified:** `src/engine/lbo.ts`
- **Verification:** All 21 tests pass after fix
- **Committed in:** `9ba70e4` (Task 2 commit)

**2. [Rule 3 - Blocking] vite.config.ts needed Vitest reference type for tsc -b**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** `tsc -b` reported `Object literal may only specify known properties, and 'test' does not exist in type 'UserConfigExport'`
- **Fix:** Added `/// <reference types="vitest" />` at top of vite.config.ts
- **Files modified:** `vite.config.ts`
- **Verification:** `npx tsc --noEmit` exits 0, `npm run build` succeeds
- **Committed in:** `9ba70e4` (Task 2 commit)

**3. [Rule 3 - Blocking] src/vite-env.d.ts missing — CSS import failed in tsc**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** `tsc -b` reported `Cannot find module './index.css'` from src/main.tsx
- **Fix:** Created `src/vite-env.d.ts` with `/// <reference types="vite/client" />` (standard Vite file)
- **Files modified:** `src/vite-env.d.ts` (created)
- **Verification:** Build succeeds, produces dist/index.html
- **Committed in:** `9ba70e4` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All fixes were mechanical correctness issues. No scope creep.

## Issues Encountered

- Expected IRR range (25-28%) required including capex in the FCF-for-sweep calculation. Without capex deduction, IRR was ~29% (model was sweeping too aggressively). Adding capex deduction brought the output into the VALIDATION.md benchmark range.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Engine layer fully implemented and tested — ready for Phase 1 Plan 02 (Zustand stores)
- `computeLBO()`, `xirr()`, `formatFinancial()`, and all types are importable from `src/engine/`
- `LBOAssumptions` is the primary input contract for stores and UI
- No blockers

---
*Phase: 01-foundation-lbo-engine*
*Completed: 2026-03-10*
