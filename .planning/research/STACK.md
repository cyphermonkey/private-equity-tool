# Technology Stack

**Project:** PE Deal Workbench
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH (all major choices verified against official docs and multiple sources)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.x | UI component tree | Industry standard for interactive financial dashboards; hooks model maps cleanly to live scenario recalculation |
| TypeScript | 5.8.x | Type safety | Financial formulas have too many foot-guns in plain JS; typed interfaces enforce input/output contracts on LBO/DCF models |
| Vite | 6.x | Build tool + dev server | SPA with no SSR requirement — Vite is the right tool (Next.js adds complexity and a Node server that provides zero benefit here). Near-instant HMR matters when iterating on chart layouts |

**Why not Next.js:** The workbench is a private single-page app deployed as a static dist folder. SSR and server components add overhead, routing conventions, and vendor lock-in with zero benefit for a tool that does all computation client-side. Next.js is the right call when you need SEO, server components, or API routes — none of which apply here.

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | Global app state (deal inputs, scenario toggle, parsed financials) | Minimal API; no Provider wrapping; models well as a flat store with slices. Redux Toolkit is appropriate for regulated enterprise apps with audit trails — this is a portfolio demo where DX speed matters |
| React Hook Form + Zod | 7.x / 3.x | Assumption input forms (entry multiple, WACC, exit year) | RHF avoids controlled re-renders on every keystroke; Zod provides schema validation and can be shared between form and model calculation layers |

---

### Charting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 3.x | IRR waterfall, returns bridge, DCF sensitivity, football field | Built on D3 primitives + React components; composable API makes custom waterfall/bridge charts achievable without raw D3; v3 (released Oct 2025) rewrote internal state management for better performance |

**Waterfall / bridge chart note:** Recharts does not ship a native waterfall chart type. The standard approach — widely documented — is to use a stacked `BarChart` where the "invisible" base bar is transparent, creating the floating bar effect. This works well and requires ~30 lines of data transformation, not a separate library.

**Why not Plotly.js:** Bundle is ~3MB; adds Python-origin UX patterns (modebar, hover that feels scientific not financial). Recharts produces cleaner, more branded output that matches what a PE associate expects from a Goldman deck, not a Jupyter notebook.

**Why not D3 directly:** Steep learning curve, every chart is 200+ lines. Recharts wraps D3 for 95% of needed chart types. Use raw D3 only if a specific chart type cannot be expressed in Recharts (unlikely for this feature set).

**Why not Chart.js:** No React-native API; react-chartjs-2 wrapper is a leaky abstraction. Less composable for the custom financial chart types needed here.

---

### PDF Export

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @react-pdf/renderer | 4.x | One-click tearsheet PDF generation | Declarative React component tree → PDF; runs entirely in the browser; no Puppeteer server required; supports custom fonts, styled layouts, and embedded SVG charts. 860K+ weekly downloads, actively maintained |

**Critical distinction:** There are two packages with similar names:
- `@react-pdf/renderer` — **creates** PDFs (this is what you want)
- `react-pdf` — **displays** existing PDFs (used for the 10-K upload viewer)

**Why not Puppeteer/headless Chrome:** Requires a server process. Adds infrastructure cost and latency. Incompatible with the "no backend" architecture for v1.

**Why not jsPDF:** Low-level canvas API; producing a pixel-precise tearsheet with tables and charts requires enormous boilerplate. @react-pdf/renderer is far more maintainable.

