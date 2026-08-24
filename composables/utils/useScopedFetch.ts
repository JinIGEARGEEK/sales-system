// Fetches dependent data whenever `key` changes (e.g. a company_id driving
// that company's own Contacts/Deals list) — guards against the fetch for an
// older key resolving *after* a newer one's and overwriting it with stale
// data (a real risk here: nothing stops a slow request for the previously
// selected Company from finishing after a fast one for the newly selected
// Company). A falsy key resets `result` to `fallback` without fetching.
export const useScopedFetch = <K, T>(
  key: Ref<K | null | undefined>,
  fetcher: (key: K) => Promise<T>,
  fallback: T,
) => {
  const { notifyApiError } = useApiErrorNotifier()
  const result = ref(fallback) as Ref<T>
  const loading = ref(false)

  let requestId = 0
  watch(key, async (value) => {
    const id = ++requestId
    if (!value) {
      result.value = fallback
      return
    }
    loading.value = true
    try {
      const fetched = await fetcher(value)
      if (id === requestId) result.value = fetched
    } catch (err) {
      if (id === requestId) notifyApiError(err)
    } finally {
      if (id === requestId) loading.value = false
    }
  }, { immediate: true })

  return { result, loading }
}
