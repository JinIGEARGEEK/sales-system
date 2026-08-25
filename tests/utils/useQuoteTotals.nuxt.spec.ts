import { describe, it, expect } from 'vitest'

describe('useQuoteTotals', () => {
  it('sums line items with no discounts, VAT, or WHT', () => {
    const totals = useQuoteTotals(
      [{ qty: 2, price: 100 }, { qty: 1, price: 50 }],
      0,
      false,
      false,
      0,
    )

    expect(totals.subtotal).toBe(250)
    expect(totals.taxableAmount).toBe(250)
    expect(totals.vat).toBe(0)
    expect(totals.wht).toBe(0)
    expect(totals.grandTotal).toBe(250)
  })

  it('applies a per-line discount_percent before summing the subtotal', () => {
    const totals = useQuoteTotals(
      [{ qty: 1, price: 200, discount_percent: 10 }],
      0,
      false,
      false,
      0,
    )

    // 200 * (1 - 0.10) = 180
    expect(totals.subtotal).toBe(180)
    expect(totals.grandTotal).toBe(180)
  })

  it('subtracts an order-level discountTotal before computing VAT/WHT', () => {
    const totals = useQuoteTotals(
      [{ qty: 1, price: 1000 }],
      100,
      false,
      false,
      0,
    )

    expect(totals.subtotal).toBe(1000)
    expect(totals.discountTotal).toBe(100)
    expect(totals.taxableAmount).toBe(900)
  })

  it('applies 7% VAT to the taxable amount when vatEnabled is true', () => {
    const totals = useQuoteTotals(
      [{ qty: 1, price: 1000 }],
      0,
      true,
      false,
      0,
    )

    expect(totals.vat).toBeCloseTo(70)
    expect(totals.grandTotal).toBeCloseTo(1070)
  })

  it('applies whtRate% WHT to the taxable amount when whtEnabled is true, subtracted from the grand total', () => {
    const totals = useQuoteTotals(
      [{ qty: 1, price: 1000 }],
      0,
      false,
      true,
      3,
    )

    expect(totals.wht).toBeCloseTo(30)
    expect(totals.grandTotal).toBeCloseTo(970)
  })

  it('combines VAT and WHT: taxable + vat - wht', () => {
    const totals = useQuoteTotals(
      [{ qty: 1, price: 1000 }],
      0,
      true,
      true,
      3,
    )

    expect(totals.vat).toBeCloseTo(70)
    expect(totals.wht).toBeCloseTo(30)
    expect(totals.grandTotal).toBeCloseTo(1000 + 70 - 30)
  })

  it('returns all zeros for an empty item list', () => {
    const totals = useQuoteTotals([], 0, true, true, 3)

    expect(totals.subtotal).toBe(0)
    expect(totals.taxableAmount).toBe(0)
    expect(totals.vat).toBe(0)
    expect(totals.wht).toBe(0)
    expect(totals.grandTotal).toBe(0)
  })
})
