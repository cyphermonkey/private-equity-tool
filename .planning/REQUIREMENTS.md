# Requirements: PE Deal Workbench

**Defined:** 2026-03-10
**Core Value:** A fully configurable deal workbench that produces publication-quality visuals and a one-click PDF tearsheet — so an analyst can walk into any interview, open a URL, and show live deal work.

## v1 Requirements

### File Ingestion

- [x] **INGEST-01**: User can upload a CSV file of financial data to populate model inputs
- [x] **INGEST-02**: User can upload a 10-K PDF to extract key financial line items
- [x] **INGEST-03**: User can manually override any parsed or extracted value

### LBO Model

- [x] **LBO-01**: User can input Sources & Uses assumptions (entry multiple, equity %, debt tranches)
- [x] **LBO-02**: Tool calculates a multi-year debt schedule with mandatory amortization and cash sweep
- [x] **LBO-03**: Tool outputs IRR and MOIC for base, bull, and bear scenarios
- [x] **LBO-04**: User can set exit assumptions (exit year, exit multiple)

### DCF Valuation

- [ ] **DCF-01**: User can input revenue growth, margin, and capex assumptions per year
- [ ] **DCF-02**: Tool calculates WACC from user-provided cost of equity, debt, and tax rate
- [ ] **DCF-03**: Tool computes terminal value using Gordon Growth or exit multiple method
- [ ] **DCF-04**: Tool outputs implied equity value and per-share price
- [ ] **DCF-05**: Tool displays a sensitivity table (WACC × terminal growth rate)

### Comparable Company Analysis

- [ ] **COMP-01**: Tool auto-pulls public company multiples (EV/EBITDA, EV/Revenue, P/E) via FMP API
- [ ] **COMP-02**: User can manually add or remove peer companies
- [ ] **COMP-03**: Tool displays summary statistics (median, mean, 25th/75th percentile) for each multiple

### Scenario Analysis

- [x] **SCEN-01**: User can toggle between base, bull, and bear scenarios
- [x] **SCEN-02**: All model outputs (LBO, DCF, comps) update live on scenario toggle
- [x] **SCEN-03**: User can set independent assumptions for each scenario

### Visualizations

- [ ] **VIZ-01**: Tool displays an IRR waterfall chart (returns by value driver)
- [ ] **VIZ-02**: Tool displays a returns bridge chart
- [ ] **VIZ-03**: Tool displays a valuation football field chart showing LBO, DCF, and comps ranges

### Export

- [ ] **EXP-01**: User can export a one-page PDF deal tearsheet with all key outputs and charts
- [ ] **EXP-02**: User can export the full model to Excel (.xlsx)

### Deployment

- [x] **DEPLOY-01**: App is accessible via a public URL (Vercel)

## v2 Requirements

### AI Document Parsing

- **AI-01**: Tool parses a CIM or earnings call transcript to pre-fill model assumptions
- **AI-02**: Tool flags line items with low extraction confidence for manual review

### Advanced Modeling

- **ADV-01**: Three-statement financial model with balance sheet circulars
- **ADV-02**: LP/GP waterfall and fund-level return analysis
- **ADV-03**: Sector-specific templates (tech, healthcare, industrials)

### Collaboration

- **COLLAB-01**: User can share a deal workbench via URL with read-only access
- **COLLAB-02**: Multiple users can work on the same deal simultaneously

### Mobile

- **MOB-01**: App is usable on a tablet (responsive layout)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bloomberg / FactSet data integration | Cost and API access complexity |
| Real-time price feeds | Not needed for deal analysis; snapshot multiples sufficient |
| Backend server | Fully client-side; no auth or persistence required |
| Mobile app (native) | Desktop browser is the interview context |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGEST-01 | Phase 1 | Complete |
| INGEST-02 | Phase 1 | Complete |
| INGEST-03 | Phase 1 | Complete |
| LBO-01 | Phase 1 | Complete |
| LBO-02 | Phase 1 | Complete |
| LBO-03 | Phase 1 | Complete |
| LBO-04 | Phase 1 | Complete |
| SCEN-01 | Phase 1 | Complete |
| SCEN-02 | Phase 1 | Complete |
| SCEN-03 | Phase 1 | Complete |
| DEPLOY-01 | Phase 1 | Complete |
| DCF-01 | Phase 2 | Pending |
| DCF-02 | Phase 2 | Pending |
| DCF-03 | Phase 2 | Pending |
| DCF-04 | Phase 2 | Pending |
| DCF-05 | Phase 2 | Pending |
| COMP-01 | Phase 2 | Pending |
| COMP-02 | Phase 2 | Pending |
| COMP-03 | Phase 2 | Pending |
| VIZ-01 | Phase 3 | Pending |
| VIZ-02 | Phase 3 | Pending |
| VIZ-03 | Phase 3 | Pending |
| EXP-01 | Phase 3 | Pending |
| EXP-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after initial definition*
