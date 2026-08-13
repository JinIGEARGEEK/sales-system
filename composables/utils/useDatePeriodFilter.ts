// Quick-select period presets (this month/quarter/year, last 6/12 months) backed by a single
// `dateRange` value. Presets are computed on demand from `presetRange()` rather than stored,
// so `activePreset` can be derived by comparing it to the current `dateRange` — there is no
// separate "selected preset" state to fall out of sync when the range is edited manually.
export const useDatePeriodFilter = (getDeals: () => Deal[], presetValues: string[]) => {
  const dateRange = ref<{ start: string; end: string } | null>(null)

  // Anchoring to the real current date would make every preset empty once the underlying
  // data ages, so the window is anchored to the most recent deal activity instead.
  const anchorDate = computed(() => {
    const allDates = getDeals().flatMap(d => [d.created_at, d.expected_close_date].filter(Boolean) as Date[])
    return allDates.length ? new Date(Math.max(...allDates.map(d => new Date(d).getTime()))) : new Date()
  })

  const toDateInputValue = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const presetRange = (value: string): { start: string; end: string } | null => {
    const anchor = anchorDate.value
    switch (value) {
      case 'month':
        return { start: toDateInputValue(new Date(anchor.getFullYear(), anchor.getMonth(), 1)), end: toDateInputValue(anchor) }
      case 'quarter': {
        const quarterStartMonth = Math.floor(anchor.getMonth() / 3) * 3
        return { start: toDateInputValue(new Date(anchor.getFullYear(), quarterStartMonth, 1)), end: toDateInputValue(anchor) }
      }
      case 'year':
        return { start: toDateInputValue(new Date(anchor.getFullYear(), 0, 1)), end: toDateInputValue(anchor) }
      case 'last6':
        return { start: toDateInputValue(new Date(anchor.getFullYear(), anchor.getMonth() - 5, 1)), end: toDateInputValue(anchor) }
      case 'last12':
        return { start: toDateInputValue(new Date(anchor.getFullYear(), anchor.getMonth() - 11, 1)), end: toDateInputValue(anchor) }
      default:
        return null
    }
  }

  const activePreset = computed(() => {
    return presetValues.find((value) => {
      const range = presetRange(value)
      if (!range) return !dateRange.value
      return dateRange.value?.start === range.start && dateRange.value?.end === range.end
    }) ?? null
  })

  const applyPeriodPreset = (value: string) => {
    dateRange.value = presetRange(value)
  }

  // A deal's "activity date" is its close date once it has one, falling back to when it
  // entered the pipeline — this lets open deals still be counted by the period they were created in.
  const isDealInRange = (deal: Deal): boolean => {
    if (!dateRange.value) return true
    const date = new Date(deal.expected_close_date ?? deal.created_at)
    const start = new Date(dateRange.value.start)
    const end = new Date(new Date(dateRange.value.end).setHours(23, 59, 59, 999))
    return date >= start && date <= end
  }

  return {
    dateRange,
    activePreset,
    applyPeriodPreset,
    isDealInRange,
    anchorDate,
  }
}
