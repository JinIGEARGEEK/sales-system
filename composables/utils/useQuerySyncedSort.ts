import type { Ref } from 'vue'

export type SortDirection = 'asc' | 'desc'

// A list page's TableData sort, kept in the URL as one `sort` key —
// `?sort=name` (ascending) or `?sort=-name` (descending), the same sign
// convention the API's own `sort` param uses — so a refresh, a shared link or
// a back-button return restores it. The field is TableData's column `field`
// (the page maps it to the API's column name in buildParams). Bind
// `:sort-field`/`:sort-dir` on TableData so its header icons follow the URL,
// and `@sort="onSort"`.
//
// `onChange` runs after every sort change, whether from a header click or
// the URL moving (back/forward) — usually the page's refetchFromStart.
export const useQuerySyncedSort = (onChange?: () => void, key = 'sort') => {
  const raw = useQuerySyncedRef(key, '')

  const sortField = computed(() => raw.value.replace(/^-/, ''))
  const sortDir = computed<SortDirection>(() => (raw.value.startsWith('-') ? 'desc' : 'asc'))

  const onSort = (field: string, direction: SortDirection) => {
    raw.value = field ? `${direction === 'desc' ? '-' : ''}${field}` : ''
  }

  if (onChange) watch(raw, () => onChange())

  return { sortField, sortDir, onSort, sortQuery: raw as Ref<string> }
}
