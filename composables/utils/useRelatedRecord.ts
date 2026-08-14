// Resolves a display label + route path for a polymorphic related_type/related_id
// pair (used by Task today; Activity shares the same related_type shape). Centralized
// here since the dashboard's follow-ups widget and the all-tasks list both need it.
export const useRelatedRecord = () => {
  const dealsStore = useDealsStore()
  const contactsStore = useContactsStore()
  const companiesStore = useCompaniesStore()

  const resolveRelated = (relatedType: TaskRelatedType, relatedId: number) => {
    if (relatedType === 'deal') {
      const deal = dealsStore.items.find(d => d.id === relatedId)
      return { relatedLabel: deal?.title || '-', path: `/crm/deals/${relatedId}` }
    }
    if (relatedType === 'contact') {
      const contact = contactsStore.items.find(c => c.id === relatedId)
      return { relatedLabel: contact?.name || '-', path: `/crm/contacts/${relatedId}` }
    }
    return { relatedLabel: companiesStore.nameById(relatedId), path: `/crm/companies/${relatedId}` }
  }

  return { resolveRelated }
}
