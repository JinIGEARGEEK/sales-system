type ReceivableQuote = Pick<Quote, 'id' | 'status' | 'items' | 'discount_total' | 'price_type' | 'vat_enabled' | 'wht_enabled' | 'wht_rate'>

export interface DealReceivable {
  amount: number
  // true: the amount is the latest Accepted Quote's; false: the Deal value.
  fromQuote: boolean
}

// What the customer owes on a Deal, by the same rule as the Outstanding
// Balance report (sales-system-api computeOutstandingRow): the latest
// Accepted Quote's taxable amount + VAT (before WHT), rounded to satang —
// unless that Quote has no priced content (no items, or a subtotal of 0,
// e.g. an uploaded PDF whose extraction failed), in which case, like no
// Accepted Quote at all, it's the Deal value.
// The Deal's latest Accepted Quote — newest first, ids follow creation
// order, matching the API's created_at DESC. Shared by dealReceivable and the
// payment modal's WHT defaults (paymentTaxRates).
export const latestAcceptedQuote = <Q extends Pick<Quote, 'id' | 'status'>>(quotes: Q[]): Q | undefined =>
  quotes.filter(q => q.status === 'accepted').sort((a, b) => b.id - a.id)[0]

export const dealReceivable = (quotes: ReceivableQuote[], dealValue: number): DealReceivable => {
  const accepted = latestAcceptedQuote(quotes)
  if (accepted) {
    // taxable + VAT — for a tax-inclusive quote that's its prices as entered.
    const { subtotal, taxableAmount, vat } = quoteTotalsOf(accepted)
    if (subtotal > 0) return { amount: roundSatang(taxableAmount + vat), fromQuote: true }
  }
  return { amount: dealValue, fromQuote: false }
}
