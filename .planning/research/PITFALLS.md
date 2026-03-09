# Domain Pitfalls: PE Deal Workbench

**Domain:** Browser-based private equity deal analysis (LBO / DCF / Comps)
**Researched:** 2026-03-10
**Overall confidence:** HIGH for financial model logic (Wall Street Oasis, Wall Street Prep, UpLevered); MEDIUM for browser-specific implementation patterns (verified against library docs and community reports)

---

## Critical Pitfalls

Mistakes that cause rewrites, blow credibility in an interview, or invalidate model output.

---

### Pitfall 1: JavaScript Floating-Point Destroys Calculation Integrity

**What goes wrong:** JavaScript's IEEE-754 doubles produce `0.1 + 0.2 === 0.30000000000000004`. In a DCF, this compounds: WACC computed as 9.99999999% instead of 10.00% propagates through every discounted cash flow. IRR and MOIC figures display trailing noise digits. A PE interviewer looking at an IRR of `22.000000000000004%` immediately questions the tool's reliability.

**Why it happens:** Native `number` arithmetic in JavaScript is binary floating point. All monetary math — interest expense, EBITDA margins, leverage ratios — is affected.

**Consequences:** Visually wrong numbers in the tearsheet; loss of interviewer confidence in ten seconds; sensitivity table cells that differ from hand-calc by small but visible amounts.

**Prevention:**
- Use `decimal.js` or `dinero.js` for all financial arithmetic throughout the model engine. Do not use native `+`, `-`, `*`, `/` on monetary values.
- Store all values internally as integers (basis points for rates, cents for dollar amounts) and convert to display units only at render time.
- Add a unit test that asserts `0.1 + 0.2 === 0.3` using the chosen library to enforce the constraint from day one.

**Warning signs:** Any calculation test using `===` on floating-point results fails intermittently; rounding calls (`toFixed`, `Math.round`) scattered through the model layer instead of confined to display.

**Phase:** Address in Phase 1 (model engine foundation), before any calculation logic is written.

---

### Pitfall 2: LBO Circular Reference Handled Incorrectly

**What goes wrong:** Interest expense depends on the debt balance; the debt balance depends on cash available for paydown; cash available depends on net income after interest. This is a genuine circular dependency. Naively computing it in a single pass produces the wrong debt balance — either the first period's interest or zero, depending on execution order. The model balances but the numbers are wrong.

**Why it happens:** Excel resolves circulars via iterative calculation (enabled in Options → Formulas). In JavaScript there is no built-in equivalent — developers either ignore the dependency (wrong) or try to flatten it to prior-period balances (valid approximation, but must be documented).

**Consequences:** IRR is off. Debt paydown schedule is incorrect. An interviewer who stress-tests the model by changing the debt rate by 100bps and watching the equity IRR move will see a non-sensical result.

**Prevention:**
- Resolve circulars with fixed-point iteration: compute interest on prior period's ending balance first, recalculate ending balance, then iterate 3-5 times until convergence (delta < $0.01). Document this approach in code comments.
- Alternatively, use beginning-of-period balances for interest (acceptable approximation for annual models — call it out explicitly in the UI).
- Add an assertion that checks convergence: if after 10 iterations the delta exceeds $1, surface a model error rather than displaying a wrong number silently.

**Warning signs:** Changing the interest rate assumption by 1% causes zero change in equity cash flows; debt schedule shows the same balance in every period.

**Phase:** Address in Phase 1 (LBO model engine), before building debt schedule UI.

---

### Pitfall 3: DCF Discount Rate / Cash Flow Type Mismatch

**What goes wrong:** Unlevered Free Cash Flow (UFCF) must be discounted at WACC. Levered Free Cash Flow (LFCF) must be discounted at Cost of Equity. Mixing these — discounting UFCF at cost of equity, or discounting LFCF at WACC — produces an enterprise value that is categorically incorrect. This is a top-five interview question and an instant red flag.

