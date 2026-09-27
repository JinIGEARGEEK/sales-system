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
})
