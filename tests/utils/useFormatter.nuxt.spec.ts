import { describe, it, expect } from 'vitest'

describe('useFormatter', () => {
  const { phoneFormat, priceFormat, numberFormat, severityColor, parseTags, toDateInputValue } = useFormatter()

  describe('phoneFormat', () => {
    it('formats a plain 10-digit mobile number as xxx-xxx-xxxx', () => {
      expect(phoneFormat('0832759760')).toBe('083-275-9760')
    })

    it('normalizes an already-spaced 10-digit number to the same dashed form', () => {
      expect(phoneFormat('083 869 8659')).toBe('083-869-8659')
    })

    it('normalizes an already-dashed 10-digit number to the same dashed form', () => {
      expect(phoneFormat('063-126-9999')).toBe('063-126-9999')
    })

    it('formats a 9-digit landline number as xx-xxx-xxxx', () => {
      expect(phoneFormat('021234567')).toBe('02-123-4567')
    })

    it('returns the original value unchanged when digit count matches neither format', () => {
      expect(phoneFormat('12345')).toBe('12345')
    })
  })

  describe('priceFormat', () => {
    it('formats a number with thousands separators and 2 decimals', () => {
      expect(priceFormat(1234.5)).toBe('1,234.50')
    })
  })

  describe('numberFormat', () => {
    it('formats a whole number with thousands separators and no decimals', () => {
      expect(numberFormat(1234567)).toBe('1,234,567')
    })
  })

  describe('severityColor', () => {
    it('returns neutral below the warning threshold', () => {
      expect(severityColor(1, 5, 10)).toBe('neutral')
    })

    it('returns warning at/above warnAt but below criticalAt', () => {
      expect(severityColor(5, 5, 10)).toBe('warning')
      expect(severityColor(9, 5, 10)).toBe('warning')
    })

    it('returns error at/above criticalAt', () => {
      expect(severityColor(10, 5, 10)).toBe('error')
    })
  })

  describe('parseTags', () => {
    it('splits, trims, and drops empty entries from a comma-separated string', () => {
      expect(parseTags('Tier 1, Priority,  , VIP,')).toEqual(['Tier 1', 'Priority', 'VIP'])
    })

    it('returns an empty array for an empty string', () => {
      expect(parseTags('')).toEqual([])
    })
  })

  describe('toDateInputValue', () => {
    it('converts a Date to a YYYY-MM-DD string', () => {
      expect(toDateInputValue(new Date('2026-08-25T10:30:00.000Z'))).toBe('2026-08-25')
    })
  })
})
