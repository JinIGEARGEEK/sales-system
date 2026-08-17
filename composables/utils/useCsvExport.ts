import { useI18n } from 'vue-i18n'

// Sibling to useDownloadPdfBlob (composables/utils/usePdfExport.ts) — same
// blob-download pattern, just a text/csv MIME type instead of application/pdf,
// used by the Companies/Contacts/Deals/Products/Projects "Export CSV" buttons.
export const useDownloadCsvBlob = () => {
  const { error } = useNotify()
  const { t } = useI18n()

  return async (path: string, filename: string, params?: Record<string, unknown>) => {
    try {
      const { $api } = useNuxtApp()
      const response = await $api.get(path, { responseType: 'blob', params })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
}
