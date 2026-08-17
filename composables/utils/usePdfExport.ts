import { useI18n } from 'vue-i18n'

// Shared by the Deal detail's Quotes and Contracts sub-pages — both upload
// flows accept the same file type/size, and both "Download PDF" buttons hit
// export-pdf endpoints that return a raw PDF byte stream, not JSON, so the
// file needs to be fetched as a blob via $api (to carry the same Authorization
// header every other API call gets) rather than a plain browser-navigated link.
export const MAX_QUOTATION_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const useDownloadPdfBlob = () => {
  const { error } = useNotify()
  const { t } = useI18n()

  return async (path: string, filename: string) => {
    try {
      const { $api } = useNuxtApp()
      const response = await $api.get(path, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
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
