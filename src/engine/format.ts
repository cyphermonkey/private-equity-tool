import Decimal from 'decimal.js'
import type { FormatType } from './types'

export type { FormatType } from './types'

/**
 * formatFinancial — centralized display formatting for all financial values.
 *
 * Conventions:
 * - Negatives always rendered with parentheses, never with a minus sign.
 * - currency_mm: dollar amounts in millions, 1 decimal place, e.g. $50.0M or ($50.0M)
 * - percentage_2dp: multiply by 100, 2 decimal places, e.g. 22.34% or (5.00%)
 * - multiple_2dp: 2 decimal places with 'x' suffix, e.g. 2.50x or (1.50x)
 * - basis_points: integer, e.g. 250bps
 */
export function formatFinancial(value: Decimal | string | number, type: FormatType): string {
  const d = value instanceof Decimal ? value : new Decimal(value)
  const isNeg = d.isNegative()
  const abs = d.abs()

  switch (type) {
    case 'currency_mm': {
      const mm = abs.dividedBy(1_000_000).toDecimalPlaces(1)
      const formatted = `$${mm.toFixed(1)}M`
      return isNeg ? `(${formatted})` : formatted
    }
    case 'percentage_2dp': {
      const pct = abs.times(100).toDecimalPlaces(2)
      const formatted = `${pct.toFixed(2)}%`
      return isNeg ? `(${formatted})` : formatted
    }
    case 'multiple_2dp': {
      const formatted = `${abs.toDecimalPlaces(2).toFixed(2)}x`
      return isNeg ? `(${formatted})` : formatted
    }
    case 'basis_points': {
      const formatted = `${abs.toDecimalPlaces(0).toFixed(0)}bps`
      return isNeg ? `(${formatted})` : formatted
    }
    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown FormatType: ${_exhaustive}`)
    }
  }
}
