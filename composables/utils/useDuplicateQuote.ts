import { useI18n } from 'vue-i18n'

// "Duplicate" on a Quote (detail page + the Deal's Quotes tab):
// POST /quotes/:id/duplicate, toast once it lands, then open the new Draft.
// `duplicatingId` spins the clicked button and turns away a second click.
export const useDuplicateQuote = () => {
  const { t } = useI18n()
  const { success } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const quotesStore = useQuotesStore()
  const duplicatingId = ref<number | null>(null)

  const duplicateQuote = async (id: number) => {
    if (duplicatingId.value !== null) return
    duplicatingId.value = id
    try {
      const created = await quotesStore.duplicate(id)
      success(t('crm.quotes.detail.duplicateSuccess', { number: created.number || `#${created.id}` }))
      await navigateTo(`/crm/quotes/${created.id}`)
    } catch (err) {
      notifyApiError(err)
    } finally {
      duplicatingId.value = null
    }
  }

  return { duplicatingId, duplicateQuote }
}
