// Shared by the Deal create/edit forms: Project options are scoped to the
// Deal's Company (Projects always belong to one company), while Product
// options are the whole active catalog — a Deal can be about a product the
// company doesn't have linked yet.
export const useBusinessUnitItemOptions = (businessUnit: Ref<string>, companyId: Ref<number | null>) => {
  const projectsStore = useProjectsStore()
  const productsStore = useProductsStore()

  return computed(() => {
    if (businessUnit.value === 'Project') {
      return companyId.value === null ? [] : projectsStore.forCompany(companyId.value).map(p => ({ label: p.name, value: p.name }))
    }
    if (businessUnit.value === 'Product') {
      return productsStore.items.filter(p => p.is_active).map(p => ({ label: p.name, value: p.name }))
    }
    return []
  })
}
