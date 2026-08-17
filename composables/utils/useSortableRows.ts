// Shared by the Companies/Contacts/Leads list pages and DealsTable — all four wire
// TableData's `@sort` event to the same "current field + direction, applied as a
// last computed step over the already-filtered/mapped rows" pattern. Centralized
// here instead of copy-pasted per page so the comparison logic (numeric vs. string,
// with an optional raw-date field for display-formatted date columns) only needs
// to be right once.
export const useSortableRows = () => {
  const sortField = ref('')
  const sortDir = ref<'asc' | 'desc'>('asc')

  const onSort = (field: string, direction: 'asc' | 'desc') => {
    sortField.value = field
    sortDir.value = direction
  }

  // `dateFields` maps a display field (e.g. "createdDate", a pre-formatted string)
  // to the raw Date-bearing field it should actually be compared by.
  const sortRows = <T extends Record<string, unknown>>(
    rows: T[],
    dateFields: Record<string, string> = {},
  ): T[] => {
    if (!sortField.value) return rows
    const field = sortField.value
    const dateSource = dateFields[field]
    return [...rows].sort((a, b) => {
      let comparison: number
      if (dateSource) {
        comparison = new Date(a[dateSource] as string | number | Date).getTime() - new Date(b[dateSource] as string | number | Date).getTime()
      } else {
        const aValue = a[field]
        const bValue = b[field]
        comparison = typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue ?? '').localeCompare(String(bValue ?? ''))
      }
      return sortDir.value === 'asc' ? comparison : -comparison
    })
  }

  return { sortField, sortDir, onSort, sortRows }
}
