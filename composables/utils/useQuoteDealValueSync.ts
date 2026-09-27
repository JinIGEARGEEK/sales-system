import { useI18n } from 'vue-i18n'

type QuoteAmounts = Pick<Quote, 'items' | 'discount_total'>

// What an accepted Quote is worth to the pipeline: its taxable amount (line
// items after per-line discounts, minus the quote-level discount), i.e. BEFORE
// VAT is added or WHT withheld — revenue excludes VAT, and every Deal value /
// forecast figure in the app is pre-VAT. Same arithmetic as useQuoteTotals'
// taxableAmount (and so the backend's ComputeQuoteTotals), rounded to satang.
export const quoteRevenueAmount = (quote: QuoteAmounts) => {
  const { taxableAmount } = useQuoteTotals(quote.items ?? [], quote.discount_total ?? 0, false, false, 0)
  return roundSatang(taxableAmount)
}

// PUT /deals/:id replaces every mapped field (CLAUDE.md, design-system.md §8),
// and Deal has no narrow "value only" endpoint — so a value change resends the
// whole current record with just `value` swapped.
export const fullDealUpdatePayload = (deal: Deal, changes: Partial<Deal> = {}): Partial<Omit<Deal, 'id'>> => ({
  company_id: deal.company_id,
  contact_id: deal.contact_id,
  title: deal.title,
  value: deal.value,
  stage: deal.stage,
  status: deal.status,
  probability: deal.probability,
  lost_reason: deal.lost_reason,
  forecast_category: deal.forecast_category,
  expected_close_date: deal.expected_close_date,
  assigned_to: deal.assigned_to,
  channel: deal.channel,
  business_unit: deal.business_unit,
  business_unit_item: deal.business_unit_item,
  ...changes,
})

// After a Quote moves to Accepted (quote editor Save, or the Deal's Quotes
// tab), offer to bring the Deal's value in line with it. Bind `pending` to a
// confirm modal; offer() does nothing when the amounts already match or the
// quote has no priced lines (e.g. an uploaded PDF nothing was extracted from).
export const useQuoteDealValueSync = () => {
  const { t } = useI18n()
  const { success } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const dealsStore = useDealsStore()

  const pending = ref<{ dealId: number, from: number, to: number } | null>(null)

  const offer = (quote: QuoteAmounts, deal: Deal | null | undefined) => {
    if (!deal) return
    const to = quoteRevenueAmount(quote)
    if (to <= 0 || Math.abs(to - deal.value) < 0.005) return
    pending.value = { dealId: deal.id, from: deal.value, to }
  }

  const dismiss = () => { pending.value = null }

  const confirm = async () => {
    const current = pending.value
    if (!current) return
    // The store's copy, not the one captured at offer() time, so an edit made
    // in between isn't overwritten by the full-record PUT.
    const deal = dealsStore.items.find(d => d.id === current.dealId)
    try {
      const latest = deal ?? await dealsStore.fetchOne(current.dealId)
      await dealsStore.update(latest.id, fullDealUpdatePayload(latest, { value: current.to }))
      success(t('crm.deals.detail.dealValueUpdated'))
    } catch (err) {
      notifyApiError(err)
    } finally {
      pending.value = null
    }
  }

  return { pending, offer, confirm, dismiss }
}
