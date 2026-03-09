/**
 * XIRR — date-explicit internal rate of return using Newton-Raphson iteration.
 *
 * Operates on native JS numbers (not Decimal) — the outer computeLBO converts
 * the result to a Decimal string.
 *
 * Validation: $100 invested, $200 returned at exactly 5 years → 14.87%.
 */

export interface CashflowPair {
  amount: number;
  date: Date;
}

const CONVERGENCE_THRESHOLD = 1e-7
const MAX_ITERATIONS = 100

function npv(cashflows: CashflowPair[], rate: number, t0: Date): number {
  return cashflows.reduce((sum, cf) => {
    const t = (cf.date.getTime() - t0.getTime()) / (365 * 24 * 60 * 60 * 1000)
    return sum + cf.amount / Math.pow(1 + rate, t)
  }, 0)
}

function dnpv(cashflows: CashflowPair[], rate: number, t0: Date): number {
  return cashflows.reduce((sum, cf) => {
    const t = (cf.date.getTime() - t0.getTime()) / (365 * 24 * 60 * 60 * 1000)
    return sum - t * cf.amount / Math.pow(1 + rate, t + 1)
  }, 0)
}

/**
 * Compute XIRR for a series of (amount, date) cashflow pairs.
 *
 * Requires at least one negative cashflow (initial investment) and at least
 * one positive cashflow (return).
 *
 * @throws {Error} if no negative cashflow is present
 * @throws {Error} if Newton-Raphson fails to converge within MAX_ITERATIONS
 */
export function xirr(cashflows: CashflowPair[], guess = 0.1): number {
  if (cashflows.length < 2) {
    throw new Error('XIRR requires at least 2 cashflows')
  }

  const hasNegative = cashflows.some(cf => cf.amount < 0)
  const hasPositive = cashflows.some(cf => cf.amount > 0)

  if (!hasNegative || !hasPositive) {
    throw new Error('XIRR requires at least one negative and one positive cashflow')
  }

  const t0 = cashflows[0]!.date
  let rate = guess

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npvValue = npv(cashflows, rate, t0)
    const dnpvValue = dnpv(cashflows, rate, t0)

    if (Math.abs(dnpvValue) < 1e-12) {
      throw new Error('XIRR did not converge: derivative too small')
    }

    const newRate = rate - npvValue / dnpvValue

    if (Math.abs(newRate - rate) < CONVERGENCE_THRESHOLD) {
      return newRate
    }

    rate = newRate
  }

  throw new Error('XIRR did not converge')
}
