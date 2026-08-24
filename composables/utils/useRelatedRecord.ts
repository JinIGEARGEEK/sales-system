// Resolves a display label + route path for a polymorphic related_type/related_id
// pair (used by Task today; Activity shares the same related_type shape). Centralized
// here since the dashboard's follow-ups widget and the all-tasks list both need it.
export const useRelatedRecord = () => {
  const dealsStore = useDealsStore()
  const contactsStore = useContactsStore()
  const companiesStore = useCompaniesStore()
  const { notifyApiError } = useApiErrorNotifier()

  // None of the three stores' `items` get a blanket preload wherever this
  // composable's callers (dashboard follow-ups widget, all-tasks list) live
  // — fetchAll()'s cache is capped at 200 rows, newest-first, system-wide
  // (see stores/companies.ts's fetchAll doc), so a Task/Activity pointing at
  // an older Deal/Contact/Company would otherwise show "-" forever, not just
  // until that record happens to load some other way. fetchOne fixes that;
  // the `pending` sets just dedupe in-flight requests, since resolveRelated
  // can be called many times per render (once per row) while a fetch for
  // the same id is still outstanding.
  const pendingDeals = new Set<number>()
  const pendingContacts = new Set<number>()
  const pendingCompanies = new Set<number>()

  const ensureLoaded = <T extends { id: number }>(
    items: T[], pending: Set<number>, id: number, fetchOne: (id: number) => Promise<T>,
  ) => {
    if (items.some(item => item.id === id) || pending.has(id)) return
    pending.add(id)
    fetchOne(id).catch(notifyApiError).finally(() => pending.delete(id))
  }

  const resolveRelated = (relatedType: TaskRelatedType, relatedId: number) => {
    if (relatedType === 'deal') {
      const deal = dealsStore.items.find(d => d.id === relatedId)
      if (!deal) ensureLoaded(dealsStore.items, pendingDeals, relatedId, id => dealsStore.fetchOne(id))
      return { relatedLabel: deal?.title || '-', path: `/crm/deals/${relatedId}` }
    }
    if (relatedType === 'contact') {
      const contact = contactsStore.items.find(c => c.id === relatedId)
      if (!contact) ensureLoaded(contactsStore.items, pendingContacts, relatedId, id => contactsStore.fetchOne(id))
      return { relatedLabel: contact?.name || '-', path: `/crm/contacts/${relatedId}` }
    }
    ensureLoaded(companiesStore.items, pendingCompanies, relatedId, id => companiesStore.fetchOne(id))
    return { relatedLabel: companiesStore.nameById(relatedId), path: `/crm/companies/${relatedId}` }
  }

  return { resolveRelated }
}
