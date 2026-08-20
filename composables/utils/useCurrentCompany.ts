// Shared by the Company detail layout (pages/crm/companies/[id].vue) and its
// Overview child route — both need the resolved Company record itself (for
// the header/tags and the edit form respectively). Mirrors useCurrentDeal.ts.
// Sub-pages that only need the numeric id (Contacts, Deals, Products,
// Projects, Activity, Tasks, Attachments) can keep reading `route.params.id`
// directly since they never need the Company record itself.
export const useCurrentCompany = () => {
  const route = useRoute()
  const companiesStore = useCompaniesStore()

  const companyId = Number(route.params.id)
  const company = computed(() => companiesStore.items.find(c => c.id === companyId) ?? null)

  return { companyId, company }
}
