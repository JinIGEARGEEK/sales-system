import { describe, it, expect } from 'vitest'
import {
  cardMatchesHighlight,
  conversionPercent,
  isOtherLane,
  overviewCardStage,
  overviewLaneLabel,
  daysInStage,
  isStaleCard,
  movedInPeriod,
  overviewPeriodLength,
  overviewPeriodRange,
  staleDaysRange,
  zoneOpenTotals,
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
      expect(isStaleCard(card, 14, NOW)).toBe(false)
    })

    it('falls back to created_at when stage_entered_at is missing, and flags over 14 days as stale', () => {
      const card = { stage_entered_at: null, created_at: new Date(2026, 8, 1).toISOString() }
      expect(daysInStage(card, NOW)).toBe(22)
      expect(isStaleCard(card, 14, NOW)).toBe(true)
      expect(isStaleCard(card, 30, NOW), 'a stage with a longer limit isn\'t stale yet').toBe(false)
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

  describe('highlight', () => {
    const range = { date_from: '2026-09-21', date_to: '2026-09-23' }
    const staleCard = { stage_entered_at: new Date(2026, 8, 1).toISOString(), created_at: new Date(2026, 7, 1).toISOString(), direction: '' as const }
    const movedCard = { stage_entered_at: new Date(2026, 8, 22).toISOString(), created_at: new Date(2026, 8, 1).toISOString(), direction: 'forward' as const }
    const slippedCard = { ...movedCard, direction: 'backward' as const }
    const open = { terminal: false, stale_days: 14 }
    const terminal = { terminal: true, stale_days: 0 }

    it('"all" matches everything; the rest match only open-lane cards that qualify', () => {
      expect(cardMatchesHighlight(staleCard, terminal, 'all', range, NOW)).toBe(true)
      expect(cardMatchesHighlight(staleCard, open, 'stale', range, NOW)).toBe(true)
      expect(cardMatchesHighlight(movedCard, open, 'stale', range, NOW)).toBe(false)
      expect(cardMatchesHighlight(movedCard, open, 'moved', range, NOW)).toBe(true)
      expect(cardMatchesHighlight(movedCard, terminal, 'moved', range, NOW)).toBe(false)
    })

    it('"stale" uses the lane\'s own threshold', () => {
      expect(cardMatchesHighlight(staleCard, { terminal: false, stale_days: 60 }, 'stale', range, NOW)).toBe(false)
    })

    it('"slipped" matches only backward moves inside the period', () => {
      expect(cardMatchesHighlight(slippedCard, open, 'slipped', range, NOW)).toBe(true)
      expect(cardMatchesHighlight(slippedCard, open, 'moved', range, NOW), 'a slip is still a move').toBe(true)
      expect(cardMatchesHighlight(movedCard, open, 'slipped', range, NOW)).toBe(false)
      expect(cardMatchesHighlight({ ...staleCard, direction: 'backward' }, open, 'slipped', range, NOW), 'outside the period').toBe(false)
    })
  })

  it('zoneOpenTotals sums open lanes only', () => {
    const lane = (terminal: boolean, count: number, value: number): PipelineOverviewLane => ({ name: String(count), kind: terminal ? 'won' : 'open', terminal, stale_days: terminal ? 0 : 14, count, value, cards: [] })
    const zone: PipelineOverviewZone = { key: 'deal', lanes: [lane(false, 2, 100), lane(false, 3, 50), lane(true, 9, 999)] }
    expect(zoneOpenTotals(zone)).toEqual({ count: 5, value: 150 })
  })

  describe('staleDaysRange', () => {
    const lane = (staleDays: number, terminal = false): PipelineOverviewLane => ({ name: String(staleDays), kind: terminal ? 'won' : 'open', terminal, stale_days: staleDays, count: 0, value: 0, cards: [] })

    it('is null with no open lanes, so the caller can quote the default', () => {
      expect(staleDaysRange([])).toBeNull()
      expect(staleDaysRange([{ lanes: [lane(0, true)] }])).toBeNull()
    })

    it('collapses to one value when every open lane shares it, ignoring terminal lanes', () => {
      expect(staleDaysRange([{ lanes: [lane(14), lane(14), lane(0, true)] }, { lanes: [lane(14)] }])).toEqual({ min: 14, max: 14 })
    })

    it('spans every zone, treating a 0 threshold as the 14-day default', () => {
      expect(staleDaysRange([{ lanes: [lane(7), lane(0)] }, { lanes: [lane(30)] }])).toEqual({ min: 7, max: 30 })
    })
  })

  describe('"other" lane labels', () => {
    const t = (key: string) => key
    const other = { kind: 'other' as const, name: '' }
    const open = { kind: 'open' as const, name: 'Qualified' }

    it('names the catch-all lane, and every other lane by its stage', () => {
      expect(isOtherLane(other)).toBe(true)
      expect(isOtherLane(open)).toBe(false)
      expect(overviewLaneLabel(other, t)).toBe('crm.overviewPipeline.otherLane')
      expect(overviewLaneLabel(open, t)).toBe('Qualified')
    })

    it("gives a card its raw stage in the catch-all lane, marking a blank one", () => {
      expect(overviewCardStage({ stage: 'Warm Hold' }, other, t)).toBe('Warm Hold')
      expect(overviewCardStage({ stage: '' }, other, t)).toBe('crm.overviewPipeline.card.noStage')
      expect(overviewCardStage({ stage: 'ignored' }, open, t)).toBe('Qualified')
    })
  })
})
