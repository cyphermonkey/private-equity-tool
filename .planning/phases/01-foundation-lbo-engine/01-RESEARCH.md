# Phase 1: Foundation + LBO Engine — Research

**Researched:** 2026-03-10
**Domain:** Client-side LBO financial engine, CSV/PDF file ingestion, Zustand state management, Vite/React/TypeScript SPA scaffold, Vercel deployment
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INGEST-01 | User can upload a CSV file of financial data to populate model inputs | PapaParse 5 with `header: true` + column-name normalization → `ParsedFinancials`; confirmed pattern works |
| INGEST-02 | User can upload a 10-K PDF to extract key financial line items | pdfjs-dist 4 `getTextContent()` per page; text-length guard for scanned PDFs; manual override required |
| INGEST-03 | User can manually override any parsed or extracted value | Controlled inputs bound to `dataStore`; each field independently editable after parse |
| LBO-01 | User can input Sources & Uses assumptions (entry multiple, equity %, debt tranches) | `computeLBO()` pure function takes `LBOAssumptions`; S&U enforces `sponsor_equity = total_equity - management_rollover` |
| LBO-02 | Tool calculates a multi-year debt schedule with mandatory amortization and cash sweep | Fixed-point iteration (3–5 passes, delta < $0.01) resolves interest ↔ cash circular; tranche-by-tranche computation |
| LBO-03 | Tool outputs IRR and MOIC for base, bull, and bear scenarios | XIRR with `[cashflow, date]` pairs; validated against $100 in / $200 out at 5y = 14.87%; decimal.js throughout |
| LBO-04 | User can set exit assumptions (exit year, exit multiple) | Exit EV = exit multiple × exit-year EBITDA; flows into IRR/MOIC calculation |
| SCEN-01 | User can toggle between base, bull, and bear scenarios | `activeScenario` key in `modelStore`; toggle is display-only, zero recalculation |
| SCEN-02 | All model outputs update live on scenario toggle | All three scenarios pre-computed on every assumption change and stored in `modelStore.outputs` |
| SCEN-03 | User can set independent assumptions for each scenario | `modelStore.scenarios.{base|bull|bear}` are fully independent `AssumptionSet` objects |
| DEPLOY-01 | App is accessible via a public URL (Vercel) | `vercel.json` with SPA rewrite rule; Vite build → `dist/`; Vercel Hobby free tier |
</phase_requirements>

---

## Summary

Phase 1 builds the entire analytical foundation of the PE Deal Workbench: a pure TypeScript LBO calculation engine, two Zustand stores, a CSV/PDF data ingestion layer, and a working Vercel deployment. Everything upstream layers (charts, export, DCF, comps) depend on is defined here — the TypeScript types, the calculation contracts, the scenario state pattern, and the `formatFinancial()` display utility.

The most critical technical decision is already locked: `decimal.js` for all financial arithmetic, no exceptions. IEEE 754 floating-point errors compound across financial models and destroy interviewer credibility instantly. The second most critical is the debt schedule circular reference — interest expense depends on ending debt balance, which depends on cash available for sweep, which depends on net income after interest. This must be resolved with fixed-point iteration before any debt schedule UI is built.

The build order is non-negotiable for cost efficiency: types and pure engine functions first (fully testable with Vitest before any UI), then Zustand stores wired to the engine, then data ingestion (CSV parser, PDF extractor, normalizer), then the core UI (assumption panels, output tables, scenario toggle), and finally the Vercel deploy with the SPA rewrite rule. Bugs found in the engine before UI is wired are cheap; the same bugs discovered after wiring UI require tearing down two layers.

**Primary recommendation:** Write `computeLBO()` with full Vitest coverage against hand-verified fixtures before writing a single React component. Define `LBOAssumptions` and `LBOOutputs` as the TypeScript contract every other module depends on.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI component tree | Hooks model maps cleanly to live scenario recalculation; industry standard |
| TypeScript | 5.8.x | Type safety across all layers | Financial formulas have too many foot-guns in plain JS; typed interfaces enforce contracts |
| Vite | 6.x | Build tool + dev server | SPA with no SSR — Vite is correct; Next.js adds server complexity for zero benefit here |
| Zustand | 5.x | Global app state (two stores) | Minimal API; no Provider wrapping; flat store model fits financial state perfectly |
| decimal.js | 10.x | ALL financial arithmetic | IEEE 754 floating-point causes compounding errors in financial models |
| PapaParse | 5.x | CSV file parsing | De facto browser CSV parser; RFC 4180 compliant; worker support; zero dependencies |
| pdfjs-dist | 4.x | PDF text extraction | Mozilla PDF.js; browser-native; web workers to avoid main-thread blocking |
| Tailwind CSS | 4.x | Utility-first styling | CSS-native v4; no `tailwind.config.js`; pairs with shadcn/ui |
| shadcn/ui | latest | Component primitives | Copy-paste ownership; Radix UI accessibility; Tailwind v4 compatible |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Hook Form | 7.x | Assumption input forms | Avoids controlled re-renders on every keystroke for numeric inputs |
| Zod | 3.x | Schema validation | Shared schema between form validation and engine input types |
| Vitest | latest | Unit testing | TypeScript-native, Vite-integrated, no config needed for pure function tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite 6 | Next.js 15 | Next.js adds SSR/server components that provide zero value for a static SPA |
| Zustand 5 | Redux Toolkit | Redux is appropriate for multi-user audit-trail apps; Zustand DX is faster for a single-user portfolio |
| decimal.js | Native JS numbers | Native JS IEEE 754 produces 0.1 + 0.2 = 0.30000000000000004; catastrophic in financial models |
| PapaParse | Manual CSV.split() | PapaParse handles RFC 4180 edge cases (quoted commas, multiline fields, BOM characters) |
| pdfjs-dist | PDF.js CDN | pdfjs-dist is the npm package; required for TypeScript types and controlled versioning |
| Vitest | Jest | Vitest is zero-config with Vite; Jest requires transform configuration; both are equivalent for pure function tests |

