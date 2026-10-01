import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeDeal, makeQuote, apiResponse } from '../factories'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// A priced Quote with both discounts, VAT and WHT on — only the pre-VAT
// taxable amount should reach the Deal.
const quote = (overrides: Partial<Quote> = {}) => makeQuote({
  items: [{ description: 'Build', qty: 2, price: 50000, discount_percent: 10 }],
  discount_total: 5000,
  vat_enabled: true,
  wht_enabled: true,
  wht_rate: 3,
  ...overrides,
})

describe('quoteRevenueAmount', () => {
  it('is the taxable amount after both discounts, before VAT and WHT', () => {
    // 2 * 50,000 * 0.9 = 90,000, minus the 5,000 quote discount; VAT/WHT ignored.
    expect(quoteRevenueAmount(quote())).toBe(85000)
  })

  it('backs VAT out of a tax-inclusive quote: revenue is pre-VAT', () => {
    // 107,000 incl. VAT, no discounts -> 100,000 before VAT.
    expect(quoteRevenueAmount(quote({ items: [{ description: '', qty: 1, price: 107000 }], discount_total: 0, price_type: 'incl_tax' }))).toBe(100000)
    // VAT off: nothing to back out.
    expect(quoteRevenueAmount(quote({ items: [{ description: '', qty: 1, price: 107000 }], discount_total: 0, price_type: 'incl_tax', vat_enabled: false }))).toBe(107000)
  })

  it('rounds to 2 decimals', () => {
    expect(quoteRevenueAmount(quote({ items: [{ description: '', qty: 3, price: 33.333 }], discount_total: 0 }))).toBe(100)
  })
})

describe('useQuoteDealValueSync', () => {
  beforeEach(() => {
    useDealsStore().$reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('offers the pre-VAT amount when it differs from the deal value', () => {
    const { offer, pending } = useQuoteDealValueSync()
    offer(quote(), makeDeal({ id: 3, value: 100000 }))
    expect(pending.value).toEqual({ dealId: 3, from: 100000, to: 85000 })
  })

  it('skips the prompt when the amounts already match, or the quote has no priced lines', () => {
    const { offer, pending } = useQuoteDealValueSync()
    offer(quote(), makeDeal({ value: 85000 }))
    expect(pending.value).toBeNull()
    offer(quote({ items: [], discount_total: 0 }), makeDeal({ value: 1 }))
    expect(pending.value).toBeNull()
  })

  it('confirm resends the full current deal with only value changed', async () => {
    const deal = makeDeal({ id: 3, value: 100000, title: 'ERP', stage: 'Negotiation', probability: 60, channel: 'Website', expected_close_date: new Date('2026-12-01T00:00:00.000Z') })
    useDealsStore().items = [deal]
    const putSpy = vi.spyOn(useNuxtApp().$api, 'put').mockResolvedValue(apiResponse({ ...deal, value: 85000 }) as never)

    const { offer, confirm, pending } = useQuoteDealValueSync()
    offer(quote(), deal)
    await confirm()

    expect(putSpy).toHaveBeenCalledWith('/deals/3', expect.objectContaining({
      value: 85000,
      title: 'ERP',
      stage: 'Negotiation',
      probability: 60,
      channel: 'Website',
      company_id: 1,
      contact_id: 1,
      expected_close_date: deal.expected_close_date,
    }))
    expect(useDealsStore().items[0]!.value).toBe(85000)
    expect(pending.value).toBeNull()
  })
})
