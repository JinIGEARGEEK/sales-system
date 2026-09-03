// Shared by every Deal/Lead/Prospect create/edit form: Project options are
// scoped to the record's Company (Projects always belong to one company),
// while Product options are the whole active catalog — a record can be about
// a product the company doesn't have linked yet.
//
// Also owns the "clear business_unit_item when business_unit or company
// changes" behavior (pass `businessUnitItem` to opt in) — every call site
// used to re-implement this exact watcher by hand. Pass `isSuppressed` to
// skip a clear while some other effect is setting business_unit and
// business_unit_item together atomically (loading an existing record, or
// pre-filling a create form from an originating Lead/Prospect) — without it,
// that other effect's own business_unit_item assignment would just get wiped
// back out by this watcher reacting to the business_unit change alongside it.
export const useBusinessUnitItemOptions = (
  businessUnit: Ref<string>,
  companyId: Ref<number | null>,
  businessUnitItem?: Ref<string>,
  isSuppressed?: () => boolean,
) => {
  const projectsStore = useProjectsStore()
  const productsStore = useProductsStore()
  const { notifyApiError } = useApiErrorNotifier()

  // Scoped to this Company (fetchForCompany), not a blanket
  // projectsStore.fetchAll() — that cache is capped at 200 rows,
  // newest-first, system-wide (see stores/companies.ts's fetchAll doc), so
  // an older Project belonging to this Company could otherwise be missing
  // from the list below even if some other page already warmed the store.
  watch(companyId, (id) => {
    if (id !== null) projectsStore.fetchForCompany(id).catch(notifyApiError)
  }, { immediate: true })

  // Products aren't scoped to a Company, so unlike Projects above there's
  // nothing to re-fetch on change — just make sure the catalog has been
  // loaded at least once. Some call sites (Deal forms) already warm this
  // store themselves, but Lead/Prospect forms don't, which left the Product
  // item list empty there until some other page happened to populate it
  // first. Owning the fetch here makes it work regardless of call site.
  if (productsStore.items.length === 0) productsStore.fetchAll().catch(notifyApiError)

  if (businessUnitItem) {
    watch([businessUnit, companyId], () => {
      if (!isSuppressed?.()) businessUnitItem.value = ''
    })
  }

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