**Why it happens:** The distinction is subtle. If the model always computes UFCF (ignoring interest and debt paydown in the FCF build) but lets the user enter only a cost of equity as the "discount rate," it silently produces wrong results.

**Consequences:** Enterprise value is overstated or understated by the full effect of the capital structure. An interviewer who asks "walk me through your discount rate" will immediately detect the error.

**Prevention:**
- Enforce pairing at the model layer: if FCF type = UFCF, the discount rate input must be labeled and sourced as WACC. Disable cost-of-equity-only input in that mode.
- Build WACC as a derived output (not a raw user input): collect equity weight, debt weight, cost of equity, pre-tax cost of debt, and tax rate; compute WACC programmatically. This forces the user to understand the components.
- Validate: if WACC computed from components differs from any manually entered override by more than 50bps, surface a warning.

**Warning signs:** A single numeric field labeled "Discount Rate (%)" with no explanation of whether it is cost of equity or WACC.

**Phase:** Address in Phase 1 (DCF model engine).

---

### Pitfall 4: Terminal Value Miscalculation (Undiscounted or Wrong Multiple)

**What goes wrong:** Two terminal value errors are extremely common:
1. **Forgetting to discount the terminal value.** The Gordon Growth terminal value formula produces a value at the end of the forecast horizon. Developers forget to discount it back to Year 0 by dividing by `(1 + WACC)^n`. The enterprise value is massively overstated.
2. **Exit multiple on wrong base.** EV/EBITDA exit multiples apply to EBITDA, not EBIT, not revenue. Using the wrong multiple base is a top interview fail.

**Why it happens:** The Gordon Growth formula is often implemented from memory: `FCF * (1+g) / (WACC - g)`. The discounting step is a separate line that is easy to miss in code.

**Consequences:** Enterprise value is inflated by 4-5x in the undiscounted case. This also makes terminal value 90%+ of total EV, which is the red-flag threshold interviewers explicitly probe.

**Prevention:**
- Implement terminal value as two explicit steps with named variables: `tv_at_horizon` and `tv_at_present`. Never compute them in a single expression.
- Add a validation: if terminal value / total enterprise value exceeds 80%, surface a yellow warning in the UI: "Terminal value is {X}% of EV — verify growth rate assumptions."
- Check: terminal growth rate must be less than WACC (otherwise the formula produces a negative denominator or infinite value). Enforce this as a hard validation error.

**Warning signs:** Sensitivity table for terminal growth rate shows enterprise value changing non-monotonically; terminal value exceeds 85% of total EV in the base case.

**Phase:** Address in Phase 1 (DCF model engine). Add the % TV warning in Phase 2 (output display layer).

---

### Pitfall 5: IRR Calculation Uses Wrong Function or Timing Assumption

