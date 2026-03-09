import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { formatFinancial } from '../format'

describe('formatFinancial - currency_mm', () => {
  it('positive value renders as $XM', () => {
    expect(formatFinancial(new Decimal('50000000'), 'currency_mm')).toBe('$50.0M')
  })

  it('negative value renders with parentheses', () => {
    expect(formatFinancial(new Decimal('-50000000'), 'currency_mm')).toBe('($50.0M)')
  })

  it('zero renders as $0.0M', () => {
    expect(formatFinancial(new Decimal('0'), 'currency_mm')).toBe('$0.0M')
  })
})

describe('formatFinancial - percentage_2dp', () => {
  it('positive value renders as XX.XX%', () => {
    expect(formatFinancial(new Decimal('0.2234'), 'percentage_2dp')).toBe('22.34%')
  })

  it('negative value renders with parentheses', () => {
    expect(formatFinancial(new Decimal('-0.05'), 'percentage_2dp')).toBe('(5.00%)')
  })
})

describe('formatFinancial - multiple_2dp', () => {
  it('positive value renders as X.XXx', () => {
    expect(formatFinancial(new Decimal('2.5'), 'multiple_2dp')).toBe('2.50x')
  })

  it('negative value renders with parentheses', () => {
    expect(formatFinancial(new Decimal('-1.5'), 'multiple_2dp')).toBe('(1.50x)')
  })
})

describe('formatFinancial - basis_points', () => {
  it('positive integer display', () => {
    expect(formatFinancial(new Decimal('250'), 'basis_points')).toBe('250bps')
  })
})
