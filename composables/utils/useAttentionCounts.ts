// Shared "needs attention" counts — extracted from pages/crm/reports/index.vue
// so the same live counts (and badge coloring) can also back the Dashboard's
// Risk Alerts widget (components/Dashboard/RiskAlerts.vue) without a second,
// independently-drifting definition. Pure lift-and-share: behavior is
// unchanged from what reports/index.vue did inline before.
//
// key -> report endpoint, for the live count fetch below.
const ATTENTION_ENDPOINTS: Record<string, string> = {
  stalledDeals: '/reports/stalled-deals',
  outstandingBalance: '/reports/outstanding-balance',
  quotesExpiringSoon: '/reports/quotes-expiring-soon',
  contractsStuck: '/reports/contracts-stuck',
  projectsAtRisk: '/reports/projects-at-risk',
}

export const badgeColor = (count: number | null | undefined) => {
  if (!count) return 'neutral'
  if (count >= 5) return 'error'
  return 'warning'
}

export const useAttentionCounts = () => {
  const { $api } = useNuxtApp()

  // Starts every count at null so the badge renders as a loading skeleton until
  // its request resolves — keeps "not checked yet" visually distinct from a
  // genuine zero.
  const counts = ref<Record<string, number | null>>(
    Object.fromEntries(Object.keys(ATTENTION_ENDPOINTS).map(key => [key, null])),
  )

  const fetchCounts = () => {
    for (const [key, path] of Object.entries(ATTENTION_ENDPOINTS)) {
      $api.get<ApiResponse<unknown[]>>(path)
        .then((response) => { counts.value[key] = response.data.data.length })
        .catch(() => { counts.value[key] = 0 /* treat a failed count as "nothing to flag" rather than stuck loading */ })
    }
  }

  return { counts, fetchCounts, ATTENTION_ENDPOINTS }
}