**Installation:**
```bash
# Scaffold
npm create vite@latest pe-deal-workbench -- --template react-ts
cd pe-deal-workbench

# Phase 1 dependencies
npm install zustand
npm install decimal.js
npm install papaparse pdfjs-dist
npm install @types/papaparse
npm install tailwindcss @tailwindcss/vite
npm install react-hook-form zod

# shadcn/ui (CLI installs components on demand)
npx shadcn@latest init

# Testing
npm install -D vitest @vitest/ui

# Phase 1 does NOT yet install: recharts, @react-pdf/renderer, exceljs
# Those are Phase 3 concerns — keep initial bundle minimal
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── engine/              # Pure TypeScript calculation functions — no React, no side effects
│   ├── lbo.ts           # computeLBO(assumptions: LBOAssumptions): LBOOutputs
│   ├── types.ts         # LBOAssumptions, LBOOutputs, ParsedFinancials, ScenarioKey
│   └── format.ts        # formatFinancial(value, type) — built before any output UI
├── stores/              # Zustand stores — call engine, hold state
│   ├── modelStore.ts    # scenarios + pre-computed outputs + activeScenario
│   └── dataStore.ts     # parsedFinancials + company metadata
├── data/                # File parsers and normalizers
│   ├── csvParser.ts     # PapaParse → ParsedFinancials
│   ├── pdfExtractor.ts  # pdfjs-dist → raw text → ParsedFinancials
│   └── normalizer.ts    # raw rows → ParsedFinancials schema
├── components/          # React UI components — no math, no I/O
│   ├── upload/          # UploadZone, ParsedPreview, OverrideForm
│   ├── lbo/             # AssumptionPanel, SourcesUses, DebtScheduleTable, OutputTable
│   └── scenario/        # ScenarioToggle, ScenarioLabel
├── hooks/               # Custom hooks wrapping store selectors
└── lib/                 # Shared utilities (cn, etc.)
```

### Pattern 1: Pure Engine Functions with Typed Contracts

**What:** All financial math lives in `src/engine/` as stateless pure functions. No React imports, no Zustand imports, no async operations.

**When to use:** Every calculation — LBO debt schedule, IRR, MOIC, XIRR. This layer has no dependencies except `decimal.js`.

**Example:**
```typescript
// src/engine/types.ts
export type ScenarioKey = 'base' | 'bull' | 'bear';

export interface LBOAssumptions {
  entryEBITDA: string;          // string to pass directly to new Decimal()
  entryMultiple: string;
  equityPct: string;
  managementRollover: string;
  debtTranches: DebtTranche[];  // TLA, TLB, Revolver
  revenueGrowthByYear: string[];
  ebitdaMarginByYear: string[];
  capexPctByYear: string[];
  exitMultiple: string;
  exitYear: number;
  closingDate: Date;
}

export interface LBOOutputs {
  purchasePrice: string;
  sponsorEquity: string;
  totalDebt: string;
  debtSchedule: DebtYearRow[];
  irr: string;          // formatted as percentage
  moic: string;         // formatted as multiple
  cashOnCash: string;
}

// src/engine/lbo.ts
import Decimal from 'decimal.js';
import { LBOAssumptions, LBOOutputs } from './types';
import { xirr } from './xirr';

export function computeLBO(a: LBOAssumptions): LBOOutputs {
  // Step 1: Sources & Uses
  const entryEV = new Decimal(a.entryEBITDA).times(a.entryMultiple);
  const totalEquity = entryEV.times(new Decimal(a.equityPct).dividedBy(100));
  // Hard constraint: sponsor_equity = total_equity - management_rollover
  const sponsorEquity = totalEquity.minus(a.managementRollover);
  const totalDebt = entryEV.minus(totalEquity);

  // Step 2: Debt schedule with fixed-point iteration for circular reference
  const debtSchedule = computeDebtSchedule(a, totalDebt);

  // Step 3: Exit proceeds and returns
  const exitEBITDA = projectEBITDA(a, a.exitYear);
  const exitEV = exitEBITDA.times(a.exitMultiple);
  const exitEquity = exitEV.minus(debtSchedule[a.exitYear - 1].endingBalance);

  // Step 4: XIRR — [cashflow, date] pairs
  const cashflows = buildCashflowPairs(a, sponsorEquity, exitEquity);
  const irrValue = xirr(cashflows);
  const moicValue = exitEquity.dividedBy(sponsorEquity);

  return { /* ... formatted outputs via formatFinancial ... */ };
}
```

