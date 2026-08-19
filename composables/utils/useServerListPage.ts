// Shared "server-paginated list page" plumbing for the Leads/Contacts/Companies
// list pages and the Deals table view. Each page still owns its own search/filter
// refs and column definitions — this only centralizes the repeated bit: page/
// per-page state, an in-flight `loading` flag, and a debounced-on-search refetch
// that always resets back to page 1 whenever a filter changes (so you never land
// on an empty "page 3 of 1" after narrowing a search).
export const useServerListPage = <T>(
  fetchPage: (params: Record<string, unknown>) => Promise<{ items: T[], total: number, totalPage: number }>,
  buildParams: () => Record<string, unknown>,
  initialPerPage = 10,
) => {
  const rows = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const totalPage = ref(1)
  const page = ref(1)
  const perPage = ref(initialPerPage)
  const loading = ref(false)

  const { notifyApiError } = useApiErrorNotifier()

  const fetch = async () => {
    loading.value = true
    try {
      const result = await fetchPage({ page: page.value, per_page: perPage.value, ...buildParams() })
      rows.value = result.items
      total.value = result.total
      totalPage.value = result.totalPage
    } catch (err) {
      // Every caller (onMounted, page/per-page change, debounced search) invokes
      // `fetch()` fire-and-forget with no `.catch()` of its own — handle it once
      // here instead of requiring every call site to remember to.
      notifyApiError(err)
    } finally {
      loading.value = false
    }
  }

  // Any filter/search/sort change should snap back to page 1 — the previous
  // page number may no longer exist under the new filter.
  const refetchFromStart = () => {
    page.value = 1
    fetch()
  }

  let searchDebounce: ReturnType<typeof setTimeout> | undefined
  const refetchDebounced = (delay = 400) => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(refetchFromStart, delay)
  }

  const onChangePage = (value: number) => {
    page.value = value
    fetch()
  }

  const onChangePerPage = (value: number) => {
    page.value = 1
    perPage.value = value
    fetch()
  }

  return {
    rows,
    total,
    totalPage,
    page,
    perPage,
    loading,
    fetch,
    refetchFromStart,
    refetchDebounced,
    onChangePage,
    onChangePerPage,
  }
}
