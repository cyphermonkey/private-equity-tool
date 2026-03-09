# PE Deal Workbench

A browser-based private equity deal analysis platform. Upload company financials, configure LBO assumptions, and get live IRR/MOIC output across base, bull, and bear scenarios — no install required.

Built as a portfolio project to demonstrate PE technical skills.

**Live:** https://private-equity-tool.vercel.app

---

## What it does

- **LBO Model** — Sources & Uses, multi-year debt schedule with amortization and cash sweep, IRR and MOIC output
- **Scenario Analysis** — Independent base / bull / bear assumptions; all outputs update instantly on toggle
- **File Upload** — Upload a CSV of financials or a 10-K PDF to auto-populate model inputs
- **Manual Overrides** — Every parsed value is editable before running the model

DCF valuation, comparable company analysis, and publication-quality chart exports are in progress.

---

## Stack

| Layer | Tech |
|-------|------|
| UI | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| State | Zustand 5 |
| Financial math | decimal.js (IEEE 754 safe) |
| CSV parsing | PapaParse |
| PDF extraction | pdfjs-dist |
| Styling | Tailwind CSS 4 |
| Testing | Vitest |
| Deploy | Vercel |

---

## Getting started

```bash
npm install
npm run dev
```



```bash
npm test        # run all tests
npm run build   # production build
```

---

## Uploading financials

**CSV** — one row per year with columns for Revenue, EBITDA, Capex, and D&A. Common CapIQ and Bloomberg header formats are recognized automatically. A sample file is at `src/data/fixtures/sample.csv`.

**10-K PDF** — digital PDFs only (not scanned). The app extracts what it can and shows a confidence indicator on each field — review and correct before running the model.

---

## Project structure

```
src/
  engine/       # Pure TS calculation functions (computeLBO, xirr, formatFinancial)
  stores/       # Zustand state (modelStore, dataStore)
  data/         # CSV parser, PDF extractor, column normalizer
  components/   # React UI components
  hooks/        # useActiveOutputs
```

---

## License

MIT
