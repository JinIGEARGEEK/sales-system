// Shared by the Deal detail layout (pages/crm/deals/[id].vue) and its child
// routes — all independently resolved the same `:id` route param into a Deal
// from the store; centralized here so that lookup only needs to be right
// once. Quotes/Contracts now also pull `deal` from here (for the FR-CRM-046
// quote pre-fill and FR-CRM-048 auto-create-Project-on-Signed flow) — only
// Tasks/Activity/Attachments still read `route.params.id` directly since they
// never need the Deal record itself.
export const useCurrentDeal = () => {
  const route = useRoute()
  const dealsStore = useDealsStore()
  const { notifyApiError } = useApiErrorNotifier()

  const dealId = Number(route.params.id)
  const deal = computed(() => dealsStore.items.find(d => d.id === dealId) ?? null)

  // dealsStore.items only ever holds fetchAll's capped 200-row, newest-first
  // cache (see stores/companies.ts's fetchAll for the full explanation) — a
  // Deal reached by direct/bookmarked link past that cutoff would otherwise
  // show "Deal not found" (pages/crm/deals/[id].vue) despite existing.
  // fetchOne is harmless to call even when already cached elsewhere (e.g.
  // from a list page) — it just re-fetches and upserts the same record.
  if (!deal.value) {
    dealsStore.fetchOne(dealId).catch(notifyApiError)
  }

  return { dealId, deal }
}
