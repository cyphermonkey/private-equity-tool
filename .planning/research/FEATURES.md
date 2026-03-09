# Feature Landscape

**Domain:** PE Deal Analysis / LBO Workbench
**Researched:** 2026-03-10
**Overall confidence:** HIGH (corroborated across Wall Street Prep, WSO, CFI, Macabacus, and PE practitioner sources)

---

## Context

The target user is an entry-level quant or PE analyst preparing for recruiting interviews. The primary showcase moment is opening a live URL on a laptop during an interview. "Credible" means it would pass scrutiny from someone who has worked in a Bloomberg terminal or built LBO models at a PE shop.

The three canonical PE interview models are:
1. **LBO model** — the most tested; defines PE work
2. **DCF valuation** — tested at IB and PE; context for LBO entry/exit
3. **Comparable company analysis (comps)** — used to calibrate entry/exit multiples

These three are treated by analysts as a unified valuation toolkit, not standalone tools.

---

## Table Stakes

Features analysts expect. Missing any of these and the tool fails the credibility test instantly.

### LBO Module

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sources and Uses table | Every LBO starts here — equity check, debt tranches, fees | Low | Must show sponsor equity %, transaction fees, total purchase price |
| Entry multiple (EV/EBITDA) with LTM and NTM toggle | Standard entry assumption; LTM vs NTM is the first question interviewers ask | Low | Entry EV = multiple × EBITDA |
| Debt schedule with at least 3 tranches | TLA (amortizing), TLB (bullet), Revolver; each with rate (base + spread), amortization schedule, mandatory repayment | High | Circular reference risk (revolver ↔ cash); needs careful implementation |
| Free cash flow to equity sweep | Excess cash pays down debt; shows credit quality improving over hold | Medium | Requires linking IS → BS → CFS |
| Exit assumption (multiple, year) | Exit EV = exit multiple × exit EBITDA; drives returns | Low | Should toggle exit year (3/4/5/7) |
| IRR and MOIC output | The two return metrics every PE interview asks about | Low | IRR = annualized; MOIC = absolute multiple |
| Returns summary table | Shows IRR/MOIC under exit year × exit multiple matrix | Medium | 2D sensitivity grid (e.g., 3–7 year hold × 7–12x exit) |

### DCF Module

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 5-year (or configurable) FCF projection | Revenue → EBITDA → EBIT → NOPAT → FCF; fully linked | High | Needs assumption inputs: revenue growth, margins, capex%, NWC% |
| WACC calculation | Cost of equity (CAPM) + after-tax cost of debt, capital-structure weighted | Medium | Risk-free rate, equity risk premium, beta, tax rate inputs |
| Terminal value (two methods) | Exit multiple method (EV/EBITDA at year N) and perpetuity growth method (Gordon Growth) | Medium | Both methods should be available; analysts cross-check |
| Present value and implied share price | Discount FCFs + TV back at WACC; divide by diluted shares for implied per-share | Low | Enterprise value → equity bridge (net debt) |
| Sensitivity table: WACC × terminal growth / exit multiple | The single most expected output; shown in every PE pitch book | Medium | 5×5 or 7×7 grid; color-coded (green = above current price, red = below) |
| Football field chart | Side-by-side valuation range bars for DCF, comps, LBO, 52-week high/low | Medium | Publication-quality horizontal bar chart; anchor for interview discussion |

### Comparable Company Analysis Module

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Peer set display with key metrics | Name, market cap, EV, revenue, EBITDA, net income for each comp | Low | Minimum 5–8 peers |
| EV/EBITDA and EV/Revenue multiples (LTM and NTM) | The two standard trading multiples for most sectors | Low | LTM from reported; NTM from estimates or user-entered |
| P/E and EV/EBIT | Secondary multiples; expected in tech/growth and cyclical sectors | Low | Can be optional but must be present |
| Summary statistics: median, mean, 25th/75th percentile | Median is the operative number; interviewers ask "what multiple did you use?" | Low | Outlier sensitivity; median resists skew |
| Implied valuation range from comps | Apply peer median multiple to target's metric → implied EV range | Low | Feeds directly into football field |
| Manual override for any comp metric | Real comps data is messy; analyst must be able to correct bad pulls | Low | Inline editing |

### Scenario Analysis

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Base / Bull / Bear case toggle | Every PE model has three cases; interviewers always ask "what's the downside?" | Medium | Toggle must update all outputs live (LBO returns, DCF value, charts) |
| Per-case revenue growth and margin assumptions | Cases differ on top-line growth and EBITDA margin expansion | Low | Simple input grid; 3 columns (bear/base/bull) per row |
| IRR/MOIC output per scenario | Show returns across all three cases on one screen | Low | Feeds the interview narrative |

