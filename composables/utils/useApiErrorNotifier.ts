import { useI18n } from 'vue-i18n'

// Shared fallback for the very common "fire-and-forget background fetch/action
// with no per-call-site error handling" gap: every `onMounted(() => store.fetchAll())`
// (and similar) across the app was an unhandled promise rejection with zero
// user-facing feedback on failure. Use as `.catch(notifyApiError)` on a
// fire-and-forget call, or `catch (err) { notifyApiError(err) }` in a try/catch.
export function useApiErrorNotifier() {
  const { t } = useI18n()
  const { error } = useNotify()

  const notifyApiError = (err: unknown) => {
    error(getApiErrorMessage(err, t('global.genericError')))
  }

  return { notifyApiError }
}
