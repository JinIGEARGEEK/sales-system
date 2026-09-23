import { describe, it, expect } from 'vitest'
import {
  conversionPercent,
  daysInStage,
  isStaleCard,
  movedInPeriod,
  overviewPeriodLength,
  overviewPeriodRange,
} from '~/composables/utils/usePipelineOverview'

// Wednesday 23 Sep 2026, mid-afternoon local time.
const NOW = new Date(2026, 8, 23, 15, 30)

describe('usePipelineOverview', () => {
  describe('overviewPeriodRange', () => {
    it('"week" runs from this Monday to today', () => {
      expect(overviewPeriodRange('week', NOW)).toEqual({ date_from: '2026-09-21', date_to: '2026-09-23' })
    })

    it('"lastWeek" is the full Monday–Sunday before this week', () => {
      expect(overviewPeriodRange('lastWeek', NOW)).toEqual({ date_from: '2026-09-14', date_to: '2026-09-20' })
    })

    it('"month" and "quarter" start on the 1st of the month / quarter', () => {
      expect(overviewPeriodRange('month', NOW)).toEqual({ date_from: '2026-09-01', date_to: '2026-09-23' })
      expect(overviewPeriodRange('quarter', NOW)).toEqual({ date_from: '2026-07-01', date_to: '2026-09-23' })
    })

    it('treats Sunday as the last day of the week, not the first', () => {
      const sunday = new Date(2026, 8, 27, 10)
      expect(overviewPeriodRange('week', sunday)).toEqual({ date_from: '2026-09-21', date_to: '2026-09-27' })
    })
  })

  it('overviewPeriodLength counts both ends', () => {
    expect(overviewPeriodLength({ date_from: '2026-09-21', date_to: '2026-09-23' })).toBe(3)
    expect(overviewPeriodLength({ date_from: '2026-09-14', date_to: '2026-09-20' })).toBe(7)
  })

  describe('daysInStage / isStaleCard', () => {
    it('counts calendar days since the card entered its lane', () => {
      const card = { stage_entered_at: new Date(2026, 8, 20, 23, 0).toISOString(), created_at: new Date(2026, 8, 1).toISOString() }
      expect(daysInStage(card, NOW)).toBe(3)
      expect(isStaleCard(card, NOW)).toBe(false)
    })

    it('falls back to created_at when stage_entered_at is missing, and flags over 14 days as stale', () => {
      const card = { stage_entered_at: null, created_at: new Date(2026, 8, 1).toISOString() }
      expect(daysInStage(card, NOW)).toBe(22)
      expect(isStaleCard(card, NOW)).toBe(true)
    })
  })

  describe('movedInPeriod', () => {
    const range = { date_from: '2026-09-21', date_to: '2026-09-23' }

    it('is true for a lane change inside the period', () => {
      expect(movedInPeriod({ created_at: new Date(2026, 8, 1).toISOString(), stage_entered_at: new Date(2026, 8, 22).toISOString() }, range)).toBe(true)
    })

    it('is false for a record created in the period that never moved', () => {
      const created = new Date(2026, 8, 22, 9, 0, 0)
      expect(movedInPeriod({ created_at: created.toISOString(), stage_entered_at: new Date(created.getTime() + 5).toISOString() }, range)).toBe(false)
    })

    it('includes the whole last day and excludes before the first', () => {
      expect(movedInPeriod({ created_at: new Date(2026, 8, 1).toISOString(), stage_entered_at: new Date(2026, 8, 23, 23, 59).toISOString() }, range)).toBe(true)
      expect(movedInPeriod({ created_at: new Date(2026, 8, 1).toISOString(), stage_entered_at: new Date(2026, 8, 20, 23, 59).toISOString() }, range)).toBe(false)
    })
  })

  it('conversionPercent rounds, and returns null with nothing to convert from', () => {
    expect(conversionPercent(3, 1)).toBe(33)
    expect(conversionPercent(0, 2)).toBeNull()
  })
})
