// Shared "server-paginated list page" plumbing for the Leads/Contacts/Companies
// list pages and the Deals table view. Each page still owns its own search/filter
// refs and column definitions — this only centralizes the repeated bit: page/
// per-page state, an in-flight `loading` flag, and a debounced-on-search refetch
// that always resets back to page 1 whenever a filter changes (so you never land
// on an empty "page 3 of 1" after narrowing a search).
//
// `syncQuery: true` (added 2026-10-01; every list page passes it) keeps
// page/per-page in the URL as `?page=` / `?per_page=` (useQuerySyncedNumber;
// the defaults are left out), so a refresh, a shared link or a back-button
// return from a detail page lands on the same page. A page/per-page change
// that comes from the URL itself (browser back/forward) refetches; one made
// through onChangePage/onChangePerPage/refetchFromStart isn't fetched twice.
// Leave it off for a list that isn't the page's main one (a detail page's
// tab, a component listed twice on one page), whose keys would collide.
export const useServerListPage = <T>(
  fetchPage: (params: Record<string, unknown>) => Promise<{ items: T[], total: number, totalPage: number }>,
  buildParams: () => Record<string, unknown>,
  initialPerPage = 10,
  options: { syncQuery?: boolean } = {},
) => {
  const rows = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const totalPage = ref(1)
  const page: Ref<number> = options.syncQuery ? useQuerySyncedNumber('page', 1) : ref(1)
  const perPage: Ref<number> = options.syncQuery ? useQuerySyncedNumber('per_page', initialPerPage) : ref(initialPerPage)
  const loading = ref(false)

  const { notifyApiError } = useApiErrorNotifier()

  // The page/per-page the latest fetch() asked for — `null` until the first
  // one, so a URL-driven change before the page's own initial fetch doesn't
  // fire a second request.
  let fetchedPage: number | null = null
  let fetchedPerPage: number | null = null

  const fetch = async () => {
    fetchedPage = page.value
    fetchedPerPage = perPage.value
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
  let searchDebounce: ReturnType<typeof setTimeout> | undefined
  let fetchedThisTick = false
  const refetchFromStart = () => {
    // An immediate fetch already reads the current search, so it supersedes a
    // debounced one pending or requested in the same tick (e.g. Clear filters).
    clearTimeout(searchDebounce)
    if (!fetchedThisTick) {
      fetchedThisTick = true
      nextTick(() => { fetchedThisTick = false })
    }
    page.value = 1
    fetch()
  }

  const refetchDebounced = (delay = 400) => {
    clearTimeout(searchDebounce)
    if (fetchedThisTick) return
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

  if (options.syncQuery) {
    watch([page, perPage], ([nextPage, nextPerPage]) => {
      if (fetchedPage === null) return
      if (nextPage !== fetchedPage || nextPerPage !== fetchedPerPage) fetch()
    })
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