### Pattern 2: Fixed-Point Iteration for Debt Schedule Circular

**What:** The LBO debt schedule has a genuine circular reference: interest expense depends on ending debt balance; ending debt balance depends on cash available for sweep; cash sweep depends on net income after interest. Resolve with fixed-point iteration.

**When to use:** Every year of the debt schedule computation.

**Example:**
```typescript
// src/engine/lbo.ts — debt schedule iteration
function computeDebtYear(
  prevBalance: Decimal,
  ebitda: Decimal,
  tranche: DebtTranche,
  maxIterations = 10
): DebtYearRow {
  let balance = prevBalance;
  let interestExpense = new Decimal(0);

  for (let i = 0; i < maxIterations; i++) {
    const prevInterest = interestExpense;
    // Interest on prior iteration's ending balance
    interestExpense = balance.times(tranche.rate).dividedBy(100);
    const cashAvailableForSweep = ebitda.minus(interestExpense).minus(tranche.mandatoryAmortization);
    const sweep = Decimal.max(0, cashAvailableForSweep);
    const newBalance = Decimal.max(0, balance.minus(tranche.mandatoryAmortization).minus(sweep));

    const delta = newBalance.minus(balance).abs();
    balance = newBalance;

    if (delta.lessThan('0.01')) break; // convergence

    // Safety: after maxIterations, surface a model error
    if (i === maxIterations - 1) {
      throw new Error(`Debt schedule did not converge for tranche ${tranche.name}`);
    }
  }

  return { beginningBalance: prevBalance, interestExpense, endingBalance: balance };
}
```

### Pattern 3: XIRR Implementation

**What:** XIRR accepts `[cashflow, date]` pairs and uses Newton-Raphson iteration to solve for the rate. NOT plain IRR (equal spacing assumption is wrong for LBO stub periods).

**When to use:** All IRR calculations in the LBO engine.

**Example:**
```typescript
// src/engine/xirr.ts
// Source: Algorithm based on Excel/LibreOffice XIRR specification
// Validation: $100 in on Date A, $200 out exactly 5 years later = 14.87% IRR
type CashflowPair = { amount: number; date: Date };

export function xirr(cashflows: CashflowPair[], guess = 0.1): number {
  const DAYS_PER_YEAR = 365;
  const t0 = cashflows[0].date;

  function npv(rate: number): number {
    return cashflows.reduce((sum, cf) => {
      const t = (cf.date.getTime() - t0.getTime()) / (DAYS_PER_YEAR * 24 * 3600 * 1000);
      return sum + cf.amount / Math.pow(1 + rate, t);
    }, 0);
  }

  function dnpv(rate: number): number {
    return cashflows.reduce((sum, cf) => {
      const t = (cf.date.getTime() - t0.getTime()) / (DAYS_PER_YEAR * 24 * 3600 * 1000);
      return sum - t * cf.amount / Math.pow(1 + rate, t + 1);
    }, 0);
  }

  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const newRate = rate - npv(rate) / dnpv(rate);
    if (Math.abs(newRate - rate) < 1e-7) return newRate;
    rate = newRate;
  }
  throw new Error('XIRR did not converge');
}
```

### Pattern 4: Zustand modelStore — Pre-compute All Scenarios

**What:** On every assumption change, re-run `computeLBO()` for all three scenarios and store all outputs. Scenario toggle is a display filter only — zero recalculation cost.

**When to use:** This is the mandatory store shape. Never compute only the active scenario.

