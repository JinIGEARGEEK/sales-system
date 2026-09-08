// The "Relates To" type + record picker shared by AddTaskModal and
// AddActivityModal's own showRelatedPicker mode — both forms carry the same
// related_type/related_id pair (as strings, matching InputSelect/
// InputAsyncSelect's own string-valued v-model) and need the identical
// search-as-you-type Deal/Contact/Prospect lookups plus the Company combobox.
// Extracted here once a second modal needed the exact same ~40 lines.
export const useRelatedRecordPicker = (form: { related_type: string, related_id: string }) => {
  // None of Deal/Contact/Prospect are preloaded here — each branch searches
  // the server as the rep types instead of filtering a capped preloaded list
  // (fetchAll() is capped at 200 rows, newest-first, and can miss an older
  // record entirely — see stores/companies.ts's fetchAll doc for the full
  // explanation). Company uses InputCompanySelect instead, which already
  // owns its own combobox-with-create behavior.
  const dealsStore = useDealsStore()
  const contactsStore = useContactsStore()
  const prospectsStore = useProspectsStore()

  function useAsyncRecordPicker<T extends { id: number }> (
    fetchList: (params: { search?: string, per_page: number, sort: string }) => Promise<{ items: T[] }>,
    fetchOne: (id: number) => Promise<T>,
    labelOf: (item: T) => string,
    sortField: string,
  ) {
    const search = async (term: string): Promise<Select[]> => {
      const { items } = await fetchList({ search: term || undefined, per_page: 20, sort: sortField })
      return items.map(item => ({ label: labelOf(item), value: item.id }))
    }
    const resolve = async (id: number): Promise<Select | null> => {
      const item = await fetchOne(id)
      return { label: labelOf(item), value: item.id }
    }
    return { search, resolve }
  }

  const { search: searchDeals, resolve: resolveDeal } = useAsyncRecordPicker(dealsStore.fetchList, dealsStore.fetchOne, d => d.title, 'title')
  const { search: searchContacts, resolve: resolveContact } = useAsyncRecordPicker(contactsStore.fetchList, contactsStore.fetchOne, c => c.name, 'name')
  const { search: searchProspects, resolve: resolveProspect } = useAsyncRecordPicker(prospectsStore.fetchList, prospectsStore.fetchOne, p => p.name, 'name')

  // Every branch above resolves to a number, but form.related_id stays a
  // plain string (matching every other InputSelect/InputAsyncSelect-bound
  // form field) — this proxy is the one place that converts between the two.
  const relatedRecordId = computed<number | null>({
    get: () => form.related_id ? Number(form.related_id) : null,
    set: value => { form.related_id = value ? String(value) : '' },
  })

  // A record picked before switching type would otherwise submit as e.g. a
  // Deal id under related_type: 'contact' — clear it so the field always
  // reflects only the currently-selected type's records.
  watch(() => form.related_type, () => {
    form.related_id = ''
  })

  return { searchDeals, resolveDeal, searchContacts, resolveContact, searchProspects, resolveProspect, relatedRecordId }
}
