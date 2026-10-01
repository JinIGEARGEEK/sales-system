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

describe('useQuoteDealValueRefresh', () => {
  beforeEach(() => {
    useDealsStore().$reset()
    useToast().clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('re-reads the deal after a quote is accepted, never writing the value itself', async () => {
    const deal = makeDeal({ id: 3, value: 100000 })
    useDealsStore().items = [deal]
    const synced = { ...deal, value: 85000, value_quote_id: 12, value_quote_number: 'Q-2026-012' }
    const getSpy = vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue(apiResponse(synced) as never)
    const putSpy = vi.spyOn(useNuxtApp().$api, 'put')

    const { afterQuoteStatusChange } = useQuoteDealValueRefresh()
    await afterQuoteStatusChange(3, 'sent', 'accepted')

    expect(getSpy).toHaveBeenCalledWith('/deals/3', expect.anything())
    expect(putSpy).not.toHaveBeenCalled()
    expect(useDealsStore().items[0]).toMatchObject({ value: 85000, value_quote_id: 12 })
    await nextTick()
    expect(useToast().toasts.value.map(toast => toast.title)).toEqual(['crm.deals.detail.dealValueSyncedFromQuote'])
  })

  it('also re-reads when a quote leaves Accepted, without a toast when the value is unchanged', async () => {
    const deal = makeDeal({ id: 3, value: 85000, value_quote_id: 12, value_quote_number: 'Q-2026-012' })
    useDealsStore().items = [deal]
    const getSpy = vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue(apiResponse({ ...deal, value_quote_id: null, value_quote_number: null }) as never)

    const { afterQuoteStatusChange } = useQuoteDealValueRefresh()
    await afterQuoteStatusChange(3, 'accepted', 'rejected')

    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(useDealsStore().items[0]!.value_quote_id).toBeNull()
    await nextTick()
    expect(useToast().toasts.value).toEqual([])
  })

  it('skips status changes that never touch Accepted', async () => {
    const getSpy = vi.spyOn(useNuxtApp().$api, 'get')
    const { afterQuoteStatusChange } = useQuoteDealValueRefresh()
    await afterQuoteStatusChange(3, 'draft', 'sent')
    await afterQuoteStatusChange(3, 'accepted', 'accepted')
    expect(getSpy).not.toHaveBeenCalled()
  })
})
