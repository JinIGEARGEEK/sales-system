// Mirrors internal/utils/quote_totals.go's ComputeQuoteTotals verbatim — kept
// side-by-side commented on both ends so the Quote editor's live total and
// the exported PDF's totals block can't silently drift apart:
//   subtotal      = Σ item.qty * item.price * (1 - item.discount_percent/100)
//   taxable       = subtotal - discountTotal
//   vat           = vatEnabled ? taxable * 0.07 : 0
//   wht           = whtEnabled ? taxable * whtRate/100 : 0
//   grandTotal    = taxable + vat - wht
const QUOTE_VAT_RATE = 0.07

export interface QuoteTotals {
  subtotal: number
  discountTotal: number
  taxableAmount: number
  vat: number
  wht: number
  grandTotal: number
}

// Not a reactive composable in the traditional sense (no refs/lifecycle) —
// named/placed like one anyway so it's auto-imported the same way every
// other composables/utils/* helper is, instead of needing an explicit import.
export const useQuoteTotals = (
  items: { qty: number, price: number, discount_percent?: number }[],
  discountTotal: number,
  vatEnabled: boolean,
  whtEnabled: boolean,
  whtRate: number,
): QuoteTotals => {
  const subtotal = items.reduce((sum, item) => {
    let lineTotal = item.qty * item.price
    if (item.discount_percent) lineTotal *= 1 - item.discount_percent / 100
    return sum + lineTotal
  }, 0)

  const taxable = subtotal - discountTotal
  const vat = vatEnabled ? taxable * QUOTE_VAT_RATE : 0
  const wht = whtEnabled ? (taxable * whtRate) / 100 : 0

  return {
    subtotal,
    discountTotal,
    taxableAmount: taxable,
    vat,
    wht,
    grandTotal: taxable + vat - wht,
  }
}
