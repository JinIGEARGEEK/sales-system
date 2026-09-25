import type { Ref } from 'vue'

export interface ListFilter {
  ref: Ref<string>
  // The "no filter" value — `'all'` unless given.
  default?: string | (() => string)
  // Collapsed behind CrmMoreFilters below md; counted by `secondaryCount`.
  secondary?: boolean
  // Counts as active only while this returns true (e.g. a filter hidden in the current scope).
  enabled?: () => boolean
}

// A list page's "any filter active?" / "Clear filters" / "More filters (n)" state.
// Refetching stays with the page's own watchers: useServerListPage coalesces the
// search watcher's debounced refetch into the filters' immediate one, so clear()
// fetches once.
export const useListFilters = ({ search, filters, onCleared }: {
  search?: Ref<string>
  filters: ListFilter[]
  onCleared?: () => void
}) => {
  const defaultOf = (filter: ListFilter) =>
    typeof filter.default === 'function' ? filter.default() : (filter.default ?? 'all')
  const isActive = (filter: ListFilter) =>
    filter.ref.value !== defaultOf(filter) && (filter.enabled?.() ?? true)

  const secondaryCount = computed(() => filters.filter(f => f.secondary && isActive(f)).length)
  const hasActive = computed(() => (search ? search.value !== '' : false) || filters.some(isActive))

  const clear = () => {
    if (search) search.value = ''
    for (const filter of filters) filter.ref.value = defaultOf(filter)
    onCleared?.()
  }

  return { secondaryCount, hasActive, clear }
}
