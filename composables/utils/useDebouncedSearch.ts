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

  const run = async (value: string) => {
    loading.value = true
    try {
      results.value = await search(value)
    } catch (err) {
      notifyApiError(err)
    } finally {
      loading.value = false
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
