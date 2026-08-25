import { describe, it, expect } from 'vitest'

// useDealMetrics only reads status/value/expected_close_date/created_at — the
// other Deal fields are irrelevant here, so this stubs just those.
const makeDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 1,
  company_id: 1,
  contact_id: 1,
  title: 'Deal',
  value: 0,
  stage: 'New',
  status: 'open',
  expected_close_date: null,
  assigned_to: null,
  channel: 'Referral',
  business_unit: null,
  business_unit_item: null,
  lead_id: null,
  probability: null,
  lost_reason: null,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
} as Deal)

describe('useDealMetrics', () => {
  it('buckets deals by status and sums open/won values', () => {
    const deals = [
      makeDeal({ id: 1, status: 'open', value: 100 }),
      makeDeal({ id: 2, status: 'open', value: 200 }),
      makeDeal({ id: 3, status: 'won', value: 500 }),
      makeDeal({ id: 4, status: 'lost', value: 300 }),
    ]
    const metrics = useDealMetrics(() => deals)

    expect(metrics.openDeals.value.map(d => d.id)).toEqual([1, 2])
    expect(metrics.wonDeals.value.map(d => d.id)).toEqual([3])
    expect(metrics.lostDeals.value.map(d => d.id)).toEqual([4])
    expect(metrics.openValue.value).toBe(300)
    expect(metrics.wonValue.value).toBe(500)
  })

  it('computes winRate as a rounded percentage of closed (won + lost) deals', () => {
    const deals = [
      makeDeal({ status: 'won' }),
      makeDeal({ status: 'won' }),
      makeDeal({ status: 'lost' }),
    ]
    const metrics = useDealMetrics(() => deals)

    // 2/3 -> 66.67 -> rounds to 67
    expect(metrics.winRate.value).toBe(67)
  })

  it('winRate is 0 when there are no closed deals yet', () => {
    const deals = [makeDeal({ status: 'open' })]
    const metrics = useDealMetrics(() => deals)

    expect(metrics.winRate.value).toBe(0)
  })

  it('computes avgDealSize as wonValue / count of won deals', () => {
    const deals = [
      makeDeal({ status: 'won', value: 100 }),
      makeDeal({ status: 'won', value: 300 }),
    ]
    const metrics = useDealMetrics(() => deals)

    expect(metrics.avgDealSize.value).toBe(200)
  })

  it('avgDealSize is 0 when there are no won deals', () => {
    const metrics = useDealMetrics(() => [makeDeal({ status: 'open' })])

    expect(metrics.avgDealSize.value).toBe(0)
  })

  it('computes avgSalesCycleDays from created_at to expected_close_date for won deals only', () => {
    const deals = [
      makeDeal({
        status: 'won',
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        expected_close_date: new Date('2026-01-11T00:00:00.000Z'), // 10 days
      }),
      makeDeal({
        status: 'won',
        created_at: new Date('2026-02-01T00:00:00.000Z'),
        expected_close_date: new Date('2026-02-21T00:00:00.000Z'), // 20 days
      }),
      // Ignored: not won.
      makeDeal({
        status: 'open',
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        expected_close_date: new Date('2027-01-01T00:00:00.000Z'),
      }),
    ]
    const metrics = useDealMetrics(() => deals)

    expect(metrics.avgSalesCycleDays.value).toBe(15)
  })

  it('avgSalesCycleDays is 0 when no won deal has an expected_close_date', () => {
    const deals = [makeDeal({ status: 'won', expected_close_date: null })]
    const metrics = useDealMetrics(() => deals)

    expect(metrics.avgSalesCycleDays.value).toBe(0)
  })
})
