import { describe, it, expect } from 'vitest'

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

describe('splitByPercentage', () => {
  it('splits 30/40/30 and carries each row\'s label as the note', () => {
    const rows = splitByPercentage(1000000, [
      { label: 'Deposit', percent: 30, due_date: d('2026-10-01') },
      { label: ' Delivery ', percent: 40, due_date: d('2026-11-01') },
      { label: 'Final', percent: 30, due_date: d('2026-12-01') },
    ])
    expect(rows.map(r => r.amount)).toEqual([300000, 400000, 300000])
    expect(rows.map(r => r.note)).toEqual(['Deposit', 'Delivery', 'Final'])
    expect(rows[1]!.due_date).toEqual(d('2026-11-01'))
  })

  it('rounds to 2 decimals and puts the remainder on the last row', () => {
    const rows = splitByPercentage(100, [
      { label: '', percent: 33.33, due_date: d('2026-10-01') },
      { label: '', percent: 33.33, due_date: d('2026-10-01') },
      { label: '', percent: 33.34, due_date: d('2026-10-01') },
    ])
    expect(rows.map(r => r.amount)).toEqual([33.33, 33.33, 33.34])

    const odd = splitByPercentage(1000.01, [
      { label: '', percent: 30, due_date: d('2026-10-01') },
      { label: '', percent: 40, due_date: d('2026-10-01') },
      { label: '', percent: 30, due_date: d('2026-10-01') },
    ])
    // 300.003 -> 300, 400.004 -> 400, last row takes the rest.
    expect(odd.map(r => r.amount)).toEqual([300, 400, 300.01])
    expect(odd.reduce((sum, r) => sum + r.amount, 0)).toBeCloseTo(1000.01, 10)
  })

  it('never makes a row negative on a tiny total', () => {
    const rows = splitByPercentage(0.05, [
      { label: '', percent: 50, due_date: d('2026-10-01') },
      { label: '', percent: 25, due_date: d('2026-10-01') },
      { label: '', percent: 25, due_date: d('2026-10-01') },
    ])
    expect(rows.map(r => r.amount)).toEqual([0.02, 0.01, 0.02])
    expect(rows.every(r => r.amount >= 0)).toBe(true)
  })

  it('returns nothing for a zero total or no rows', () => {
    expect(splitByPercentage(0, [{ label: '', percent: 100, due_date: d('2026-10-01') }])).toEqual([])
    expect(splitByPercentage(100, [])).toEqual([])
  })
})

describe('isPercentageSplitValid / percentTotal', () => {
  it('requires exactly 100% with every row above 0', () => {
    expect(isPercentageSplitValid([{ percent: 30 }, { percent: 40 }, { percent: 30 }])).toBe(true)
    expect(isPercentageSplitValid([{ percent: 30 }, { percent: 40 }, { percent: 20 }])).toBe(false)
    expect(isPercentageSplitValid([{ percent: 100 }, { percent: 0 }])).toBe(false)
    expect(isPercentageSplitValid([])).toBe(false)
  })

  it('ignores float noise when summing', () => {
    expect(percentTotal([{ percent: 33.3 }, { percent: 33.3 }, { percent: 33.4 }])).toBe(100)
    expect(isPercentageSplitValid([{ percent: 33.3 }, { percent: 33.3 }, { percent: 33.4 }])).toBe(true)
  })
})

describe('splitEqually', () => {
  it('keeps the equal split behaviour: monthly steps, remainder on the last row', () => {
    const rows = splitEqually(100, 3, d('2026-01-15'), 1)
    expect(rows.map(r => r.amount)).toEqual([33.33, 33.33, 33.34])
    expect(rows.map(r => r.due_date.getUTCMonth())).toEqual([0, 1, 2])
  })

  it('rounds every row but the last down, so the last never goes negative', () => {
    // Rounding 0.10 / 15 up (0.01 each) used to leave the last row at -0.04.
    const tiny = splitEqually(0.1, 15, d('2026-01-15'), 1)
    expect(tiny.slice(0, 14).every(r => r.amount === 0)).toBe(true)
    expect(tiny[14]!.amount).toBe(0.1)
    expect(hasEmptyInstallment(tiny)).toBe(true)

    const rows = splitEqually(200, 3, d('2026-01-15'), 1)
    expect(rows.map(r => r.amount)).toEqual([66.66, 66.66, 66.68])
    expect(hasEmptyInstallment(rows)).toBe(false)
  })

  it('clamps a month-end start to each month\'s last day, always stepping from the start', () => {
    // Local noon on Jan 31: Feb 28, Mar 31 (not Mar 3 / Mar 28), Apr 30.
    const rows = splitEqually(400, 4, new Date(2026, 0, 31, 12), 1)
    expect(rows.map(r => [r.due_date.getMonth(), r.due_date.getDate()])).toEqual([[0, 31], [1, 28], [2, 31], [3, 30]])
  })

  it('clamps with a multi-month interval and in a leap year', () => {
    const rows = splitEqually(300, 3, new Date(2027, 11, 31, 12), 2)
    // Dec 31 2027 -> Feb 29 2028 (leap) -> Apr 30 2028.
    expect(rows.map(r => [r.due_date.getFullYear(), r.due_date.getMonth(), r.due_date.getDate()])).toEqual([[2027, 11, 31], [2028, 1, 29], [2028, 3, 30]])
  })
})
