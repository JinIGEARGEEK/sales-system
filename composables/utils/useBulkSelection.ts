// Shared "select rows for bulk action" state used by the Deals table and the
// Leads list page. Both toggle a select-mode flag that swaps in a SELECTED
// column (see TABLE_CARD_TYPE.SELECTED) and reset the selection whenever that
// mode is toggled off/on, so this only centralizes the plumbing — each page
// still owns its own bulk-action API calls (bulkReassign/bulkTag/bulkArchive),
// since those differ by store and success-toast copy.
export const useBulkSelection = <T extends { id: number }>() => {
  const isSelectMode = ref(false)
  const selected = ref<T[]>([]) as Ref<T[]>
  const selectedIds = computed(() => selected.value.map(item => item.id))

  const toggleSelectMode = () => {
    isSelectMode.value = !isSelectMode.value
    selected.value = []
  }

  const clearSelection = () => {
    selected.value = []
  }

  return { isSelectMode, selected, selectedIds, toggleSelectMode, clearSelection }
}
