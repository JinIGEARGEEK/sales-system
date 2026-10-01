import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'

// Shared fallback for the very common "fire-and-forget background fetch/action
// with no per-call-site error handling" gap: every `onMounted(() => store.fetchAll())`
// (and similar) across the app was an unhandled promise rejection with zero
// user-facing feedback on failure. Use as `.catch(notifyApiError)` on a
// fire-and-forget call, or `catch (err) { notifyApiError(err) }` in a try/catch.
//
// `notifyLoadError` is for a detail page's own record load (a store's
// fetchOne with `skipErrorRedirect: true`) when the page renders
// <NotFoundState> for a missing record: a 404 is not toasted at all (the
// page already says "not found" in words, and the API's English message
// on top of it was noise); a 403 says the user has no access; a 5xx or a
// network failure gets the translated generic message (the backend's text
// there is for logs, not people); any other status keeps the API's message.
export function useApiErrorNotifier() {
  const { t } = useI18n()
  const { error } = useNotify()

  const notifyApiError = (err: unknown, retry?: () => void) => {
    error(
      getApiErrorMessage(err, t('global.genericError')),
      retry ? { label: t('global.retry'), onClick: retry } : undefined,
    )
  }

  const notifyLoadError = (err: unknown, retry?: () => void) => {
    const status = isAxiosError(err) ? err.response?.status : undefined
    if (status === 404) return
    const message = status === 403
      ? t('global.noAccess')
      : status === undefined || status >= 500
        ? t('global.genericError')
        : getApiErrorMessage(err, t('global.genericError'))
    error(message, retry ? { label: t('global.retry'), onClick: retry } : undefined)
  }

  return { notifyApiError, notifyLoadError }
}
