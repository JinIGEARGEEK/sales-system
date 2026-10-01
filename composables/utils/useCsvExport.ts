import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'

// A failed `responseType: 'blob'` request carries its JSON error body as a
// Blob, so getApiErrorMessage/getApiErrorFields can't read it. Swaps the
// parsed envelope back in (in place) when the body is JSON; leaves anything
// else alone.
export const readBlobErrorBody = async (err: unknown) => {
  if (!isAxiosError(err) || !err.response) return
  const body: unknown = err.response.data
  if (!(body instanceof Blob)) return
  try {
    err.response.data = JSON.parse(await body.text())
  } catch {
    // Not JSON (e.g. a proxy's HTML error page): the generic message stands.
  }
}

interface CsvDownloadOptions {
  // Shows an error itself (e.g. a 422 on the caller's own inputs) and returns
  // true, or false to fall back to the usual toast. Runs after the error body
  // has been parsed, so getApiErrorFields() works.
  onError?: (err: unknown) => boolean
}

// Sibling to useDownloadPdfBlob (composables/utils/usePdfExport.ts) — same
// blob-download pattern, just a text/csv MIME type instead of application/pdf,
// used by the Companies/Contacts/Deals/Products/Projects/Payments "Export CSV"
// buttons. Resolves true once the file was handed to the browser.
// skipErrorRedirect: a failed export (403, a 404 deal_id, …) stays a toast on
// the current page rather than the app-wide error redirect for GETs.
export const useDownloadCsvBlob = () => {
  const { error } = useNotify()
  const { t } = useI18n()

  return async (path: string, filename: string, params?: Record<string, unknown>, options: CsvDownloadOptions = {}): Promise<boolean> => {
    try {
      const { $api } = useNuxtApp()
      const response = await $api.get(path, { responseType: 'blob', params, skipErrorRedirect: true })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      return true
    } catch (err) {
      await readBlobErrorBody(err)
      if (!options.onError?.(err)) error(getApiErrorMessage(err, t('global.genericError')))
      return false
    }
  }
}
