import { describe, it, expect } from 'vitest'
import {
  cardMatchesHighlight,
  conversionPercent,
  highlightCounts,
  daysInStage,
  isStaleCard,
  movedInPeriod,
  overviewPeriodLength,
  overviewPeriodRange,
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

  describe('highlight', () => {
    const range = { date_from: '2026-09-21', date_to: '2026-09-23' }
    const staleCard = { stage_entered_at: new Date(2026, 8, 1).toISOString(), created_at: new Date(2026, 7, 1).toISOString() }
    const movedCard = { stage_entered_at: new Date(2026, 8, 22).toISOString(), created_at: new Date(2026, 8, 1).toISOString() }
    const open = { terminal: false }
    const terminal = { terminal: true }

    it('"all" matches everything; "stale"/"moved" match only open-lane cards that qualify', () => {
      expect(cardMatchesHighlight(staleCard, terminal, 'all', range, NOW)).toBe(true)
      expect(cardMatchesHighlight(staleCard, open, 'stale', range, NOW)).toBe(true)
      expect(cardMatchesHighlight(movedCard, open, 'stale', range, NOW)).toBe(false)
      expect(cardMatchesHighlight(movedCard, open, 'moved', range, NOW)).toBe(true)
      expect(cardMatchesHighlight(movedCard, terminal, 'moved', range, NOW)).toBe(false)
    })

    it('highlightCounts totals stale/moved open cards and the stale Deal value', () => {
      const card = (over: Partial<PipelineOverviewCard>): PipelineOverviewCard => ({
        id: 1, name: 'x', company_id: null, company_name: '', assigned_to: null, source: '', value: 0,
        probability: null, lost_reason: null, from_prospect: false, stage_entered_at: null, created_at: '', ...over,
      })
      const lane = (terminal: boolean, cards: PipelineOverviewCard[]): PipelineOverviewLane => ({ name: 'L', kind: terminal ? 'won' : 'open', terminal, count: cards.length, value: 0, cards })
      const zones: PipelineOverviewZone[] = [
        { key: 'lead', lanes: [lane(false, [card(staleCard), card(movedCard)])] },
        { key: 'deal', lanes: [lane(false, [card({ ...staleCard, value: 500 })]), lane(true, [card({ ...staleCard, value: 900 })])] },
      ]
      expect(highlightCounts(zones, range, NOW)).toEqual({ stale: 2, moved: 1, staleDeals: 1, staleDealValue: 500 })
    })
  })

  it('zoneOpenTotals sums open lanes only', () => {
    const lane = (terminal: boolean, count: number, value: number): PipelineOverviewLane => ({ name: String(count), kind: terminal ? 'won' : 'open', terminal, count, value, cards: [] })
    const zone: PipelineOverviewZone = { key: 'deal', lanes: [lane(false, 2, 100), lane(false, 3, 50), lane(true, 9, 999)] }
    expect(zoneOpenTotals(zone)).toEqual({ count: 5, value: 150 })
  })
})
