import { describe, it, expect } from 'vitest'
import { formatThousands, parseThousandsInput, sanitizeThousandsInput } from '~/composables/utils/thousandsInput'

describe('sanitizeThousandsInput', () => {
  it('strips separators and stray characters', () => {
    expect(sanitizeThousandsInput('1,234,567')).toBe('1234567')
    expect(sanitizeThousandsInput('฿1,234.56')).toBe('1234.56')
    expect(sanitizeThousandsInput('abc')).toBe('')
  })

  it('keeps a trailing point or zero so a decimal can be typed mid-way', () => {
    expect(sanitizeThousandsInput('1,500.')).toBe('1500.')
    expect(sanitizeThousandsInput('1,500.0')).toBe('1500.0')
    expect(sanitizeThousandsInput('.')).toBe('.')
  })

  it('keeps only the first point and at most 2 fraction digits', () => {
    expect(sanitizeThousandsInput('1,234.567')).toBe('1234.56')
    expect(sanitizeThousandsInput('1.2.3')).toBe('1.23')
  })

  it('drops leading zeros but keeps a single zero before the point', () => {
    expect(sanitizeThousandsInput('007')).toBe('7')
    expect(sanitizeThousandsInput('00.5')).toBe('0.5')
    expect(sanitizeThousandsInput('0')).toBe('0')
  })
})

describe('whole-number mode (fractionDigits 0)', () => {
  it('drops a decimal point and everything after it', () => {
    expect(sanitizeThousandsInput('1,234.56', 0)).toBe('1234')
    expect(sanitizeThousandsInput('1500.', 0)).toBe('1500')
    expect(formatThousands('1234567.8', 0)).toBe('1,234,567')
    expect(formatThousands(1500.5, 0)).toBe('1,501')
  })
})

describe('parseThousandsInput', () => {
  it('returns a number, or null when nothing was typed', () => {
    expect(parseThousandsInput('1500.5')).toBe(1500.5)
    expect(parseThousandsInput('1500.')).toBe(1500)
    expect(parseThousandsInput('.5')).toBe(0.5)
    expect(parseThousandsInput('')).toBeNull()
    expect(parseThousandsInput('.')).toBeNull()
  })
})

describe('formatThousands', () => {
  it('formats a model number with separators and up to 2 decimals', () => {
    expect(formatThousands(3000000)).toBe('3,000,000')
    expect(formatThousands(1500.5)).toBe('1,500.5')
    expect(formatThousands(1234.567)).toBe('1,234.57')
    expect(formatThousands(0)).toBe('0')
  })

  it('formats a string being typed without losing its trailing point or zeros', () => {
    expect(formatThousands('1500.')).toBe('1,500.')
    expect(formatThousands('1500.50')).toBe('1,500.50')
    expect(formatThousands('1,234.56')).toBe('1,234.56')
    expect(formatThousands('1234567')).toBe('1,234,567')
  })

  it('returns an empty string for empty values', () => {
    expect(formatThousands('')).toBe('')
    expect(formatThousands(null)).toBe('')
    expect(formatThousands(undefined)).toBe('')
    expect(formatThousands(Number.NaN)).toBe('')
  })

  it('round-trips an edited value without shifting the decimal', () => {
    const typed = sanitizeThousandsInput(formatThousands(1500.5))
    expect(parseThousandsInput(typed)).toBe(1500.5)
  })
})