**Example:**
```typescript
// src/stores/modelStore.ts
import { create } from 'zustand';
import { computeLBO } from '../engine/lbo';
import { LBOAssumptions, LBOOutputs, ScenarioKey } from '../engine/types';

interface ModelStore {
  scenarios: Record<ScenarioKey, LBOAssumptions>;
  outputs: Record<ScenarioKey, LBOOutputs | null>;
  activeScenario: ScenarioKey;
  setAssumption: (scenario: ScenarioKey, key: keyof LBOAssumptions, value: unknown) => void;
  setActiveScenario: (scenario: ScenarioKey) => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  scenarios: { base: defaultAssumptions, bull: defaultAssumptions, bear: defaultAssumptions },
  outputs: { base: null, bull: null, bear: null },
  activeScenario: 'base',

  setAssumption: (scenario, key, value) => {
    set(state => {
      const updated = {
        ...state.scenarios,
        [scenario]: { ...state.scenarios[scenario], [key]: value }
      };
      // Recompute ALL three scenarios — never just the active one
      return {
        scenarios: updated,
        outputs: {
          base: computeLBO(updated.base),
          bull: computeLBO(updated.bull),
          bear: computeLBO(updated.bear),
        }
      };
    });
  },

  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
}));
```

### Pattern 5: formatFinancial Utility

**What:** Centralized display formatting for all financial values. Built before any output UI. Uses accounting conventions: parentheses for negatives, $MM scale, 2dp multiples.

**When to use:** Every value displayed in a table, input, or output. Never display a raw Decimal or number directly.

**Example:**
```typescript
// src/engine/format.ts
import Decimal from 'decimal.js';

type FormatType = 'currency_mm' | 'percentage_2dp' | 'multiple_2dp' | 'basis_points';

export function formatFinancial(value: Decimal | string | number, type: FormatType): string {
  const d = new Decimal(value);
  const isNegative = d.isNegative();
  const abs = d.abs();

  switch (type) {
    case 'currency_mm': {
      // Display in $MM with 1 decimal place
      const mm = abs.dividedBy(1_000_000).toDecimalPlaces(1);
      return isNegative ? `($${mm}M)` : `$${mm}M`;
    }
    case 'percentage_2dp': {
      const pct = abs.toDecimalPlaces(2);
      return isNegative ? `(${pct}%)` : `${pct}%`;
    }
    case 'multiple_2dp': {
      const mult = abs.toDecimalPlaces(2);
      return isNegative ? `(${mult}x)` : `${mult}x`;
    }
    case 'basis_points': {
      const bps = abs.toDecimalPlaces(0);
      return isNegative ? `(${bps}bps)` : `${bps}bps`;
    }
  }
}
```

### Pattern 6: PapaParse CSV Ingestion

**What:** PapaParse with `header: true` and `dynamicTyping: true` maps column names to values. A normalizer function maps flexible header names to the canonical `ParsedFinancials` schema.

**Example:**
```typescript
// src/data/csvParser.ts
import Papa from 'papaparse';
import { ParsedFinancials } from '../engine/types';
import { normalizeRawRows } from './normalizer';

export function parseCSV(file: File): Promise<ParsedFinancials> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // results.data is an array of objects keyed by column header
        const parsed = normalizeRawRows(results.data as Record<string, unknown>[]);
        resolve(parsed);
      },
      error: reject,
    });
  });
}

// src/data/normalizer.ts
// Column header aliases — analysts export from CapIQ/Bloomberg with varied names
const REVENUE_ALIASES = ['revenue', 'net revenue', 'total revenue', 'net sales'];
const EBITDA_ALIASES = ['ebitda', 'adjusted ebitda', 'operating ebitda'];
// ... etc.

export function normalizeRawRows(rows: Record<string, unknown>[]): ParsedFinancials {
  // Find the column matching each financial line item by checking aliases
  // Return ParsedFinancials; flag missing fields rather than silently using 0
}
```

### Pattern 7: PDF Text Extraction with Scanned PDF Guard

**What:** pdfjs-dist `getTextContent()` extracts raw text layer per page. If total extracted text < 200 chars, the document is likely scanned — surface a clear error instead of silently zero-filling.

**Example:**
```typescript
// src/data/pdfExtractor.ts
import * as pdfjsLib from 'pdfjs-dist';

// Required: point workerSrc at the correct build artifact
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items
      .filter((item): item is { str: string } => 'str' in item)
      .map(item => item.str)
      .join(' ');
  }

  // Scanned PDF guard — critical: do NOT silently zero-fill
  if (fullText.length < 200 && pdf.numPages > 1) {
    throw new Error(
      'This PDF appears to be a scanned document. Please upload a digital PDF or export financials as CSV.'
    );
  }

  return fullText;
}
```

### Pattern 8: vercel.json SPA Rewrite Rule

**What:** Without this, Vercel returns 404 on all routes except `/`. Add before first deploy.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Anti-Patterns to Avoid