**What goes wrong:** JavaScript developers reach for a standard IRR implementation that assumes annual, equally-spaced cash flows (equivalent to Excel's `IRR`). LBO models with stub periods, mid-year investments, or quarterly cash flows produce wrong IRR when equal-spacing is assumed. The correct function is XIRR, which takes explicit dates alongside cash flows.

**Why it happens:** Standard IRR algorithms (Newton-Raphson on equal periods) are widely available; XIRR with arbitrary date arrays is less common in open-source JS implementations.

**Consequences:** IRR error of 100-600bps, depending on stub period length. A 5-year deal closing mid-year will show a materially different IRR than a clean year-end close.

**Prevention:**
- Use an XIRR implementation that accepts `[cashflow, date]` pairs. Validate against Excel's XIRR on the same inputs before shipping.
- If supporting only annual models initially, document this constraint explicitly in the UI ("assumes year-end cash flows") and enforce it rather than silently accepting stub dates.
- Add a test: a 5-year investment of $100 returned as $200 at exit = MOIC of 2.0x = IRR of ~14.87% annually. Assert this exactly.

**Warning signs:** IRR and MOIC imply different holding period return when cross-checked with the rule of 72; model IRR changes when the entry date changes without any change to cash flows.

**Phase:** Address in Phase 1 (returns calculation).

---

### Pitfall 6: Management Rollover Double-Counting Inflates Sponsor IRR

**What goes wrong:** In the Sources and Uses table, management rollover appears as both a source of funds (reducing required sponsor equity) and a use of funds (rolled equity credited to management at close). If the tool counts rollover as an additional equity source on top of the sponsor check — rather than as a reduction in the sponsor check — it overstates total equity invested, distorts ownership percentages, and understates the true leverage ratio. IRR impact documented at ~600 basis points on a typical deal.

**Why it happens:** The Sources and Uses table is easy to misread: rollover appears in both columns, so developers sum all sources including rollover and compare to total uses, producing a correct balance — but the sponsor equity line is wrong.

**Prevention:**
- Build the Sources and Uses with explicit business logic: `sponsor_equity = total_equity - management_rollover`. Never allow both to be independently entered without this constraint.
- Display leverage at entry as `total_debt / (total_debt + sponsor_equity + rollover)` — not `total_debt / total_uses`.

**Warning signs:** Changing rollover amount does not change sponsor equity in the model; ownership percentages don't sum to 100%.

**Phase:** Address in Phase 1 (LBO Sources and Uses).

---

### Pitfall 7: PDF Tearsheet Export Produces Untrustworthy Output

**What goes wrong:** The default html2canvas + jsPDF pipeline rasterizes the entire page into a bitmap image embedded in a PDF. The result is:
- Text is not selectable or searchable (an interviewer trying to copy a number cannot)
- File sizes are large (3-10 MB for a one-pager)
- Font rendering is often blurry at 150dpi
- Charts with thin axis lines look pixelated
- CSS Grid and Flexbox layouts sometimes collapse or overflow during the off-screen render

**Why it happens:** html2canvas captures a pixel snapshot of the DOM. This is the path of least resistance for client-side PDF generation but treats a financial document like a screenshot.

**Consequences:** The tearsheet looks like a low-quality printout rather than a publication-quality deal memo. Interviewers notice immediately. Bloomberg printouts are crisp; this will not be.

**Prevention:**
- Use `@react-pdf/renderer` (renders a real PDF via a React-like API, not a DOM screenshot) for the tearsheet layout. It produces vector text, precise sizing, and small file sizes.
- Alternatively, generate PDFs server-side using Puppeteer with headless Chrome (renders the page at high DPI and produces a native PDF with selectable text). This requires a lightweight server endpoint but produces the highest quality output.
- Never use html2canvas for the primary tearsheet path. It is acceptable for "export what I see" secondary features only.
- Set a target: PDF file size under 500KB, all text selectable, charts rendered as SVG embedded in PDF.

**Warning signs:** PDF file size over 2MB for a single-page tearsheet; text in exported PDF cannot be highlighted; charts look blurry when zoomed in PDF viewer.

**Phase:** Address in Phase 2 (export pipeline). Prototype the PDF renderer before building tearsheet layout so design decisions are compatible with the chosen approach.

---

### Pitfall 8: Excel Export Loses Model Structure and Formulas

**What goes wrong:** SheetJS Community Edition (the free tier) exports values only — it does not preserve live Excel formulas. A recipient opening the exported model sees hardcoded numbers with no ability to change an assumption and see it flow through. For a PE analyst, an "Excel model" that has no formulas is a data dump, not a model.

**Why it happens:** Writing live formulas in SheetJS requires manually constructing formula strings (`{f: "=B2*C2"}`), which is tedious to maintain and error-prone. The path of least resistance is exporting computed values.

**Consequences:** The Excel output fails to impress anyone who opens it expecting to stress-test assumptions.

**Prevention:**
- For each model output, maintain a parallel formula representation alongside the computed value. Export both: use formula strings in the Excel cells so the workbook recalculates natively.
- Structure exported workbooks with named ranges for key inputs (entry EBITDA, leverage multiple, WACC) so recipients can change assumptions without hunting through cells.
- Use ExcelJS (not SheetJS CE) for richer formatting: number formats (accounting style, basis points), cell borders, color-coded assumption vs. output sections.
- Test the exported file: open in Excel, change one input, verify dependent cells update correctly.

**Warning signs:** Opening the exported model in Excel shows no formulas in the formula bar; changing an input cell has no downstream effect.

**Phase:** Address in Phase 2 (export pipeline).

---

## Moderate Pitfalls

Mistakes that degrade quality and trust but do not invalidate the model.

---

### Pitfall 9: Free Market Data API Reliability Fails During Demo

**What goes wrong:** Alpha Vantage's free tier is capped at 25 requests per day and 5 per minute (as of 2025). Financial Modeling Prep's free tier allows 250 requests per day. During a live interview demo, hitting a rate limit or receiving a stale response causes the comps table to fail to populate — the worst possible moment for an API error.

**Why it happens:** Developers test with light API usage during development; the interview scenario may involve refreshing the app multiple times or loading several tickers, exhausting the daily quota.

**Consequences:** The comps section shows an error or blank rows during the demo. The tool looks fragile.

**Prevention:**
- Cache all API responses aggressively in `localStorage` or `IndexedDB` with a TTL of 24 hours. On cache hit, serve from cache rather than making a live API call.
- Pre-populate a set of 15-20 commonly used comps tickers (S&P 500 large caps, sector leaders) at build time as static JSON fixtures. Fall back to fixtures if the API is unavailable.
- Display data freshness: "Prices as of [timestamp]" so any staleness is acknowledged rather than hidden.
- IEX Cloud shut down in August 2024. Yahoo Finance's unofficial API breaks without warning. Do not build on either. Use FMP for financial statements (more generous free tier) and Alpha Vantage for prices (or Polygon.io at $29/month for reliability).

**Warning signs:** API calls made on every page load without a caching layer; no error state designed for the comps table.

**Phase:** Address in Phase 1 (data layer architecture). Implement caching before wiring up any UI that displays market data.

---

### Pitfall 10: Scanned 10-K PDFs Break File Parsing Silently

**What goes wrong:** 10-K filings come in two formats: digital PDFs (text is embedded as searchable characters) and scanned PDFs (pages are images with no extractable text layer). `pdf.js` extracts zero text from scanned documents. The tool receives an empty parse result and either crashes, shows blank inputs, or silently populates $0 everywhere.

**Why it happens:** Older filings (pre-2000) and some international documents are scanned. Even modern 10-Ks sometimes contain scanned exhibits. The developer tests with a clean digital PDF during development.

**Consequences:** The user uploads a file and gets a broken model with no explanation. This is worse than an error message.

**Prevention:**
- After parsing, check the extracted text length. If a multi-page PDF yields fewer than 200 characters total, surface a clear error: "This PDF appears to be a scanned document. Please upload a digital PDF or CSV export of the financials."
- For CSVs: validate that expected column headers exist (Revenue, EBITDA, Net Income, or similar) after parsing; flag missing columns explicitly rather than treating them as zero.
- Build a manual override input for every auto-parsed field. If parsing partially succeeds, let the user correct individual fields rather than requiring a full re-upload.
- Accept CSV as a first-class input method. Most analysts can export financials from Capital IQ or Bloomberg as CSV; this is more reliable than PDF parsing.

**Warning signs:** No post-parse validation step; model inputs default to zero with no user-visible error when parsing returns empty data.

**Phase:** Address in Phase 1 (file ingestion layer). Design the parsing failure state before building the happy path.

---

### Pitfall 11: Large Uploaded Files Freeze the Browser Tab

**What goes wrong:** A 10-year LBO model with monthly granularity, sensitivity tables, and a full three-statement model generates tens of thousands of cell computations. If all calculations run synchronously on the main thread during input changes, the browser tab freezes for 1-3 seconds on every keystroke — noticeably sluggish on a MacBook during a demo.

**Why it happens:** Financial model engines are compute-intensive nested loops. React's synchronous render cycle blocks the main thread.

**Prevention:**
- Move model computation into a Web Worker. The main thread stays responsive; the worker posts results back when complete.
- Debounce user inputs: recalculate no more than 200ms after the last input change, not on every keystroke.
- For sensitivity tables (which require running the model N×M times for each cell), compute them lazily — only when the sensitivity tab is active, not on every model change.
- Set a performance budget: the model should recalculate within 100ms for a standard 5-year annual LBO. Test with Chrome DevTools Performance panel.

**Warning signs:** `setTimeout` used to defer calculations; no Web Worker in the architecture; sensitivity table recomputes on every input change.

**Phase:** Address in Phase 2 (model performance). Profile before optimizing; do not pre-optimize before the model is functionally correct.

---

### Pitfall 12: WACC Beta and Market Risk Premium Assumptions Unchallenged

**What goes wrong:** WACC is computed as `Rf + Beta * (Rm - Rf) + size_premium`. Each input is a judgment call:
- Risk-free rate: which tenor? (10-year Treasury is standard; using 3-month T-bill is wrong for PE)
- Beta: raw or relevered? Levered beta must be unlevered against the target's capital structure, then re-levered to the comp's capital structure. Using raw beta without adjustment for capital structure differences is a common error.
- Equity risk premium: Damodaran's implied ERP (updated annually) is the standard. Using a static 5% from memory is defensible but less credible.

**Why it happens:** The UI presents "Beta" as a single number input; users paste raw beta from a screener without re-levering.

**Prevention:**
- Provide a beta relevering calculator as an expandable tooltip: accepts unlevered beta + target D/E + tax rate, outputs re-levered beta using the Hamada equation.
- Pre-populate risk-free rate from a live source (US Treasury API, free tier) or a dated static value labeled "10-Year UST as of [date]" — never leave it as an unlabeled default.
- Source Damodaran's ERP data (published annually at NYU): link to it directly in the WACC section so users can verify.

**Warning signs:** Single "Beta" input field with no re-levering logic; risk-free rate hardcoded as a magic number in source code.

**Phase:** Address in Phase 1 (WACC engine). Document assumptions; they will be the first thing an interviewer asks about.

---

## Minor Pitfalls

Mistakes that reduce polish but are recoverable.

---

### Pitfall 13: Comps Table Uses Wrong Enterprise Value Convention

**What goes wrong:** Enterprise Value = Market Cap + Total Debt + Preferred + Minority Interest - Cash. Developers commonly use Market Cap + Net Debt (total debt - cash), omitting preferred equity and minority interest. For most large-cap comps, the error is small. For companies with significant preferred or non-controlling interests, the EV is materially wrong.

**Prevention:** Use the full EV formula. Source all components from the API. Display the EV build as a tooltip so users can verify each component.

**Phase:** Address in Phase 1 (comps engine).

---

### Pitfall 14: Number Formatting Breaks Credibility

**What goes wrong:** A PE analyst expects: revenue in $MM with one decimal, percentages to two decimal places, multiples to two decimal places (e.g., 8.5x not 8.500000x or 9x), and negative numbers in parentheses — not with a minus sign. Displaying `IRR: 22.4892384%` or `EBITDA: $1234.56` (not `$1,235`) or `-$50M` (instead of `($50M)`) signals that the developer has not worked in finance.

**Prevention:**
- Build a centralized `formatFinancial(value, type)` utility at project start. Types: `currency_mm`, `percentage_2dp`, `multiple_2dp`, `basis_points`. All display goes through this function.
- Use parentheses for all negative financial values in tables (accounting convention).
- Large numbers: display in $MM or $B with appropriate rounding; never display raw dollar amounts like `$1,234,567,890`.

**Phase:** Address in Phase 1 (shared utilities), before any output UI is built.

---

### Pitfall 15: Scenario Toggle Does Not Update All Outputs Simultaneously

**What goes wrong:** The base/bull/bear scenario toggle updates the LBO IRR but the DCF valuation and the football field chart still show the base case values. The user notices the inconsistency and loses trust in whether the tool is correct.

**Why it happens:** Scenario state is managed locally within each module rather than as a single global context that all calculations subscribe to.

**Prevention:** Implement scenario as a single piece of global state (React context or Zustand store). All model inputs derive their values from `inputs[activeScenario]`. All outputs recompute reactively when the scenario changes. Never store scenario-specific values in component local state.

**Phase:** Address in Phase 1 (state architecture), before building individual model modules.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Model engine (P1) | Floating-point errors in all calculations | Use `decimal.js` from day one; no native arithmetic on financial values |
| LBO debt schedule (P1) | Circular reference not resolved | Implement fixed-point iteration with convergence check |
| DCF engine (P1) | FCF/discount rate type mismatch | Enforce pairing in the model layer, not just the UI |
| Terminal value (P1) | Undiscounted terminal value | Two named variables; add % TV / EV validation |
| IRR calculation (P1) | Wrong timing assumption | XIRR implementation with date arrays; test against Excel |
| WACC (P1) | Beta not re-levered; wrong risk-free rate | Hamada calculator built-in; live or labeled risk-free rate |
| File ingestion (P1) | Scanned PDF → silent zero inputs | Post-parse text-length check; mandatory manual override fields |
| Market data (P1) | API rate limit during demo | 24h localStorage cache; static fixture fallback for 20 comps |
| Scenario state (P1) | Partial scenario propagation | Single global scenario context before any module is built |
| PDF export (P2) | Rasterized, non-selectable tearsheet | Use @react-pdf/renderer or Puppeteer; reject html2canvas for primary path |
| Excel export (P2) | Values-only export, no formulas | Maintain formula strings alongside computed values in model layer |
| Performance (P2) | Main thread freeze on recalculation | Web Worker for model engine; debounced inputs; lazy sensitivity tables |
| Number display (P1, ongoing) | Wrong formatting convention | `formatFinancial()` utility before any output UI |
| Comps EV (P1) | Incomplete EV formula | Full EV formula including preferred and minority interest |

---

## Sources

- [Common Errors in DCF Models — Wall Street Prep](https://www.wallstreetprep.com/knowledge/common-errors-in-dcf-models/)
- [LBO Modeling Traps That Kill IRR — UpLevered](https://uplevered.com/lbo-modeling-traps/)
- [Circular References in LBO Models — Wall Street Oasis](https://www.wallstreetoasis.com/forum/private-equity/circular-references-in-lbo-models)
- [Circular References in Corporate Finance — Ed Bodmer](https://edbodmer.com/circular-references-in-corporate-finance/)
- [Financial Precision in JavaScript — DEV Community](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
- [Floats Don't Work For Storing Cents — Modern Treasury](https://www.moderntreasury.com/journal/floats-dont-work-for-storing-cents)
- [Financial Data APIs Compared 2026 — ksred.com](https://www.ksred.com/the-complete-guide-to-financial-data-apis-building-your-own-stock-market-data-pipeline-in-2025/)
- [Best Free Finance APIs 2025 — noteapiconnector.com](https://noteapiconnector.com/best-free-finance-apis)
- [PDF Text Extraction and Scanned PDFs — Sensible Blog](https://www.sensible.so/blog/solving-direct-text-extraction-from-pdfs)
- [Complete Guide to PDF.js — Nutrient](https://www.nutrient.io/blog/complete-guide-to-pdfjs/)
- [jsPDF + html2canvas Pitfalls — HackMD](https://hackmd.io/@n6kGXbvAST2zb6hPLZ6sNQ/HJTVYZz8n)
- [html2pdf.js Issues — ekoopmans.github.io](https://ekoopmans.github.io/html2pdf.js/)
- [PapaParse Encoding Issues — GitHub](https://github.com/mholt/PapaParse/issues/864)
- [Render Large Datasets in React — Syncfusion](https://www.syncfusion.com/blogs/post/render-large-datasets-in-react)
- [SheetJS Formulae Documentation — SheetJS](https://docs.sheetjs.com/docs/csf/features/formulae/)
- [Fintech UX Best Practices 2026 — Eleken](https://www.eleken.co/blog-posts/fintech-ux-best-practices)
