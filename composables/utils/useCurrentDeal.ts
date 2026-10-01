// The Deal behind the `:id` route param, shared by the Deal detail layout
// (pages/crm/deals/[id].vue) and the child routes that need the record
// itself (Overview, Quotes, Contracts, Payments).

// Module-scoped (not inside the composable function), so it's shared across
// every call to useCurrentDeal() for the life of the app, not just within
// one component — the layout and its currently-active child route each call
// this composable independently for the same dealId on every page load, and
// without this both would fire their own GET /deals/:id at once. Reactive so
// `dealPending` can drive the layout's loading skeleton.
const pendingDealFetches = reactive(new Set<number>())

export const useCurrentDeal = () => {
  const route = useRoute()
  const dealsStore = useDealsStore()
  const { notifyLoadError } = useApiErrorNotifier()

  const dealId = Number(route.params.id)
  const deal = computed(() => dealsStore.items.find(d => d.id === dealId) ?? null)

  // Fetched by id whenever it isn't cached: dealsStore.items is fetchAll's
  // capped newest-200 list (see stores/companies.ts's fetchAll), so an older
  // Deal reached by link would otherwise read "Deal not found". A cached list
  // row whose value follows a quote is re-read too, for value_quote_number
  // (lacksValueQuoteNumber). fetchOne upserts, so a re-read is harmless.
  const needsFetch = !deal.value || lacksValueQuoteNumber(deal.value)
  if (needsFetch && !pendingDealFetches.has(dealId)) {
    pendingDealFetches.add(dealId)
    dealsStore.fetchOne(dealId).catch(notifyLoadError).finally(() => pendingDealFetches.delete(dealId))
  }

  // True while this Deal's own GET is still in flight — the layout shows
  // DetailSkeleton instead of "Deal not found" until it settles.
  const dealPending = computed(() => pendingDealFetches.has(dealId))

  return { dealId, deal, dealPending }
}
