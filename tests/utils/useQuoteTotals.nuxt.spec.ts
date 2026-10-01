import { describe, it, expect } from 'vitest'
import { makeQuote } from '../factories'

describe('useQuoteTotals', () => {
  it('sums line items with no discounts, VAT, or WHT', () => {
    const totals = useQuoteTotals([{ qty: 2, price: 100 }, { qty: 1, price: 50 }], 0, 'excl_tax', false, false, 0)

    expect(totals.subtotal).toBe(250)
    expect(totals.taxableAmount).toBe(250)
    expect(totals.vat).toBe(0)
    expect(totals.wht).toBe(0)
    expect(totals.grandTotal).toBe(250)
  })

  it('applies a per-line discount_percent before summing the subtotal', () => {
    const totals = useQuoteTotals([{ qty: 1, price: 200, discount_percent: 10 }], 0, 'excl_tax', false, false, 0)

    // 200 * (1 - 0.10) = 180
    expect(totals.subtotal).toBe(180)
    expect(totals.grandTotal).toBe(180)
  })

  it('subtracts an order-level discountTotal before computing VAT/WHT', () => {
    const totals = useQuoteTotals([{ qty: 1, price: 1000 }], 100, 'excl_tax', false, false, 0)

    expect(totals.subtotal).toBe(1000)
    expect(totals.discountTotal).toBe(100)
    expect(totals.taxableAmount).toBe(900)
  })

  // Same matrix as the API's TestComputeQuoteTotals_PriceTypeByVat: 11,770
  // of items less a 1,070 discount = 10,700 net, 3% WHT throughout (always on
  // the pre-VAT amount). receivable = taxable + VAT (dealReceivable's figure).
  it.each([
    ['excl_tax', true, 10700, 749, 321, 11128, 11449],
    ['excl_tax', false, 10700, 0, 321, 10379, 10700],
    // Prices already include VAT: backed out, not added a second time.
    ['incl_tax', true, 10000, 700, 300, 10400, 10700],
    ['incl_tax', false, 10700, 0, 321, 10379, 10700],
  ] as const)('%s with VAT %s', (priceType, vatEnabled, taxable, vat, wht, grandTotal, receivable) => {
    const totals = useQuoteTotals([{ qty: 1, price: 11770 }], 1070, priceType, vatEnabled, true, 3)

    expect(totals.subtotal).toBe(11770)
    expect(totals.taxableAmount).toBe(taxable)
    expect(totals.vat).toBe(vat)
    expect(totals.wht).toBe(wht)
    expect(totals.grandTotal).toBe(grandTotal)
    expect(roundSatang(totals.taxableAmount + totals.vat)).toBe(receivable)
  })

  it('backs VAT out of a tax-inclusive price to the satang, adding back up exactly', () => {
    const totals = useQuoteTotals([{ qty: 1, price: 1000 }], 0, 'incl_tax', true, false, 0)

    // 1000 / 1.07 = 934.5794...
    expect(totals.taxableAmount).toBe(934.58)
    expect(totals.vat).toBe(65.42)
    expect(totals.grandTotal).toBe(1000)
  })

  // Same cases as the API's TestComputeQuoteTotals_PartsAddUpToTheSatang —
  // unrounded, three lines of 333.333 summed to 999.999 and the excl_tax
  // grand total showed 1,040.00 under parts adding up to 1,039.99.
  it('rounds every part to satang so the shown lines add up to the grand total', () => {
    const items = [{ qty: 1, price: 333.333 }, { qty: 1, price: 333.333 }, { qty: 1, price: 333.333 }]

    const excl = useQuoteTotals(items, 0, 'excl_tax', true, true, 3)
    expect(excl).toEqual({ subtotal: 999.99, discountTotal: 0, taxableAmount: 999.99, vat: 70, wht: 30, grandTotal: 1039.99 })

    const incl = useQuoteTotals(items, 0, 'incl_tax', true, true, 3)
    expect(incl).toEqual({ subtotal: 999.99, discountTotal: 0, taxableAmount: 934.57, vat: 65.42, wht: 28.04, grandTotal: 971.95 })

    // 3 x 10.01 less 12.5% = 26.27625 -> 26.28 per line; less 0.005 rounds back up.
    const disc = useQuoteTotals([{ qty: 3, price: 10.01, discount_percent: 12.5 }], 0.005, 'excl_tax', false, false, 0)
    expect(disc.subtotal).toBe(26.28)
    expect(disc.taxableAmount).toBe(26.28)
    expect(disc.grandTotal).toBe(26.28)
  })

  it('returns all zeros for an empty item list', () => {
    const totals = useQuoteTotals([], 0, 'excl_tax', true, true, 3)

    expect(totals.subtotal).toBe(0)
    expect(totals.taxableAmount).toBe(0)
    expect(totals.vat).toBe(0)
    expect(totals.wht).toBe(0)
    expect(totals.grandTotal).toBe(0)
  })
})

describe('quoteLineTotal / quoteTotalsOf', () => {
  it('rounds a line to satang', () => {
    expect(quoteLineTotal({ qty: 3, price: 33.333 })).toBe(100)
    expect(quoteLineTotal({ qty: 1, price: 999, discount_percent: 33.3 })).toBe(666.33)
  })

  it('reads a loaded Quote\'s own price type and tax settings', () => {
    const quote = makeQuote({ items: [{ description: 'x', qty: 1, price: 10700 }], price_type: 'incl_tax', vat_enabled: true, wht_enabled: true, wht_rate: 3 })
    expect(quoteTotalsOf(quote)).toMatchObject({ taxableAmount: 10000, vat: 700, wht: 300, grandTotal: 10400 })
  })
})
