---
phase: 1
slug: foundation-lbo-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (TypeScript-native, Vite-integrated) |
| **Config file** | `vite.config.ts` — add `test: { globals: true }` in Wave 0 |
| **Quick run command** | `npx vitest run src/engine` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~8 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/engine`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|-------------|-----------|-------------------|-------------|--------|
| Engine types | LBO-01–04 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts` | ❌ W0 | ⬜ pending |
| decimal.js precision | LBO-03 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "precision"` | ❌ W0 | ⬜ pending |
| XIRR validation | LBO-03 | Unit | `npx vitest run src/engine/__tests__/xirr.test.ts` | ❌ W0 | ⬜ pending |
| S&U constraint | LBO-01 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "sponsor equity"` | ❌ W0 | ⬜ pending |
| Sources = Uses balance | LBO-01 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "sources uses balance"` | ❌ W0 | ⬜ pending |
| Debt schedule convergence | LBO-02 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "debt schedule"` | ❌ W0 | ⬜ pending |
| Mandatory amort before sweep | LBO-02 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "amortization"` | ❌ W0 | ⬜ pending |
| Sweep floor (no negative balance) | LBO-02 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "sweep floor"` | ❌ W0 | ⬜ pending |
| Exit EV calculation | LBO-04 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "exit"` | ❌ W0 | ⬜ pending |
| MOIC calculation | LBO-03 | Unit | `npx vitest run src/engine/__tests__/lbo.test.ts -t "MOIC"` | ❌ W0 | ⬜ pending |
| formatFinancial all types | LBO-03 | Unit | `npx vitest run src/engine/__tests__/format.test.ts` | ❌ W0 | ⬜ pending |
| CSV upload populates fields | INGEST-01 | Unit | `npx vitest run src/data/__tests__/csvParser.test.ts` | ❌ W0 | ⬜ pending |
| Column alias resolution | INGEST-01 | Unit | `npx vitest run src/data/__tests__/normalizer.test.ts` | ❌ W0 | ⬜ pending |
| PDF text extraction | INGEST-02 | Unit | `npx vitest run src/data/__tests__/pdfExtractor.test.ts` | ❌ W0 | ⬜ pending |
| Scanned PDF guard | INGEST-02 | Unit | `npx vitest run src/data/__tests__/pdfExtractor.test.ts` | ❌ W0 | ⬜ pending |
| Manual override updates store | INGEST-03 | Unit | `npx vitest run src/stores/__tests__/dataStore.test.ts` | ❌ W0 | ⬜ pending |
| Scenario toggle (no recompute) | SCEN-01 | Unit | `npx vitest run src/stores/__tests__/modelStore.test.ts -t "toggle"` | ❌ W0 | ⬜ pending |
| All 3 scenarios pre-computed | SCEN-02 | Unit | `npx vitest run src/stores/__tests__/modelStore.test.ts -t "all scenarios"` | ❌ W0 | ⬜ pending |
| Scenario independence | SCEN-03 | Unit | `npx vitest run src/stores/__tests__/modelStore.test.ts -t "independence"` | ❌ W0 | ⬜ pending |
| Vite build produces dist/ | DEPLOY-01 | Build | `npm run build && test -f dist/index.html` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/lbo.test.ts` — covers LBO-01, LBO-02, LBO-03, LBO-04; includes standard 5-year fixture
- [ ] `src/engine/__tests__/xirr.test.ts` — XIRR convergence, 14.87% validation ($100 in / $200 out at 5y), edge cases
- [ ] `src/engine/__tests__/format.test.ts` — `formatFinancial()` all types, negative parentheses, accounting convention
- [ ] `src/data/__tests__/csvParser.test.ts` — INGEST-01 with fixture CSV file
- [ ] `src/data/__tests__/normalizer.test.ts` — column alias matching (CapIQ/Bloomberg headers)
- [ ] `src/data/__tests__/pdfExtractor.test.ts` — INGEST-02 including scanned PDF guard (< 200 chars threshold)
- [ ] `src/stores/__tests__/modelStore.test.ts` — SCEN-01, SCEN-02, SCEN-03
- [ ] `src/stores/__tests__/dataStore.test.ts` — INGEST-03 override behavior
- [ ] `vite.config.ts` — add `test: { globals: true }` to enable Vitest

### Standard LBO Fixture (required for Wave 0 test assertions)

Pre-compute and verify in Excel before writing tests:

- Entry EBITDA: $100M; Entry multiple: 10.0x → Entry EV: $1,000M
- Total equity: 40% → $400M; Management rollover: $20M → Sponsor equity: $380M
- Total debt: $600M (TLA: $200M at 6%, 20% annual amort; TLB: $400M at 7%, 1% annual amort)
- Revenue growth: 5%/year; EBITDA margin: 30% (stable)
- Exit year: 5; Exit multiple: 12.0x
- Expected IRR: ~25–28% (verify in Excel with XIRR function)
- Expected MOIC: ~3.0–3.5x

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App accessible at public Vercel URL | DEPLOY-01 | Requires live deployment | Run `vercel deploy`, visit URL, confirm app loads without install |
| `vercel.json` SPA rewrite present | DEPLOY-01 | Config inspection | Open `vercel.json`, confirm `"source": "/(.*)"` → `"destination": "/index.html"` rule exists |
| PDF upload UI shows field-level correction prompt | INGEST-02 | Browser file API | Upload a real 10-K PDF, confirm each extracted field shows an editable override input |
| Scenario toggle has no perceptible lag | SCEN-01/02 | User perception | Click base→bull→bear rapidly, confirm outputs update in same render cycle |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 8s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
