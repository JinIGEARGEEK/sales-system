import { useI18n } from 'vue-i18n'

// The toast for a fire-and-forget call with no error handling of its own
// (`onMounted(() => store.fetchAll().catch(notifyApiError))`), or a
// `catch (err) { notifyApiError(err) }`: the API's message, else the
// translated generic one, with an optional Retry action.
//
// `notifyLoadError` is for a detail page's own record load (a store's
// fetchOne with `skipErrorRedirect: true`) when the page renders
// <NotFoundState> for a missing record: a 404 is not toasted at all (the
// page already says "not found" in words); a 403 says the user has no access; a 5xx or a
// network failure gets the translated generic message (the backend's text
// there is for logs, not people); any other status keeps the API's message.
export function useApiErrorNotifier() {
  const { t } = useI18n()
  const { error } = useNotify()

  const retryAction = (retry?: () => void) => (retry ? { label: t('global.retry'), onClick: retry } : undefined)

  const notifyApiError = (err: unknown, retry?: () => void) => {
    error(getApiErrorMessage(err, t('global.genericError')), retryAction(retry))
  }

  const loadErrorMessage = (status: number | undefined, err: unknown) => {
    if (status === 403) return t('global.noAccess')
    if (status === undefined || status >= 500) return t('global.genericError')
    return getApiErrorMessage(err, t('global.genericError'))
  }

  const notifyLoadError = (err: unknown, retry?: () => void) => {
    const status = getApiErrorStatus(err)
    if (status === 404) return
    error(loadErrorMessage(status, err), retryAction(retry))
  }

  return { notifyApiError, notifyLoadError }
}
