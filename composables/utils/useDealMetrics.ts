// Open-deal count and value for a list of Deals (the Company detail page's
// header). Won/win-rate/average figures come from the API's
// /dashboard/summary, which counts wins by won_at — don't recompute them
// here from a client-side list.
export const useDealMetrics = (getDeals: () => Deal[]) => {
  const openDeals = computed(() => getDeals().filter(d => d.status === 'open'))
  const openValue = computed(() => openDeals.value.reduce((sum, d) => sum + d.value, 0))

  return { openDeals, openValue }
}
