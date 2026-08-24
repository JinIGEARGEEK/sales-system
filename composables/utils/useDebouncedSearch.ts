// Shared "search the server as you type" pattern: watches `term`, waits
// `delay` ms of no further typing, then calls `search(term)` and stores the
// result in `results` (with a `loading` flag) — used anywhere a picker,
// filter, or search box needs live results instead of filtering a
// preloaded-but-capped list. See stores/companies.ts's fetchAll doc for why
// that cap exists (the backend clamps every list endpoint's per_page at
// 200) and why a preloaded cache can silently miss an older record.
//
// `shouldSearch` (default: always) lets a caller skip searching below a
// minimum query length, or while some other precondition isn't met (e.g.
// GlobalSearch's role check) — `results` is cleared immediately when it
// fails, without waiting out the debounce.
export const useDebouncedSearch = <T>(
  search: (term: string) => Promise<T[]>,
  options: { delay?: number, shouldSearch?: (term: string) => boolean } = {},
) => {
  const { delay = 300, shouldSearch = () => true } = options
  const { notifyApiError } = useApiErrorNotifier()

  const term = ref('')
  const loading = ref(false)
  const results = ref<T[]>([]) as Ref<T[]>

  // Debouncing only prevents overlapping *requests* from typing quickly —
  // it doesn't guarantee they *resolve* in the order they were sent. Two
  // calls to run() (e.g. one fired by the debounce timer, one via the
  // exposed `run` for an immediate initial search) can still race on the
  // network, and a slower earlier response landing after a faster later one
  // would otherwise silently overwrite the correct results with stale ones.
  // requestId guards against that: only the most recently *started* call is
  // allowed to write `results`.
  let requestId = 0
  const run = async (value: string) => {
    const id = ++requestId
    loading.value = true
    try {
      const found = await search(value)
      if (id === requestId) results.value = found
    } catch (err) {
      if (id === requestId) notifyApiError(err)
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(term, (value) => {
    clearTimeout(debounceTimer)
    if (!shouldSearch(value)) {
      results.value = []
      return
    }
    debounceTimer = setTimeout(() => run(value), delay)
  })

  return { term, loading, results, run }
}