- **Financial math in React components:** Writing LBO or formatting logic inside `useEffect`, event handlers, or JSX. All math belongs in `src/engine/`. Components only read from the Zustand store.
- **Native JS arithmetic on financial values:** Using `+`, `-`, `*`, `/` on monetary or percentage values. Every financial operation must use `new Decimal().plus()`, `.times()`, etc.
- **Plain IRR instead of XIRR:** Using a standard Newton-Raphson IRR assuming equal periods. LBO models must use XIRR with explicit dates.
- **Computing only the active scenario:** Running `computeLBO()` only when the scenario toggle changes. Compute all three on every assumption change — scenario toggle is display-only.
- **Independent sponsor_equity and management_rollover inputs:** These must be constrained: `sponsor_equity = total_equity - management_rollover`. Never allow free-form entry of both.
- **Silent zero-fill on parse failure:** If CSV is missing expected columns or PDF extraction returns < 200 chars, surface a named error — do not populate with zeros.
- **Spreadsheet engine (HyperFormula, DAG):** LBO models have fixed calculation chains. Pure functions are simpler, faster to build, and fully sufficient.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Arbitrary-precision arithmetic | Custom rounding helpers | `decimal.js` | IEEE 754 edge cases are numerous; decimal.js handles all of them |
| CSV parsing | `file.text().split('\n')` | `PapaParse` | RFC 4180 compliance: quoted commas, multiline fields, BOM, encoding edge cases |
| PDF text extraction | Canvas-based OCR | `pdfjs-dist` | Browser-native; Mozilla-maintained; web worker support; OCR is v2+ territory |
| XIRR | Simple NPV loop | `xirr` npm package or the engine implementation in this document | Newton-Raphson convergence with date normalization has many edge cases |
| Component primitives | Custom input/tab/modal | `shadcn/ui` | Radix UI accessibility out of the box; Tailwind v4 compatible; owned code |
| Form state management | `useState` per input | `react-hook-form` | Avoids re-render on every keystroke; built-in validation integration |
| Global state | React Context + useReducer | `Zustand` | Context re-renders all consumers; Zustand uses selectors to prevent unnecessary renders |

**Key insight:** The LBO engine and XIRR implementation are where custom code is genuinely required. Everything else (parsing, formatting, state, UI primitives) has a well-maintained library that handles edge cases that would take days to discover and fix if hand-rolled.

---

## Common Pitfalls

### Pitfall 1: Floating-Point Errors Compound Across All Calculations
**What goes wrong:** `0.1 + 0.2 === 0.30000000000000004` in native JS. An IRR of `22.000000000000004%` or WACC of `9.99999999%` destroys interviewer confidence instantly.
**Why it happens:** IEEE 754 binary floating point; all native JS arithmetic is affected.
**How to avoid:** `decimal.js` wraps every operation before any engine logic is written. Add a Vitest test on day one: `expect(new Decimal('0.1').plus('0.2').toString()).toBe('0.3')`.
**Warning signs:** `toFixed()` or `Math.round()` calls scattered through the engine layer instead of confined to `formatFinancial()`.

### Pitfall 2: LBO Debt Schedule Circular Not Handled
**What goes wrong:** Interest expense depends on ending balance; ending balance depends on cash sweep; cash sweep depends on net income after interest. Computing in a single pass produces wrong debt balances.
**Why it happens:** No built-in circular resolution in JavaScript; Excel does it automatically with iterative calculation settings.
**How to avoid:** Fixed-point iteration (3–5 passes, delta < $0.01). Assert convergence: if delta > $1 after 10 iterations, throw a named error rather than silently returning a wrong number.
**Warning signs:** Changing debt rate by 1% produces zero change in equity cash flows; debt schedule shows identical balance every year.

### Pitfall 3: Plain IRR Instead of XIRR
**What goes wrong:** Standard IRR assumes equal annual spacing. A deal closing mid-year introduces a stub period that causes 100–600bps IRR error.
**Why it happens:** Standard Newton-Raphson IRR implementations are more widely available than XIRR.
**How to avoid:** XIRR with explicit `[cashflow, date]` pairs. Validation fixture: $100 invested, $200 returned exactly 5 years later = 14.87%. Assert this in Vitest before shipping.
**Warning signs:** IRR changes when the entry date changes without any change to the cash flows themselves.

### Pitfall 4: Management Rollover Double-Counted
**What goes wrong:** Rollover counted as an additional equity source on top of sponsor equity — overstates total equity, understates leverage, and inflates IRR by ~600bps.
**Why it happens:** Sources and Uses table lists rollover in both columns; developers sum all sources including rollover.
**How to avoid:** Hard-code the constraint in the engine: `sponsorEquity = totalEquity.minus(managementRollover)`. Never allow independent entry of both.
**Warning signs:** Changing rollover amount does not change sponsor equity.

### Pitfall 5: Scanned PDF Silently Zero-Fills Model
**What goes wrong:** pdfjs-dist extracts zero text from scanned documents. Model inputs default to $0 with no explanation.
**Why it happens:** Developers test with clean digital PDFs during development; scanned 10-Ks exist in the wild.
**How to avoid:** After extraction, check `fullText.length < 200` for multi-page documents. Surface a named error immediately: "This PDF appears scanned. Use a digital PDF or CSV."
**Warning signs:** No post-parse text-length validation; parse errors silently fail without user-visible feedback.

