// Search-as-you-type + resolve-by-id factory for an InputAsyncSelect bound to
// a store-backed record (Deal/Contact/Prospect/...). Extracted out of
// useRelatedRecordPicker.ts so a second, unrelated picker (useReferralPicker)
// can reuse the same shape without pulling in that composable's Deal/
// Prospect-specific branches it doesn't need.
export function useAsyncRecordPicker<T extends { id: number }> (
  fetchList: (params: { search?: string, per_page: number, sort: string }) => Promise<{ items: T[] }>,
  fetchOne: (id: number) => Promise<T>,
  labelOf: (item: T) => string,
  sortField: string,
) {
  const search = async (term: string): Promise<Select[]> => {
    const { items } = await fetchList({ search: term || undefined, per_page: 20, sort: sortField })
    return items.map(item => ({ label: labelOf(item), value: item.id }))
  }
  const resolve = async (id: number): Promise<Select | null> => {
    const item = await fetchOne(id)
    return { label: labelOf(item), value: item.id }
  }
  return { search, resolve }
}