### Output and Reporting

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| IRR/MOIC sensitivity heatmap | Entry multiple × exit multiple or entry × exit year; color-coded | Medium | 2D grid with conditional formatting |
| Valuation football field chart | Required in every IB and PE deck; shows range across methodologies | Medium | Publication quality — axes labeled, ranges visually distinct |
| Returns bridge / waterfall chart | Shows value creation decomposition: EBITDA growth, multiple expansion, debt paydown | Medium | Bar chart with stacked or bridge layout |
| One-click PDF tearsheet | Single-page deal summary: company name, deal stats, LBO returns, DCF range, comps table, football field | High | Must be clean and printable; this is the "wow" deliverable |
| Excel model export | Standard in the industry; interviewers may want to review your model | High | Full workbook with IS, BS, CFS, debt schedule, LBO, DCF, comps |

---

## Differentiators

Features that make the tool stand out from a plain spreadsheet or blank template. Not expected by default but recognized immediately by a senior analyst.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Upload financials (10-K PDF or CSV) to auto-populate inputs | Saves 20–30 min of manual data entry; demonstrates sophistication | High | CSV parsing is straightforward; PDF parsing is hard — require structured PDF or fallback to CSV |
| Auto-pulled public comps with manual override | Real-time market data for peer multiples; avoids stale inputs | High | Requires a market data API (Alpha Vantage, Financial Modeling Prep); override for bad data is essential |
| Live scenario toggle that updates all charts instantly | Shows the tool is wired end-to-end; creates a "show, don't tell" interview moment | Medium | React state management; all derived values recalculate on scenario change |
| Modular layout (enable/disable LBO, DCF, comps per deal) | Some interviews focus on one model; modularity shows system thinking | Low | Feature flags or section toggles in UI |
| IRR waterfall with value creation attribution | Shows how much of return comes from EBITDA growth vs. multiple expansion vs. leverage paydown — the exact conversation at a PE firm | High | Bridge chart with signed bars; requires attribution math |
| Color-coded sensitivity tables | Green/red gradient on IRR/DCF grids makes the output scannable in 3 seconds | Low | CSS conditional formatting; high visual impact for low effort |
| Deal name / company branding on tearsheet | Personalizes the PDF; makes it feel like a real deal output, not a template exercise | Low | Company name, logo placeholder, date, analyst name field |
| Configurable hold period and deal assumptions on one screen | Mirrors how a PE associate actually builds a deal model — entry, financing, operations, exit on one view | Medium | Layout decision; reduces context-switching during demo |

---

## Anti-Features

Things to deliberately NOT build in v1. Each has a specific reason.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| AI parsing of CIMs or earnings call transcripts | Non-trivial to build correctly; high error rate makes it a liability in a credibility-first demo context | Accept structured CSV or well-formatted 10-K; document the expected format clearly |
| Full three-statement model (IS + BS + CFS) with circular references | Circular references (revolver ↔ cash) require iterative solvers — fragile in a browser; full 3-statement adds months of dev | Model the key drivers (EBITDA, capex, NWC, D&A) as inputs; derive FCF without a full BS |
| Multi-user collaboration and commenting | Single-user interview tool; collaboration adds auth complexity, cost, backend state | Deploy as a single authenticated session or even fully client-side |
| Sector-specific templates (SaaS ARR, healthcare EBITDAR) | Good general-purpose model covers most deals; sector templates multiply QA surface area | Use one configurable model with labeled metric fields |
| IRR distribution waterfall / LP/GP carried interest split | Real waterfall math (preferred return, catch-up, carry) is a fund-level calculation, not a deal-level one | Show deal-level IRR/MOIC only; note that fund waterfall is a separate concept |
| Live market data streaming / real-time price feeds | Requires paid API with rate limits; adds latency and failure modes during an interview demo | Pull comps data on-demand at session start; cache for the session |
| PDF annotation or collaborative markup | No use case for a solo interview prep tool | Static PDF export is sufficient |
| Mobile layout optimization | Interviews happen on a laptop; mobile optimization wastes build time | Responsive enough to not break on resize, but desktop-first |
| Deal sourcing or CRM | PitchBook / Affinity problem; entirely different product | Out of scope; focus on the analytical workbench |
| Monte Carlo simulation | Stochastic modeling is overkill vs. the 3-scenario toggle that PE interviews actually use | Stick to base/bull/bear discrete scenarios |

