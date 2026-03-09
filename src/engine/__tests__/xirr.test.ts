import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { xirr } from '../xirr'

describe('xirr', () => {
  it('$100 in / $200 out at 5 years = 14.87%', () => {
    const cashflows = [
      { amount: -100, date: new Date('2024-01-01') },
      { amount: 200, date: new Date('2029-01-01') },
    ]
    const result = xirr(cashflows)
    // Use Decimal for precise rounding to 2dp
    const rounded = new Decimal(result).toDecimalPlaces(4).toNumber()
    expect(rounded).toBeCloseTo(0.1487, 3)
  })

  it('negative cash flow at entry is required — throws if all positive', () => {
    const cashflows = [
      { amount: 100, date: new Date('2024-01-01') },
      { amount: 200, date: new Date('2029-01-01') },
    ]
    // All-positive flows have no meaningful IRR — should throw or return invalid
    expect(() => xirr(cashflows)).toThrow()
  })

  it('throws on non-convergence for degenerate input', () => {
    // Two identical positive cash flows — no convergence possible
    const cashflows = [
      { amount: -100, date: new Date('2024-01-01') },
      { amount: -200, date: new Date('2029-01-01') },
    ]
    expect(() => xirr(cashflows)).toThrow()
  })
})
