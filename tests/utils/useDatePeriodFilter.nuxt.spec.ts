import { describe, it, expect } from 'vitest'
import { makeDeal } from '../factories'

const PRESETS = ['all', 'month', 'quarter', 'year', 'last6', 'last12']

describe('useDatePeriodFilter', () => {
  // Anchored at 00:30 local on 1 Aug — the UTC date (31 Jul in Bangkok) would
  // put every preset in the wrong month if the range were built off it.
  const anchor = new Date(2026, 7, 1, 0, 30)
  const deals = [makeDeal({ created_at: new Date(2026, 1, 10) }), makeDeal({ id: 2, created_at: anchor })]

  it('builds each preset from local date parts, anchored to the latest deal date', () => {
    const { dateRange, applyPeriodPreset } = useDatePeriodFilter(() => deals, PRESETS)

    applyPeriodPreset('month')
    expect(dateRange.value).toEqual({ start: '2026-08-01', end: '2026-08-01' })
    applyPeriodPreset('quarter')
    expect(dateRange.value).toEqual({ start: '2026-07-01', end: '2026-08-01' })
    applyPeriodPreset('year')
    expect(dateRange.value).toEqual({ start: '2026-01-01', end: '2026-08-01' })
    applyPeriodPreset('last6')
    expect(dateRange.value).toEqual({ start: '2026-03-01', end: '2026-08-01' })
    applyPeriodPreset('last12')
    expect(dateRange.value).toEqual({ start: '2025-09-01', end: '2026-08-01' })
    applyPeriodPreset('all')
    expect(dateRange.value).toBeNull()
  })

  it('derives the active preset from the range, and none for a hand-edited one', () => {
    const { dateRange, activePreset, applyPeriodPreset } = useDatePeriodFilter(() => deals, PRESETS)

    expect(activePreset.value).toBe('all')
    applyPeriodPreset('quarter')
    expect(activePreset.value).toBe('quarter')
    dateRange.value = { start: '2026-07-02', end: '2026-08-01' }
    expect(activePreset.value).toBeNull()
  })
})
