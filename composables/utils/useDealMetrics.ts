export const useDealMetrics = (getDeals: () => Deal[]) => {
  const openDeals = computed(() => getDeals().filter(d => d.status === 'open'))
  const wonDeals = computed(() => getDeals().filter(d => d.status === 'won'))
  const lostDeals = computed(() => getDeals().filter(d => d.status === 'lost'))

  const openValue = computed(() => openDeals.value.reduce((sum, d) => sum + d.value, 0))
  const wonValue = computed(() => wonDeals.value.reduce((sum, d) => sum + d.value, 0))
  const winRate = computed(() => {
    const closed = wonDeals.value.length + lostDeals.value.length
    return closed === 0 ? 0 : Math.round((wonDeals.value.length / closed) * 100)
  })

  const avgDealSize = computed(() => {
    return wonDeals.value.length === 0 ? 0 : wonValue.value / wonDeals.value.length
  })

  const avgSalesCycleDays = computed(() => {
    const cycles = wonDeals.value
      .filter(d => d.expected_close_date !== null)
      .map(d => (new Date(d.expected_close_date!).getTime() - new Date(d.created_at).getTime()) / 86400000)
    return cycles.length === 0 ? 0 : Math.round(cycles.reduce((sum, days) => sum + days, 0) / cycles.length)
  })

  return {
    openDeals,
    wonDeals,
    lostDeals,
    openValue,
    wonValue,
    winRate,
    avgDealSize,
    avgSalesCycleDays,
  }
}
