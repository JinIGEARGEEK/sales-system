import { describe, it, expect } from 'vitest'
import { makeDeal } from '../factories'

describe('useDealMetrics', () => {
  it('picks the open deals and sums their value', () => {
    const deals = [
      makeDeal({ id: 1, status: 'open', value: 100 }),
      makeDeal({ id: 2, status: 'open', value: 200 }),
      makeDeal({ id: 3, status: 'won', value: 500 }),
      makeDeal({ id: 4, status: 'lost', value: 300 }),
    ]
    const metrics = useDealMetrics(() => deals)

    expect(metrics.openDeals.value.map(d => d.id)).toEqual([1, 2])
    expect(metrics.openValue.value).toBe(300)
  })
})
