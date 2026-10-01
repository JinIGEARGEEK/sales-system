import { useI18n } from 'vue-i18n'

type QuoteAmounts = Pick<Quote, 'items' | 'discount_total' | 'price_type' | 'vat_enabled' | 'wht_enabled' | 'wht_rate'>

// What an accepted Quote is worth to the pipeline: its taxable amount (line
// items after per-line discounts, minus the quote-level discount), i.e.
// BEFORE VAT — not added for a tax-exclusive quote, backed out of the prices
// for a tax-inclusive one — and before WHT is withheld. Revenue excludes VAT,
// and every Deal value / forecast figure in the app is pre-VAT. It's
// useQuoteTotals' taxableAmount (and so the backend's ComputeQuoteTotals),
// already rounded to satang — the same amount the API copies into the Deal's
// value when the quote is accepted.
export const quoteRevenueAmount = (quote: QuoteAmounts) => quoteTotalsOf(quote).taxableAmount

// The API keeps a Deal's value in step with its Accepted quote by itself
// (Deal.value_quote_id / value_quote_number): accepting a quote copies its
// pre-VAT amount into the Deal, and the Deal's value input goes read-only.
// So after a quote's status moves into or out of Accepted, the UI only
// re-reads the Deal — it never writes the value itself. When the value
// actually changed, an info toast says so.
export const useQuoteDealValueRefresh = () => {
  const { t } = useI18n()
  const { info } = useNotify()
  const { currency } = useFormatter()
  const { notifyApiError } = useApiErrorNotifier()
  const dealsStore = useDealsStore()

  const afterQuoteStatusChange = async (dealId: number, before: QuoteStatus, after: QuoteStatus) => {
    if (before === after || (before !== 'accepted' && after !== 'accepted')) return
    const previous = dealsStore.items.find(d => d.id === dealId)?.value
    try {
      const deal = await dealsStore.fetchOne(dealId)
      if (deal.value_quote_id && previous !== undefined && Math.abs(deal.value - previous) >= 0.005) {
        info(t('crm.deals.detail.dealValueSyncedFromQuote', {
          value: currency(deal.value),
          number: deal.value_quote_number || `#${deal.value_quote_id}`,
        }))
      }
    } catch (err) {
      notifyApiError(err)
    }
  }

  return { afterQuoteStatusChange }
}