---

## Feature Dependencies

The following dependency graph governs build order — upstream features must exist before downstream ones.

```
Financial Inputs (revenue, EBITDA, capex, NWC, D&A)
  └── LBO Module
        ├── Sources & Uses
        ├── Debt Schedule (TLA, TLB, Revolver)
        ├── FCF → Debt Sweep
        ├── Exit Assumptions
        └── IRR / MOIC Output
              └── IRR Sensitivity Heatmap (entry × exit multiple)
              └── IRR Waterfall Chart (value creation attribution)

Financial Inputs
  └── DCF Module
        ├── FCF Projection (5-year)
        ├── WACC Inputs
        ├── Terminal Value (exit multiple + perpetuity)
        └── Implied Valuation
              └── WACC × TV Sensitivity Table
              └── Implied Share Price

Peer Set (manual entry or API pull)
  └── Comps Module
        ├── EV/EBITDA, EV/Revenue, P/E (LTM and NTM)
        ├── Summary Statistics (median, mean, quartiles)
        └── Implied Valuation Range

[LBO Implied Value] + [DCF Implied Value] + [Comps Range]
  └── Football Field Chart

Scenario Toggle (base/bull/bear)
  └── Updates: LBO returns, DCF value, all charts

[Football Field] + [LBO Summary] + [Comps Table] + [Scenario Returns]
  └── PDF Tearsheet

[Full Model State]
  └── Excel Export
```

---

## MVP Recommendation

Build in this priority order:

**Must ship (core credibility):**
1. Financial inputs screen — revenue, EBITDA, capex, NWC, D&A, tax rate
2. LBO module — sources/uses, debt schedule (3 tranches), FCF sweep, IRR/MOIC
3. DCF module — FCF projection, WACC, terminal value, sensitivity table
4. Comps module — peer table, EV/EBITDA/P/E multiples, implied range
5. Football field chart — unified valuation output
6. Scenario toggle (base/bull/bear) that propagates live

**Ship in v1 for the "wow" moment:**
7. IRR sensitivity heatmap (entry × exit)
8. PDF tearsheet — one-click, clean, branded
9. Excel export — full model workbook

**Ship when the core is stable:**
10. CSV/10-K upload to auto-populate inputs
11. Auto-pulled comps via market data API with manual override
12. IRR waterfall / value creation attribution chart

**Defer (post-MVP):**
- Full three-statement model
- AI document parsing
- Sector templates
- Fund-level waterfall / carried interest

---

## Sources

- [LBO Model — Corporate Finance Institute](https://corporatefinanceinstitute.com/resources/financial-modeling/lbo-model/)
- [How to Build an LBO Model — Uplevered 2026](https://uplevered.com/how-to-build-an-lbo-model/)
- [LBO Modeling Test — Wall Street Prep](https://www.wallstreetprep.com/knowledge/lbo-modeling-test-example-solutions/)
- [Comparable Company Analysis — Wall Street Prep](https://www.wallstreetprep.com/knowledge/comparable-company-analysis-comps/)
- [Football Field Valuation Chart — Wall Street Prep](https://www.wallstreetprep.com/knowledge/football-field-valuation-real-example-excel-template/)
- [LBO Capital Structure — Macabacus](https://macabacus.com/valuation/lbo-capital-structure)
- [Comparable Companies Analysis — Macabacus](https://macabacus.com/valuation/comparable-companies)
- [Debt Schedule Modeling — Financial Modeling Education](https://www.financialmodelingeducation.com/pages/blog/modeling-a-debt-schedule-that-actually-works)
- [Private Equity Waterfall — Carta](https://carta.com/learn/private-funds/management/distribution-waterfall/)
- [Are Comps or DCF Required for PE Tests? — Wall Street Oasis](https://www.wallstreetoasis.com/forum/private-equity/are-comps-or-dcf-required-for-pe-recruiting-model-tests)
- [Scenario Analysis Best Practices — Wall Street Oasis](https://www.wallstreetoasis.com/forum/hedge-fund/best-ways-to-model-bearbullbase-in-excel)
- [PE Interview Guide — Mergers & Inquisitions](https://mergersandinquisitions.com/private-equity-interviews/)
- [25+ PE Analysis Tools — Source Code Deals](https://www.sourcecodeals.com/blog/pe-tools)
- [Terminal Value Sensitivity — Financial Modeling](https://www.financial-modeling.com/terminal-value-in-dcf-perpetual-growth-rate-sensitivity/)
