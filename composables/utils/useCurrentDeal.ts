// Shared by the Deal detail layout (pages/crm/deals/[id].vue) and its Overview/
// Payments child routes — all three independently resolved the same `:id` route
// param into a Deal from the store; centralized here so that lookup only needs
// to be right once. Sub-pages that only need the numeric id (Quotes, Contracts,
// Tasks, Activity, Attachments) can keep reading `route.params.id` directly since
// they never need the Deal record itself.
export const useCurrentDeal = () => {
  const route = useRoute()
  const dealsStore = useDealsStore()

  const dealId = Number(route.params.id)
  const deal = computed(() => dealsStore.items.find(d => d.id === dealId) ?? null)

  return { dealId, deal }
}
