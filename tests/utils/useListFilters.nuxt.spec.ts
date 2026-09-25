import { describe, it, expect, vi, afterEach } from 'vitest'
import { nextTick, ref, watch } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useListFilters } from '~/composables/utils/useListFilters'
import { useServerListPage } from '~/composables/utils/useServerListPage'

// useServerListPage's error toast needs a component setup context (useI18n).
mockNuxtImport('useApiErrorNotifier', () => () => ({ notifyApiError: vi.fn() }))

afterEach(() => {
  vi.useRealTimers()
})

describe('useListFilters', () => {
  it('reports no active filters at their defaults', () => {
    const search = ref('')
    const status = ref('all')
    const { hasActive, secondaryCount } = useListFilters({ search, filters: [{ ref: status }] })
    expect(hasActive.value).toBe(false)
    expect(secondaryCount.value).toBe(0)
  })

  it('counts search, primary and secondary filters', () => {
    const search = ref('')
    const status = ref('all')
    const source = ref('all')
    const tag = ref('all')
    const { hasActive, secondaryCount } = useListFilters({
      search,
      filters: [{ ref: status }, { ref: source, secondary: true }, { ref: tag, secondary: true }],
    })

    search.value = 'acme'
    expect(hasActive.value).toBe(true)
    expect(secondaryCount.value).toBe(0)

    search.value = ''
    status.value = 'open'
    expect(hasActive.value).toBe(true)
    expect(secondaryCount.value).toBe(0)

    source.value = 'web'
    tag.value = 'vip'
    expect(secondaryCount.value).toBe(2)
  })

  it('honours custom defaults, including getter defaults', () => {
    const scope = ref('active')
    const days = ref('14')
    const fallback = ref('14')
    const { hasActive, clear } = useListFilters({
      filters: [{ ref: scope, default: 'active' }, { ref: days, default: () => fallback.value }],
    })
    expect(hasActive.value).toBe(false)

    days.value = '30'
    expect(hasActive.value).toBe(true)

    clear()
    expect(days.value).toBe('14')
    expect(scope.value).toBe('active')
  })

  it('ignores a filter while its enabled() guard is false', () => {
    const scope = ref('converted')
    const status = ref('Qualified')
    const { hasActive } = useListFilters({
      filters: [{ ref: status, enabled: () => scope.value === 'active' }],
    })
    expect(hasActive.value).toBe(false)

    scope.value = 'active'
    expect(hasActive.value).toBe(true)
  })

  it('clear() resets search and every filter, then calls onCleared', () => {
    const search = ref('acme')
    const status = ref('open')
    const source = ref('web')
    const onCleared = vi.fn()
    const { clear, hasActive } = useListFilters({
      search,
      filters: [{ ref: status }, { ref: source, secondary: true }],
      onCleared,
    })

    clear()
    expect(search.value).toBe('')
    expect(status.value).toBe('all')
    expect(source.value).toBe('all')
    expect(hasActive.value).toBe(false)
    expect(onCleared).toHaveBeenCalledOnce()
  })

  it('clear() with an active search and filter fetches once, not twice', async () => {
    vi.useFakeTimers()
    const search = ref('acme')
    const status = ref('open')
    const fetchPage = vi.fn().mockResolvedValue({ items: [], total: 0, totalPage: 1 })
    const { refetchDebounced, refetchFromStart } = useServerListPage(fetchPage, () => ({ search: search.value, status: status.value }))
    // Same wiring as the list pages.
    watch(search, () => refetchDebounced())
    watch(status, () => refetchFromStart())

    const { clear } = useListFilters({ search, filters: [{ ref: status }] })
    clear()
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)

    expect(fetchPage).toHaveBeenCalledOnce()
    expect(fetchPage).toHaveBeenCalledWith(expect.objectContaining({ page: 1, search: '', status: 'all' }))
  })

  it('clear() with only a search active still refetches after the debounce', async () => {
    vi.useFakeTimers()
    const search = ref('acme')
    const status = ref('all')
    const fetchPage = vi.fn().mockResolvedValue({ items: [], total: 0, totalPage: 1 })
    const { refetchDebounced, refetchFromStart } = useServerListPage(fetchPage, () => ({ search: search.value }))
    watch(search, () => refetchDebounced())
    watch(status, () => refetchFromStart())

    const { clear } = useListFilters({ search, filters: [{ ref: status }] })
    clear()
    await nextTick()
    expect(fetchPage).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(400)
    expect(fetchPage).toHaveBeenCalledOnce()
  })
})
