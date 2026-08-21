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

  const dealId = Number(route.params.id)
  const deal = computed(() => dealsStore.items.find(d => d.id === dealId) ?? null)

  return { dealId, deal }
}
