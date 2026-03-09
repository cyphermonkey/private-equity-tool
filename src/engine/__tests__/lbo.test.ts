import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { computeLBO } from '../lbo'
import type { LBOAssumptions } from '../types'

// Standard 5-year LBO fixture — from VALIDATION.md
// Entry EBITDA: $100M; Entry multiple: 10.0x → Entry EV: $1,000M
// Total equity: 40% → $400M; Management rollover: $20M → Sponsor equity: $380M
// Total debt: $600M (TLA: $200M at 6%, 20% annual amort; TLB: $400M at 7%, 1% annual amort)
// Revenue growth: 5%/year; EBITDA margin: 30% (stable)
// Exit year: 5; Exit multiple: 12.0x
// Expected IRR: ~25–28%; Expected MOIC: ~3.0–3.5x

const standardFixture: LBOAssumptions = {
  entryEBITDA: '100000000',
  entryMultiple: '10',
  equityPct: '40',
  managementRollover: '20000000',
  debtTranches: [
    {
      name: 'TLA',
      principal: '200000000',
      rate: '6',
      mandatoryAmortPct: '20',
      maturityYear: 7,
      isBullet: false,
    },
    {
      name: 'TLB',
      principal: '400000000',
      rate: '7',
      mandatoryAmortPct: '1',
      maturityYear: 7,
      isBullet: false,
    },
  ],
  revenueGrowthByYear: ['5', '5', '5', '5', '5'],
  ebitdaMarginByYear: ['30', '30', '30', '30', '30'],
  capexPctByYear: ['5', '5', '5', '5', '5'],
  daPctByYear: ['3', '3', '3', '3', '3'],
  exitMultiple: '12',
  exitYear: 5,
  closingDate: new Date('2024-01-01'),
}

describe('decimal.js precision', () => {
  it('0.1 + 0.2 = 0.3 exactly', () => {
    expect(new Decimal('0.1').plus('0.2').toString()).toBe('0.3')
  })
})

describe('computeLBO - Sources & Uses', () => {
  it('sponsor equity constraint: sponsor_equity = total_equity - management_rollover', () => {
    const result = computeLBO(standardFixture)
    // totalEquity = 1000M * 40% = 400M; sponsorEquity = 400M - 20M = 380M
    expect(result.sponsorEquity).toBe('380000000')
  })

  it('sources uses balance: entryEV = totalDebt + totalEquity', () => {
    const result = computeLBO(standardFixture)
    const entryEV = new Decimal(result.entryEV)
    const totalDebt = new Decimal(result.totalDebt)
    const totalEquity = new Decimal(result.totalEquity)
    expect(entryEV.equals(totalDebt.plus(totalEquity))).toBe(true)
  })
})

describe('computeLBO - debt schedule', () => {
  it('converges in ≤5 iterations', () => {
    const result = computeLBO(standardFixture)
    expect(result.converged).toBe(true)
  })

  it('mandatory amortization before sweep — TLA has significant amort', () => {
    const result = computeLBO(standardFixture)
    // TLA 20% annual amort on $200M = $40M/year mandatory
    const tlaRows = result.debtSchedule.filter(r => r.tranche === 'TLA')
    expect(tlaRows.length).toBe(5)
    // Mandatory amort should be $40M for year 1 (20% of $200M principal)
    expect(new Decimal(tlaRows[0]!.mandatoryAmort).equals(new Decimal('40000000'))).toBe(true)
  })

  it('sweep floor — no negative balance', () => {
    const result = computeLBO(standardFixture)
    for (const row of result.debtSchedule) {
      expect(new Decimal(row.endingBalance).greaterThanOrEqualTo(0)).toBe(true)
    }
  })
})

describe('computeLBO - returns', () => {
  it('MOIC = exit equity / sponsor equity', () => {
    const result = computeLBO(standardFixture)
    const exitEquity = new Decimal(result.exitEquity)
    const sponsorEquity = new Decimal(result.sponsorEquity)
    const computedMoic = exitEquity.dividedBy(sponsorEquity).toDecimalPlaces(4)
    const reportedMoic = new Decimal(result.moic).toDecimalPlaces(4)
    expect(computedMoic.toString()).toBe(reportedMoic.toString())
  })

  it('exit EV = exitMultiple × exitYear EBITDA', () => {
    const result = computeLBO(standardFixture)
    const exitEBITDA = new Decimal(result.exitEBITDA)
    const exitMultiple = new Decimal(standardFixture.exitMultiple)
    const expectedExitEV = exitMultiple.times(exitEBITDA)
    expect(new Decimal(result.exitEV).toDecimalPlaces(0).toString()).toBe(
      expectedExitEV.toDecimalPlaces(0).toString()
    )
  })
})

describe('computeLBO - full fixture', () => {
  it('IRR is in range 25-28% for standard fixture', () => {
    const result = computeLBO(standardFixture)
    const irr = parseFloat(result.irr)
    expect(irr).toBeGreaterThanOrEqual(0.25)
    expect(irr).toBeLessThanOrEqual(0.28)
  })

  it('MOIC is in range 3.0-3.5x for standard fixture', () => {
    const result = computeLBO(standardFixture)
    const moic = parseFloat(result.moic)
    expect(moic).toBeGreaterThanOrEqual(3.0)
    expect(moic).toBeLessThanOrEqual(3.5)
  })
})
