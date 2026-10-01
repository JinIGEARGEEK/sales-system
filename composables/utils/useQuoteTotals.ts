// Mirrors internal/utils/quote_totals.go's ComputeQuoteTotals operation for
// operation — kept side-by-side commented on both ends so the Quote editor's
// live total and the exported PDF's totals block can't silently drift apart.
// Every figure is rounded to satang (roundSatang) as it's produced and the
// grand total is built from the rounded parts, so the printed lines add up:
//   line          = roundSatang(item.qty * item.price * (1 - item.discount_percent/100))
//   subtotal      = roundSatang(Σ line)
//   net           = roundSatang(subtotal - discountTotal)
//   VAT off       → taxable = net, vat = 0 (either price type)
//   excl_tax      → taxable = net, vat = roundSatang(taxable * 7 / 100)
//   incl_tax      → prices already contain VAT, so it's backed out, never
//                   added again: taxable = roundSatang(net * 100 / 107),
//                   vat = roundSatang(net - taxable) (taxable + vat === net)
//   wht           = whtEnabled ? roundSatang(taxable * whtRate / 100) : 0 — on the pre-VAT amount
//   grandTotal    = roundSatang(taxable + vat - wht)
// `taxableAmount` is always pre-VAT: revenue (quoteRevenueAmount) and the
// receivable (dealReceivable, taxable + vat) both read it from here.
// Explicit import: unimport's identifier scan doesn't recognise a name
// followed by `/` (it can't tell division from a regex literal), so
// `... / (100 + VAT_PERCENT)` would never be auto-imported.
import { VAT_PERCENT, roundSatang } from './useMoney'

export interface QuoteTotals {
  subtotal: number
  discountTotal: number
  taxableAmount: number
  vat: number
  wht: number
  grandTotal: number
}

export interface QuoteTotalsItem {
  qty: number
  price: number
  discount_percent?: number
}

// One line's amount after its own discount, rounded to satang — what the
// items editor and the PDF show per row (the API's QuoteLineTotal).
export const quoteLineTotal = (item: QuoteTotalsItem): number => {
  let lineTotal = item.qty * item.price
  if (item.discount_percent && item.discount_percent > 0) lineTotal *= 1 - item.discount_percent / 100
  return roundSatang(lineTotal)
}

// Not a reactive composable in the traditional sense (no refs/lifecycle) —
// named/placed like one anyway so it's auto-imported the same way every
// other composables/utils/* helper is, instead of needing an explicit import.
export const useQuoteTotals = (
  items: QuoteTotalsItem[],
  discountTotal: number,
  priceType: QuotePriceType,
  vatEnabled: boolean,
  whtEnabled: boolean,
  whtRate: number,
): QuoteTotals => {
  const subtotal = roundSatang(items.reduce((sum, item) => sum + quoteLineTotal(item), 0))
  const net = roundSatang(subtotal - discountTotal)

  let taxable = net
  let vat = 0
  if (vatEnabled) {
    if (priceType === 'incl_tax') {
      taxable = roundSatang(net * 100 / (100 + VAT_PERCENT))
      vat = roundSatang(net - taxable)
    } else {
      vat = roundSatang(taxable * VAT_PERCENT / 100)
    }
  }
  const wht = whtEnabled ? roundSatang(taxable * whtRate / 100) : 0

  return {
    subtotal,
    discountTotal,
    taxableAmount: taxable,
    vat,
    wht,
    grandTotal: roundSatang(taxable + vat - wht),
  }
}

// useQuoteTotals over a loaded Quote's own fields.
export const quoteTotalsOf = (quote: Pick<Quote, 'items' | 'discount_total' | 'price_type' | 'vat_enabled' | 'wht_enabled' | 'wht_rate'>): QuoteTotals =>
  useQuoteTotals(quote.items ?? [], quote.discount_total ?? 0, quote.price_type, quote.vat_enabled, quote.wht_enabled, quote.wht_rate)
