type ReceivableQuote = Pick<Quote, 'id' | 'status' | 'items' | 'discount_total' | 'vat_enabled'>

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
export const dealReceivable = (quotes: ReceivableQuote[], dealValue: number): DealReceivable => {
  const accepted = quotes
    .filter(q => q.status === 'accepted')
    // Newest first — ids follow creation order, matching the API's created_at DESC.
    .sort((a, b) => b.id - a.id)[0]
  if (accepted) {
    const { subtotal, taxableAmount, vat } = useQuoteTotals(accepted.items ?? [], accepted.discount_total ?? 0, accepted.vat_enabled, false, 0)
    if (subtotal > 0) return { amount: roundSatang(taxableAmount + vat), fromQuote: true }
  }
  return { amount: dealValue, fromQuote: false }
}