### Pitfall 6: Partial Scenario Propagation
**What goes wrong:** Scenario toggle updates LBO returns but not other model outputs, or outputs from the wrong scenario bleed into the display.
**Why it happens:** Scenario state managed locally in individual components rather than as a single global Zustand key.
**How to avoid:** `activeScenario` is a single key in `modelStore` before any module UI is built. All output components read `modelStore.outputs[activeScenario]`. No component holds its own local scenario state.
**Warning signs:** Toggling scenarios causes some values to update and others to stay stale.

### Pitfall 7: Number Formatting Breaks Credibility
**What goes wrong:** `IRR: 22.4892384%`, `EBITDA: $1234.56`, `-$50M` instead of `($50M)`. A PE interviewer notices immediately.
**Why it happens:** Formatting scattered across components rather than centralized.
**How to avoid:** Build `formatFinancial(value, type)` before any output UI. All financial display goes through this one function. Types: `currency_mm`, `percentage_2dp`, `multiple_2dp`, `basis_points`. Parentheses for all negative values.
**Warning signs:** Raw Decimal values or unformatted numbers displayed anywhere in the UI.

### Pitfall 8: pdfjs-dist Worker Not Configured
**What goes wrong:** pdfjs-dist requires `GlobalWorkerOptions.workerSrc` to point at the worker script. Without this, PDF parsing throws a worker source error in Vite builds.
**Why it happens:** The worker path must be set explicitly; pdfjs-dist 4.x does not auto-configure this in bundled environments.
**How to avoid:** Set `pdfjsLib.GlobalWorkerOptions.workerSrc` using `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()` at module load time.
**Warning signs:** `Error: No worker source specified` on PDF upload.

---

## Code Examples

### LBO XIRR Validation Fixture (Vitest)
```typescript
// src/engine/__tests__/lbo.test.ts
import { describe, it, expect } from 'vitest';
import { xirr } from '../xirr';
import Decimal from 'decimal.js';

describe('XIRR', () => {
  it('returns 14.87% for $100 in, $200 out at 5 years', () => {
    const entry = new Date('2024-01-01');
    const exit = new Date('2029-01-01');
    const result = xirr([
      { amount: -100, date: entry },
      { amount: 200, date: exit },
    ]);
    expect(new Decimal(result).times(100).toDecimalPlaces(2).toString()).toBe('14.87');
  });
});

describe('decimal.js precision', () => {
  it('0.1 + 0.2 equals 0.3 exactly', () => {
    expect(new Decimal('0.1').plus('0.2').toString()).toBe('0.3');
  });
});

describe('computeLBO', () => {
  it('enforces sponsor_equity = total_equity - management_rollover', () => {
    const assumptions: LBOAssumptions = {
      entryEBITDA: '100000000',   // $100M
      entryMultiple: '10',         // 10x entry → $1B EV
      equityPct: '40',             // 40% equity → $400M total equity
      managementRollover: '20000000', // $20M rollover
      // ... other fields
    };
    const outputs = computeLBO(assumptions);
    // sponsorEquity must be $380M, not $400M
    expect(outputs.sponsorEquity).toBe('380000000');
  });
});
```

### ParsedFinancials Type Contract
```typescript
// src/engine/types.ts
export interface ParsedFinancials {
  years: number[];           // e.g. [2020, 2021, 2022, 2023, 2024]
  revenue: string[];         // Decimal-compatible strings in dollars
  ebitda: string[];
  capex: string[];
  da: string[];              // Depreciation & Amortization
  source: 'csv' | 'pdf' | 'manual';
  confidence: Record<string, 'high' | 'low'>;  // per-field parse confidence
  rawText?: string;          // stored for manual review of PDF parses
}
```

