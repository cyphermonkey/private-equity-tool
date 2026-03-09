/**
 * computeLBO — pure TypeScript LBO calculation engine.
 *
 * Implements a full leveraged buyout model:
 *   - Sources & Uses (entry EV, equity/debt split, management rollover)
 *   - EBITDA/Revenue projection by year
 *   - Debt schedule with fixed-point iteration (circular: interest ↔ cash sweep)
 *   - Exit proceeds calculation
 *   - XIRR / MOIC return metrics
 *
 * All arithmetic uses decimal.js to avoid IEEE 754 floating-point errors.
 * Formatting is NOT done here — call formatFinancial() in the UI layer.
 */

import Decimal from 'decimal.js'
import type { LBOAssumptions, LBOOutputs, DebtYearRow } from './types'
import { xirr } from './xirr'

const ZERO = new Decimal(0)

function addYears(date: Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

export function computeLBO(a: LBOAssumptions): LBOOutputs {
  // ─── Step 1: Sources & Uses ────────────────────────────────────────────────
  const entryEV = new Decimal(a.entryEBITDA).times(a.entryMultiple)
  const totalEquity = entryEV.times(new Decimal(a.equityPct).dividedBy(100))
  const managementRollover = new Decimal(a.managementRollover)
  const sponsorEquity = totalEquity.minus(managementRollover)  // HARD CONSTRAINT

  if (sponsorEquity.lessThanOrEqualTo(ZERO)) {
    throw new Error(
      `Sponsor equity must be positive. managementRollover (${managementRollover.toString()}) >= totalEquity (${totalEquity.toString()})`
    )
  }

  const totalDebt = entryEV.minus(totalEquity)

  // ─── Step 2: EBITDA / Revenue Projection ──────────────────────────────────
  // Year 0 base: derive revenue from entryEBITDA and year-1 margin
  // entryEBITDA is year 0 EBITDA. Revenue year 0 = entryEBITDA / (margin[0]/100)
  const margin0 = new Decimal(a.ebitdaMarginByYear[0]!).dividedBy(100)
  const baseRevenue = new Decimal(a.entryEBITDA).dividedBy(margin0)

  const revenueByYear: Decimal[] = []
  const ebitdaByYear: Decimal[] = []
  const capexByYear: Decimal[] = []

  let prevRevenue = baseRevenue

  for (let y = 0; y < a.exitYear; y++) {
    const growthRate = new Decimal(a.revenueGrowthByYear[y]!).dividedBy(100)
    const margin = new Decimal(a.ebitdaMarginByYear[y]!).dividedBy(100)
    const capexPct = new Decimal(a.capexPctByYear[y]!).dividedBy(100)

    const revenue = prevRevenue.times(new Decimal(1).plus(growthRate))
    const ebitda = revenue.times(margin)
    const capex = revenue.times(capexPct)

    revenueByYear.push(revenue)
    ebitdaByYear.push(ebitda)
    capexByYear.push(capex)

    prevRevenue = revenue
  }

  // ─── Step 3: Debt Schedule with Fixed-Point Iteration ────────────────────
  // The circular: interestExpense depends on beginningBalance, which depends on
  // cashSweep, which depends on free cash flow, which depends on interestExpense.
  // Resolved by iterating per year until delta < $0.01.

  const MAX_FP_ITERATIONS = 10
  const CONVERGENCE_DELTA = new Decimal('0.01')

  // Track current balance per tranche (indexed by tranche array position)
  const currentBalances: Decimal[] = a.debtTranches.map(t => new Decimal(t.principal))
  const debtSchedule: DebtYearRow[] = []
  let globalConverged = true
  let maxIterationsUsed = 0

  for (let y = 1; y <= a.exitYear; y++) {
    const yearEBITDA = ebitdaByYear[y - 1]!
    const yearIdx = y - 1

    // Two-pass approach: compute mandatory amort + interest first,
    // then compute sweep from remaining cash, then iterate if needed.
    // Initialize with beginning-of-period balances as the fixed-point seed.

    const trancheBalances = currentBalances.map(b => new Decimal(b.toString()))
    const trancheNewBalances = trancheBalances.map(b => new Decimal(b.toString()))

    let iterationsThisYear = 0

    for (let iter = 0; iter < MAX_FP_ITERATIONS; iter++) {
      iterationsThisYear++

      // Compute total interest expense across all tranches (using begin-period balances)
      let totalInterest = ZERO
      const mandatoryAmorts: Decimal[] = []

      for (let i = 0; i < a.debtTranches.length; i++) {
        const tranche = a.debtTranches[i]!
        const beginBal = trancheBalances[i]!
        const rawMandatoryAmort = new Decimal(tranche.principal)
          .times(tranche.mandatoryAmortPct)
          .dividedBy(100)
        const mandatoryAmort = rawMandatoryAmort.greaterThan(beginBal)
          ? beginBal
          : rawMandatoryAmort // can't amortize more than remaining balance

        const interest = beginBal.times(tranche.rate).dividedBy(100)
        mandatoryAmorts.push(mandatoryAmort)
        totalInterest = totalInterest.plus(interest)
      }

      // Free cash available for sweep (after capex, mandatory amort, and interest)
      // FCF = EBITDA - capex - total interest - total mandatory amort
      const yearCapex = capexByYear[y - 1]!
      const totalMandatoryAmort = mandatoryAmorts.reduce((s, v) => s.plus(v), ZERO)
      const cashAvailableForSweep = yearEBITDA
        .minus(yearCapex)
        .minus(totalInterest)
        .minus(totalMandatoryAmort)

      // Distribute sweep to tranches in order (senior-first)
      let remainingSweep = cashAvailableForSweep.greaterThan(ZERO)
        ? cashAvailableForSweep
        : ZERO

      const newBalances: Decimal[] = []

      for (let i = 0; i < a.debtTranches.length; i++) {
        const beginBal = trancheBalances[i]!
        const mandatoryAmort = mandatoryAmorts[i]!
        const afterMandatory = beginBal.minus(mandatoryAmort).greaterThan(ZERO)
          ? beginBal.minus(mandatoryAmort)
          : ZERO

        // Sweep: apply to this tranche up to its remaining balance
        const sweepForTranche = remainingSweep.greaterThan(afterMandatory)
          ? afterMandatory
          : remainingSweep
        remainingSweep = remainingSweep.minus(sweepForTranche)

        const endingBal = afterMandatory.minus(sweepForTranche).greaterThan(ZERO)
          ? afterMandatory.minus(sweepForTranche)
          : ZERO

        newBalances.push(endingBal)
      }

      // Check convergence: max delta across all tranches
      let maxDelta = ZERO
      for (let i = 0; i < a.debtTranches.length; i++) {
        const delta = newBalances[i]!.minus(trancheNewBalances[i]!).abs()
        if (delta.greaterThan(maxDelta)) maxDelta = delta
      }

      // Update new balances for next iteration
      for (let i = 0; i < a.debtTranches.length; i++) {
        trancheNewBalances[i] = newBalances[i]!
      }

      if (maxDelta.lessThan(CONVERGENCE_DELTA)) {
        break
      }

      if (iter === MAX_FP_ITERATIONS - 1) {
        // Check if delta still > 1 (hard failure threshold)
        if (maxDelta.greaterThan(new Decimal('1'))) {
          const trancheName = a.debtTranches[0]?.name ?? 'unknown'
          throw new Error(`Debt schedule did not converge for tranche ${trancheName}`)
        }
        globalConverged = false
      }
    }

    if (iterationsThisYear > maxIterationsUsed) {
      maxIterationsUsed = iterationsThisYear
    }

    // Record DebtYearRow for each tranche this year
    for (let i = 0; i < a.debtTranches.length; i++) {
      const tranche = a.debtTranches[i]!
      const beginBal = trancheBalances[i]!
      const endingBal = trancheNewBalances[i]!
      const interest = beginBal.times(tranche.rate).dividedBy(100)
      const rawMandAmort = new Decimal(tranche.principal)
        .times(tranche.mandatoryAmortPct)
        .dividedBy(100)
      const mandatoryAmort = rawMandAmort.greaterThan(beginBal) ? beginBal : rawMandAmort

      const totalReduction = beginBal.minus(endingBal)
      const cashSweep = totalReduction.minus(mandatoryAmort).greaterThan(ZERO)
        ? totalReduction.minus(mandatoryAmort)
        : ZERO

      debtSchedule.push({
        year: y,
        tranche: tranche.name,
        beginningBalance: beginBal.toString(),
        interestExpense: interest.toString(),
        mandatoryAmort: mandatoryAmort.toString(),
        cashSweep: cashSweep.toString(),
        endingBalance: endingBal.toString(),
      })

      currentBalances[i] = endingBal
    }

    // Mark as not converged if we needed more than 5 iterations in any year
    if (maxIterationsUsed > 5) {
      globalConverged = false
    }

    void yearIdx // suppress unused warning
  }

  // ─── Step 4: Exit ─────────────────────────────────────────────────────────
  const exitEBITDA = ebitdaByYear[a.exitYear - 1]!
  const exitEV = new Decimal(a.exitMultiple).times(exitEBITDA)

  const totalEndingDebt = currentBalances.reduce((sum, bal) => sum.plus(bal), ZERO)
  const exitEquity = exitEV.minus(totalEndingDebt)

  // ─── Step 5: XIRR / MOIC ──────────────────────────────────────────────────
  const cashflowPairs = [
    { amount: -sponsorEquity.toNumber(), date: a.closingDate },
    { amount: exitEquity.toNumber(), date: addYears(a.closingDate, a.exitYear) },
  ]

  let irrStr = 'NaN'
  let converged = globalConverged

  try {
    const irrValue = xirr(cashflowPairs)
    irrStr = new Decimal(irrValue).toString()
  } catch {
    converged = false
  }

  const moicValue = exitEquity.dividedBy(sponsorEquity)

  return {
    entryEV: entryEV.toString(),
    totalEquity: totalEquity.toString(),
    sponsorEquity: sponsorEquity.toString(),
    managementRollover: managementRollover.toString(),
    totalDebt: totalDebt.toString(),
    purchasePrice: entryEV.toString(),
    debtSchedule,
    exitEBITDA: exitEBITDA.toString(),
    exitEV: exitEV.toString(),
    exitEquity: exitEquity.toString(),
    irr: irrStr,
    moic: moicValue.toString(),
    converged,
  }
}
