import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'

// mountSuspended doesn't install vue-i18n, which the error notifier needs.
mockNuxtImport('useApiErrorNotifier', () => () => ({ notifyApiError: vi.fn() }))

const settle = async () => {
  await nextTick()
  await flushPromises()
  await nextTick()
}

type ListPage = ReturnType<typeof useServerListPage<{ id: number }>>
type SortState = ReturnType<typeof useQuerySyncedSort>

// /login: a public route, so the auth middleware leaves the test router's
// query alone (same as tests/utils/useQuerySyncedRef.nuxt.spec.ts).
const mountList = async (route = '/login', syncQuery = true) => {
  const fetchPage = vi.fn(async () => ({ items: [{ id: 1 }], total: 50, totalPage: 5 }))
  let list!: ListPage
  let sort!: SortState
  const Harness = defineComponent({
    setup () {
      sort = useQuerySyncedSort(() => list.refetchFromStart())
      list = useServerListPage<{ id: number }>(fetchPage, () => ({ sort: sort.sortQuery.value || undefined }), 10, { syncQuery })
      onMounted(() => list.fetch())
      return () => h('div')
    },
  })
  await mountSuspended(Harness, { route })
  await settle()
  return { fetchPage, list: () => list, sort: () => sort }
}

describe('useServerListPage with syncQuery', () => {
  beforeEach(async () => {
    await useRouter().replace({ path: '/login', query: {} })
    await settle()
  })

  it('seeds page/per-page from the URL on the first fetch', async () => {
    const { fetchPage, list } = await mountList('/login?page=3&per_page=20')
    expect(list().page.value).toBe(3)
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(expect.objectContaining({ page: 3, per_page: 20 }))
  })

  it('falls back to the defaults for a missing or junk value', async () => {
    const { list } = await mountList('/login?page=abc')
    expect(list().page.value).toBe(1)
    expect(list().perPage.value).toBe(10)
  })

  it('writes a page change to the URL and fetches it once', async () => {
    const router = useRouter()
    const { fetchPage, list } = await mountList()
    list().onChangePage(2)
    await vi.waitFor(() => expect(router.currentRoute.value.query.page).toBe('2'))
    await settle()
    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('refetches when the URL page changes underneath it (back/forward)', async () => {
    const router = useRouter()
    const { fetchPage, list } = await mountList()
    await router.push({ query: { page: '4' } })
    await settle()
    expect(list().page.value).toBe(4)
    expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 4 }))
  })

  it('a filter/sort change resets to page 1 and drops ?page', async () => {
    const router = useRouter()
    const { fetchPage, list, sort } = await mountList('/login?page=3')
    sort().onSort('name', 'desc')
    await vi.waitFor(() => expect(router.currentRoute.value.query.sort).toBe('-name'))
    await vi.waitFor(() => expect(router.currentRoute.value.query.page).toBeUndefined())
    await settle()
    expect(list().page.value).toBe(1)
    expect(sort().sortField.value).toBe('name')
    expect(sort().sortDir.value).toBe('desc')
    expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, sort: '-name' }))
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('reads an ascending sort from the URL', async () => {
    const { sort } = await mountList('/login?sort=created_at')
    expect(sort().sortField.value).toBe('created_at')
    expect(sort().sortDir.value).toBe('asc')
  })

  it('keeps page state local without syncQuery', async () => {
    const router = useRouter()
    const { list } = await mountList('/login', false)
    list().onChangePage(2)
    await settle()
    expect(router.currentRoute.value.query.page).toBeUndefined()
  })
})