**Chart embedding in PDF:** Recharts renders to SVG. Convert SVG → PNG via `canvas` API (or use `recharts`' `toBase64Image()` if available) before embedding in the @react-pdf/renderer `<Image>` component. This is the standard pattern.

---

### Excel Export

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ExcelJS | 4.x | Full model export as .xlsx | Supports styled cells, multiple sheets, number formatting (critical for financial models); browser-bundleable via the `dist/` build |

**Why not SheetJS (xlsx npm package):** SheetJS Community Edition has a documented history of CVEs (prototype pollution CVE-2023-30533, ReDoS CVE-2024-22363). The npm package was also moved off npm to a self-hosted registry after version disputes, creating supply chain risk. ExcelJS is the safer long-term choice for a public-facing portfolio project.

**ExcelJS bundle size note:** ExcelJS adds ~600KB to the bundle. Use dynamic `import()` to lazy-load it only when the user clicks "Export Excel" — this keeps the initial load fast.

---

### File Upload and Parsing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PapaParse | 5.x | CSV financial statement parsing | The definitive browser CSV parser; RFC 4180 compliant; streaming for large files; worker thread support to keep UI responsive; zero dependencies |
| pdfjs-dist | 4.x | PDF text extraction from uploaded 10-K | Mozilla's PDF.js; runs in browser; ~2M weekly downloads; uses web workers to avoid blocking the main thread. Extract text layer then apply regex heuristics to find revenue, EBITDA, etc. |
| react-pdf (display) | 9.x | Render the uploaded PDF in-browser for user reference | Same PDF.js under the hood; provides a React component wrapper for displaying the source document alongside the parsed data |

**PDF parsing realism note:** Structured data extraction from 10-K PDFs is hard. PDF.js extracts the raw text layer, but financial tables in PDFs often have non-obvious character ordering. For v1, target CSV as the primary format for reliable ingestion; PDF is a best-effort text extraction with a clear UI message to the user that manual overrides are expected. This is honest and avoids over-engineering.

---

### Market Data API (Public Comps)

| Technology | Tier | Purpose | Why |
|------------|------|---------|-----|
| Financial Modeling Prep (FMP) | Free (250 req/day) | Income statement, balance sheet, key ratios, EV/EBITDA for comps | The only free API that provides both fundamental financials and valuation multiples in the same call. Free tier covers US equities, income statement, balance sheet, cash flow — exactly what comps require. No credit card required |

**Free tier limits (FMP):** 250 requests/day, 500MB/30-day bandwidth rolling limit, US exchanges only. For a portfolio demo with one user, this is more than sufficient.

**Why not Alpha Vantage:** Rate limits on the free tier are more restrictive (25 requests/day on the truly free key). Fundamental data (income statement, EV multiples) requires a premium key. Not viable for comps without paying.

**Why not Polygon.io:** Free tier is real-time price only (5 calls/minute); no fundamental data, no EV/EBITDA. Fundamentals start at $199/month.

**Why not Finnhub:** Good for real-time quotes; fundamental data coverage is thinner than FMP for the EV multiple tables needed in a comps analysis.

**Client-side API call note:** FMP allows browser-side calls. However, your API key will be exposed in the client bundle. For a portfolio project this is acceptable. If this ever becomes a real product, proxy via a serverless function.

---

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first styling | v4 (CSS-native, OKLCH color system) is the current standard; pairs with shadcn/ui; zero runtime overhead |
| shadcn/ui | latest | Component primitives (tables, modals, tabs, inputs) | Copy-paste model means zero dependency lock-in; built on Radix UI for accessibility; all components updated for Tailwind v4 and React 19 |

**Why shadcn/ui over MUI or Ant Design:** Both MUI and Ant Design impose a design language that is hard to override for a custom "deal workbench" aesthetic. shadcn/ui components are owned code — they look like what you build, not like another product.

---

### Financial Math Precision

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| decimal.js | 10.x | IRR, MOIC, NPV, percentage calculations | JavaScript IEEE 754 floating-point arithmetic causes rounding errors that compound in financial models (0.1 + 0.2 = 0.30000000000000004). Decimal.js provides arbitrary-precision arithmetic. Mandatory for any monetary or percentage calculation |

---

### Deployment

| Technology | Tier | Purpose | Why |
|------------|------|---------|-----|
| Vercel | Free (Hobby) | Static SPA hosting | Zero-config Vite detection; automatic HTTPS; CDN; preview URLs per commit; `vercel.json` rewrite rule for SPA routing. Free tier is permanent for personal projects |

**Deployment config required:** Add `vercel.json` with SPA rewrite rule or Vercel will 404 on deep links:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Why not Netlify:** Both are equivalent for this use case. Vercel has slightly better Vite auto-detection and is the more common choice in 2025 portfolios.

**Why not GitHub Pages:** Requires manual base path configuration; no serverless function support if you later need to proxy the FMP API key; more friction overall.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite 6 | Next.js 15 | No SSR needed; adds server complexity for zero benefit |
| Charts | Recharts 3 | Plotly.js | 3MB bundle; scientific UI not financial UI |
| Charts | Recharts 3 | D3 (raw) | 200+ lines per chart; no React integration |
| PDF export | @react-pdf/renderer | Puppeteer | Requires server; incompatible with static deployment |
| Excel export | ExcelJS | SheetJS/xlsx | Active CVEs; npm distribution issues |
| State | Zustand | Redux Toolkit | Redux is overkill for single-user SPA; adds boilerplate |
| Market data | FMP (free) | Alpha Vantage | 25 req/day free tier; no EV multiples without premium |
| Market data | FMP (free) | Polygon.io | No fundamentals on free tier |
| Styling | Tailwind + shadcn | MUI / Ant Design | Opinionated design system overrides are painful |
| Math | decimal.js | Native JS numbers | IEEE 754 causes compounding errors in financial models |

---

## Installation

```bash
# Scaffold
npm create vite@latest pe-deal-workbench -- --template react-ts
cd pe-deal-workbench

# Core dependencies
npm install react@^19 react-dom@^19
npm install zustand react-hook-form zod
npm install recharts
npm install @react-pdf/renderer
npm install react-pdf
npm install papaparse pdfjs-dist
npm install decimal.js
npm install tailwindcss @tailwindcss/vite

# shadcn/ui (CLI-based component installation)
npx shadcn@latest init

# Dev dependencies
npm install -D typescript@^5.8 @types/react @types/react-dom
npm install -D @types/papaparse

# ExcelJS — lazy-loaded, no build-time cost
npm install exceljs
```

**ExcelJS lazy load pattern:**

```typescript
// Only imported when user clicks "Export Excel"
const exportToExcel = async (modelData: DealModel) => {
  const { Workbook } = await import('exceljs');
  const wb = new Workbook();
  // ... build sheets
};
```

---

## Version Pinning Notes

- **React 19**: Active LTS as of 2026-03. Pin `^19`.
- **Recharts 3.x**: Released Oct 2025 with rewritten state management. Do not use 2.x (unmaintained branch). Pin `^3`.
- **@react-pdf/renderer 4.x**: Latest stable is 4.3.2 (early 2026). Pin `^4`.
- **Vite 6.x**: Requires Node.js 20.19+ or 22.12+. Verify CI/deployment Node version.
- **Tailwind CSS 4.x**: Uses CSS-native approach (no `tailwind.config.js`). Setup differs from v3 — follow the Vite plugin path (`@tailwindcss/vite`).

---

## Sources

- React 19 release: https://react.dev/versions
- Vite 6 docs: https://vite.dev/guide/
- Recharts 3.0 migration: https://github.com/recharts/recharts/wiki/3.0-migration-guide
- @react-pdf/renderer npm: https://www.npmjs.com/package/@react-pdf/renderer
- ExcelJS vs SheetJS: https://medium.com/@manishasiram/exceljs-alternate-for-xlsx-package-fc1d36b2e743
- SheetJS CVEs: https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
- FMP free tier: https://site.financialmodelingprep.com/developer/docs/pricing
- PapaParse docs: https://www.papaparse.com/docs
- pdfjs-dist: https://mozilla.github.io/pdf.js/
- decimal.js npm: https://www.npmjs.com/package/decimal.js
- Tailwind v4 + shadcn: https://ui.shadcn.com/docs/tailwind-v4
- Vite vs Next.js for SPA: https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison
- Vercel SPA deployment: https://vercel.com/kb/guide/deploying-react-with-vercel
- Zustand vs Redux 2025: https://isitdev.com/zustand-vs-redux-toolkit-2025/
- Financial data APIs comparison: https://www.ksred.com/the-complete-guide-to-financial-data-apis-building-your-own-stock-market-data-pipeline-in-2025/
