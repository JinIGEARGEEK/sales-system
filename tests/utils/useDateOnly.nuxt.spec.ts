import { describe, it, expect } from 'vitest'

// A local-time "today" (the helpers read the LOCAL calendar date).
const today = new Date(2026, 8, 27, 23, 30)

describe('toDateOnly', () => {
  it('keeps just the YYYY-MM-DD prefix of the API\'s midnight-UTC timestamp', () => {
    expect(toDateOnly('2027-01-15T00:00:00Z')).toBe('2027-01-15')
    expect(toDateOnly('2027-01-15')).toBe('2027-01-15')
  })

  it('returns null for empty or unparseable values', () => {
    expect(toDateOnly(null)).toBeNull()
    expect(toDateOnly('')).toBeNull()
    expect(toDateOnly('soon')).toBeNull()
  })
})

describe('daysUntilDateOnly', () => {
  it('counts whole calendar days from today\'s local date, late in the day included', () => {
    expect(daysUntilDateOnly('2026-09-27', today)).toBe(0)
    expect(daysUntilDateOnly('2026-09-28', today)).toBe(1)
    expect(daysUntilDateOnly('2026-10-27', today)).toBe(30)
    expect(daysUntilDateOnly('2026-09-20', today)).toBe(-7)
  })

  it('crosses a year boundary', () => {
    expect(daysUntilDateOnly('2027-01-01', new Date(2026, 11, 31, 1))).toBe(1)
  })
})

describe('dateOnlyCountdown', () => {
  it('flags past dates as overdue and the next 30 days as soon', () => {
    expect(dateOnlyCountdown('2026-09-20T00:00:00Z', today)).toEqual({ days: -7, tone: 'overdue' })
    expect(dateOnlyCountdown('2026-09-27T00:00:00Z', today)).toEqual({ days: 0, tone: 'today' })
    expect(dateOnlyCountdown('2026-10-27', today)).toEqual({ days: 30, tone: 'soon' })
    expect(dateOnlyCountdown('2026-10-28', today)).toEqual({ days: 31, tone: 'later' })
  })

  it('returns null without a date', () => {
    expect(dateOnlyCountdown(null, today)).toBeNull()
  })

  it('maps tones to severity colours', () => {
    expect(countdownColor('overdue')).toBe('error')
    expect(countdownColor('soon')).toBe('warning')
    expect(countdownColor('later')).toBe('neutral')
  })
})

describe('dateOnlyToLocalNoon', () => {
  it('is local noon on that calendar day', () => {
    const date = dateOnlyToLocalNoon('2026-09-27')
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2026, 8, 27, 12, 0])
  })

  it('ignores a time suffix', () => {
    expect(dateOnlyToLocalNoon('2026-09-27T00:00:00Z').getDate()).toBe(27)
  })
})

describe('addDays', () => {
  it('adds calendar days across a month end, keeping the time of day', () => {
    const result = addDays(new Date(2026, 8, 29, 9, 15), 3)
    expect([result.getMonth(), result.getDate(), result.getHours(), result.getMinutes()]).toEqual([9, 2, 9, 15])
  })

  it('does not mutate the input, and accepts negative days', () => {
    const start = new Date(2026, 0, 1, 12)
    expect(addDays(start, -1).getDate()).toBe(31)
    expect(start.getDate()).toBe(1)
  })
})