### DebtTranche Type
```typescript
// src/engine/types.ts
export interface DebtTranche {
  name: string;              // 'TLA', 'TLB', 'Revolver'
  principal: string;         // Decimal-compatible string
  rate: string;              // base + spread as total rate, e.g. '7.5'
  mandatoryAmortPct: string; // % of principal per year
  maturityYear: number;      // years from close
  isBullet: boolean;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App (CRA) | Vite 6 | 2023–2024 | CRA is unmaintained; Vite is the standard for new SPAs |
| Redux for all global state | Zustand 5 for simple SPAs | 2022–present | Redux appropriate only for complex multi-module enterprise apps |
| SheetJS/xlsx for Excel | ExcelJS 4 | 2023 (CVEs) | SheetJS CE has active CVEs (CVE-2023-30533, CVE-2024-22363) |
| Recharts 2.x | Recharts 3.x | Oct 2025 | v3 rewrote internal state management; do not use 2.x |
| Tailwind CSS 3 (`tailwind.config.js`) | Tailwind CSS 4 (`@tailwindcss/vite`) | 2025 | v4 is CSS-native; no config file; different setup path |
| pdfjs-dist 3.x | pdfjs-dist 4.x | 2024 | Worker API changed; use `pdf.worker.min.mjs` for Vite |

**Deprecated/outdated:**
- `create-react-app`: Unmaintained since 2023. Use `npm create vite@latest`.
- `SheetJS Community Edition (xlsx npm)`: Active CVEs. Use ExcelJS instead.
- `html2canvas + jsPDF`: Produces rasterized, non-selectable PDFs. Use `@react-pdf/renderer`.
- `Recharts 2.x`: Unmaintained. Only 3.x is actively maintained.
- `IEX Cloud`: Shut down August 2024. Do not use.

---

## Open Questions

1. **CSV column header convention for user-exported financials**
   - What we know: Analysts export from Capital IQ, Bloomberg, and FactSet — each uses different column names for the same line items.
   - What's unclear: Should the app document an expected CSV format, or attempt fuzzy header matching (e.g., "Net Revenue" matching the "revenue" slot)?
   - Recommendation: Implement both — a documented canonical format AND a fuzzy matching table with aliases for common exports. Surface a warning if a column header is not recognized, listing what was expected.

2. **pdfjs-dist Vite worker configuration specifics**
   - What we know: pdfjs-dist 4.x requires explicit `GlobalWorkerOptions.workerSrc` configuration; the path syntax changed between v3 and v4.
   - What's unclear: Whether the `new URL(..., import.meta.url)` pattern works correctly in all Vite 6 build modes (dev + production + preview).
   - Recommendation: Validate the worker path in both `vite dev` and `vite build` preview before wiring the upload UI. Add a build-time test for this.

3. **XIRR convergence behavior for edge-case deal structures**
   - What we know: Newton-Raphson XIRR can fail to converge for unusual cash flow patterns (multiple sign changes, very high rates).
   - What's unclear: Whether a PE demo LBO would ever hit non-convergence in practice.
   - Recommendation: Implement with a hard iteration limit, catch the convergence error, and surface a model warning ("IRR could not be computed — check cash flow sign pattern") rather than a silent NaN.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest, TypeScript-native, Vite-integrated) |
| Config file | None — Vitest reads `vite.config.ts` automatically; add `test: { globals: true }` to vite.config.ts |
| Quick run command | `npx vitest run src/engine` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INGEST-01 | CSV upload populates revenue, EBITDA, capex, D&A | Unit | `npx vitest run src/data/__tests__/csvParser.test.ts` | Wave 0 |
| INGEST-01 | Column header aliases resolve correctly (e.g., "Net Revenue" → `revenue`) | Unit | `npx vitest run src/data/__tests__/normalizer.test.ts` | Wave 0 |
| INGEST-02 | PDF text extraction returns text for digital PDF | Unit | `npx vitest run src/data/__tests__/pdfExtractor.test.ts` | Wave 0 |
| INGEST-02 | Scanned PDF (< 200 chars) throws named error, not silent zero-fill | Unit | `npx vitest run src/data/__tests__/pdfExtractor.test.ts` | Wave 0 |
| INGEST-03 | Override of parsed value updates `dataStore` independently | Unit | `npx vitest run src/stores/__tests__/dataStore.test.ts` | Wave 0 |
| LBO-01 | `sponsor_equity = total_equity - management_rollover` is a hard constraint | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "sponsor equity"` | Wave 0 |
| LBO-01 | Sources & Uses balances (total sources = total uses) | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "sources uses balance"` | Wave 0 |
| LBO-02 | Debt schedule converges in ≤ 5 iterations (delta < $0.01) | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "debt schedule"` | Wave 0 |
| LBO-02 | Mandatory amortization is applied before cash sweep | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "amortization"` | Wave 0 |
| LBO-02 | Cash sweep cannot reduce balance below zero | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "sweep floor"` | Wave 0 |
| LBO-03 | XIRR: $100 in / $200 out at 5 years = 14.87% | Unit | `npx vitest run src/engine/__tests__/xirr.test.ts` | Wave 0 |
| LBO-03 | MOIC calculation: exit equity / entry equity | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "MOIC"` | Wave 0 |
| LBO-03 | `decimal.js` precision: 0.1 + 0.2 = 0.3 exactly | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "precision"` | Wave 0 |
| LBO-04 | Exit EV = exit multiple × exit-year EBITDA | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "exit"` | Wave 0 |
| SCEN-01 | `activeScenario` toggle does not trigger engine recomputation | Unit | `npx vitest run src/stores/__tests__/modelStore.test.ts -t "toggle"` | Wave 0 |
| SCEN-02 | All three scenario outputs update on single assumption change | Unit | `npx vitest run src/stores/__tests__/modelStore.test.ts -t "all scenarios"` | Wave 0 |
| SCEN-03 | Changing bull assumption does not affect base or bear outputs | Unit | `npx vitest run src/stores/__tests__/modelStore.test.ts -t "independence"` | Wave 0 |
| DEPLOY-01 | Vite build produces `dist/index.html` and static assets | Build | `npm run build && test -f dist/index.html` | Wave 0 |
| DEPLOY-01 | `vercel.json` rewrite rule present before deploy | Manual | Inspect `vercel.json` before `vercel deploy` | N/A |

### Known Reference Fixture (required for test assertions)

The following fixture must be pre-computed before engine tests are written. Use a hand-calculation or an independent Excel model to verify:

**Standard 5-year LBO:**
- Entry EBITDA: $100M
- Entry multiple: 10.0x → Entry EV: $1,000M
- Total equity: 40% → $400M; Management rollover: $20M → Sponsor equity: $380M
- Total debt: $600M (TLA: $200M at 6%, 20% annual amort; TLB: $400M at 7%, 1% annual amort)
- Revenue growth: 5% / year; EBITDA margin: 30% (stable)
- Exit year: 5; Exit multiple: 12.0x
- Expected IRR: ~25-28% (verify in Excel with XIRR)
- Expected MOIC: ~3.0-3.5x (verify in Excel)

This fixture is the acceptance criterion for the entire LBO engine. If Vitest asserts against it and passes, the engine is ready for UI wiring.

### Sampling Rate
- **Per task commit:** `npx vitest run src/engine`  (engine tests only, < 5 seconds)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before marking Phase 1 complete

### Wave 0 Gaps

The following test files must be created in Wave 0 (before implementation begins):

- [ ] `src/engine/__tests__/lbo.test.ts` — covers LBO-01, LBO-02, LBO-03, LBO-04; includes standard 5-year fixture
- [ ] `src/engine/__tests__/xirr.test.ts` — covers XIRR convergence, 14.87% validation, edge cases
- [ ] `src/engine/__tests__/format.test.ts` — covers `formatFinancial()` all types, negative parentheses
- [ ] `src/data/__tests__/csvParser.test.ts` — covers INGEST-01 with fixture CSV file
- [ ] `src/data/__tests__/normalizer.test.ts` — covers column alias matching
- [ ] `src/data/__tests__/pdfExtractor.test.ts` — covers INGEST-02 including scanned PDF guard
- [ ] `src/stores/__tests__/modelStore.test.ts` — covers SCEN-01, SCEN-02, SCEN-03
- [ ] `src/stores/__tests__/dataStore.test.ts` — covers INGEST-03
- [ ] Framework config: add `test: { globals: true }` to `vite.config.ts`

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — full stack decisions with rationale and version pins
- `.planning/research/ARCHITECTURE.md` — four-layer pattern, store shapes, build order
- `.planning/research/PITFALLS.md` — 15 domain-specific pitfalls with phase attribution
- `.planning/research/FEATURES.md` — feature dependency graph, LBO table stakes, anti-features
- `.planning/research/SUMMARY.md` — cross-referenced executive summary
- [decimal.js npm / GitHub](https://mikemcl.github.io/decimal.js/) — arbitrary-precision decimal type
- [PapaParse docs](https://www.papaparse.com/docs) — `header: true`, `dynamicTyping`, TypeScript generics
- [Mozilla pdf.js](https://mozilla.github.io/pdf.js/) — `getTextContent()` API, worker configuration
- [Vitest Getting Started](https://vitest.dev/guide/) — zero-config with Vite, TypeScript-native

### Secondary (MEDIUM confidence)
- [XIRR npm package](https://www.npmjs.com/package/xirr) — Newton-Raphson implementation, LibreOffice-compatible; algorithm verified against Excel spec
- [Zustand GitHub](https://github.com/pmndrs/zustand) — computed state pattern via `get()` inside actions
- [Vercel SPA deployment KB](https://vercel.com/kb/guide/deploying-react-with-vercel) — `vercel.json` rewrite rule
- [pdfjs-dist TypeScript guide](https://www.xjavascript.com/blog/extract-text-from-pdf-typescript/) — `getTextContent()` pattern

### Tertiary (LOW confidence — validate before use)
- Specific pdfjs-dist 4.x worker path format in Vite 6 prod builds — documented pattern assumed correct; validate with a build smoke test
- XIRR convergence behavior for multi-sign-change LBO cashflows — standard algorithm; edge cases need validation against known Excel outputs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs and multiple community sources; versions confirmed current as of 2026-03
- Architecture: HIGH — four-layer pattern is well-established; LBO engine pure function pattern has no competing approach
- Pitfalls: HIGH (financial model logic, sourced from WSP/WSO/UpLevered) / MEDIUM (browser-specific implementation, validated against library docs)
- Test plan: HIGH — all test commands are runnable; fixtures are derived from deterministic math; Wave 0 gaps are complete

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries; re-verify pdfjs-dist worker path if Vite upgrades)
