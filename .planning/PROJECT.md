# PE Deal Workbench

## What This Is

An integrated, browser-based private equity deal analysis platform built for entry-level analysts and associates. Users upload company financials (10-K, CSV) and the tool runs LBO modeling, DCF valuation, and comparable company analysis — all in one configurable workspace. Designed as a portfolio project to demonstrate PE technical skills in recruiting interviews.

## Core Value

A fully configurable deal workbench that produces publication-quality visuals and a one-click PDF tearsheet — so an analyst can walk into any interview, open a URL, and show live deal work.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can upload company financials (10-K PDF or CSV) to populate model inputs
- [ ] LBO model with entry assumptions, debt schedule, and returns output (IRR / MOIC)
- [ ] DCF valuation with WACC, terminal value, and sensitivity tables
- [ ] Comparable company analysis with auto-pulled public comps + manual override
- [ ] Base / bull / bear scenario toggle that updates all outputs live
- [ ] Modular sections — enable/disable LBO, DCF, comps per deal
- [ ] IRR waterfall, returns bridge, and valuation football field charts (publication quality)
- [ ] One-click PDF tearsheet export — clean 1-page deal summary
- [ ] Excel export of the full model
- [ ] Deployed as a live web app accessible via URL

### Out of Scope

- AI parsing of CIMs or earnings calls — adds complexity, not core to v1
- Sector-specific templates (tech, healthcare) — general-purpose model covers most deals
- Multi-user collaboration / team features — single-user for interview prep
- Mobile app — desktop browser is the interview context

## Context

- Target user: entry-level quant or PE analyst grinding for interviews
- Primary showcase moment: opening the app on a laptop during a recruiting interview
- Must feel credible to someone who has used Bloomberg or Argus before
- No Bloomberg terminal access assumed — financials come from user uploads or free market data APIs

## Constraints

- **Stack**: Web-based (React or similar) — must run in a browser with no install
- **Data**: Financial parsing from uploaded CSV/10-K; comps from a free or low-cost market data API
- **Export**: PDF tearsheet and Excel model export must be client-side or lightweight server-side
- **Deployment**: Must be publicly accessible via URL for interview demos

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Upload-based financials (not manual entry) | Faster to demo; feels more real than blank model | — Pending |
| Auto-pull comps with manual override | Best of both worlds — saves time but stays flexible | — Pending |
| Visuals + tearsheet as the "wow" factor | Differentiates from plain spreadsheet work | — Pending |

---
*Last updated: 2026-03-10 after initialization*
