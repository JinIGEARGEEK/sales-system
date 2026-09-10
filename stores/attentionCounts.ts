// Single source of truth for the "needs attention" metrics shared by
// pages/crm/reports/index.vue's own section and the Dashboard's Risk Alerts
// widget (components/Dashboard/RiskAlerts.vue) — previously the 5-metric
// catalog (key/path/icon/endpoint) was hand-duplicated across both call
// sites plus the fetch logic itself; a rename/add/remove had nothing forcing
// the two to stay in sync. Now both map over ATTENTION_ITEMS and derive
// title/description from `crm.reports.<key>.cardTitle`/`cardDescription`
// (the key IS the i18n namespace segment), so there's exactly one list.
//
// A real Pinia store (not a plain composable) so the counts are fetched once
// and shared/cached across navigations the same way the rest of the app's
// domain data is — visiting Dashboard then Reports (or back and forth)
// reuses the same fetch instead of re-issuing all 5 GETs every time.
export interface AttentionItem {
  key: string
  path: string
  icon: string
  endpoint: string
}

export const ATTENTION_ITEMS: AttentionItem[] = [
  { key: 'stalledDeals', path: '/crm/reports/stalled-deals', icon: 'material-symbols:hourglass-empty', endpoint: '/reports/stalled-deals' },
  { key: 'outstandingBalance', path: '/crm/reports/outstanding-balance', icon: 'material-symbols:request-quote-outline', endpoint: '/reports/outstanding-balance' },
  { key: 'quotesExpiringSoon', path: '/crm/reports/quotes-expiring-soon', icon: 'material-symbols:schedule-outline', endpoint: '/reports/quotes-expiring-soon' },
  { key: 'contractsStuck', path: '/crm/reports/contracts-stuck', icon: 'material-symbols:draft-outline', endpoint: '/reports/contracts-stuck' },
  { key: 'projectsAtRisk', path: '/crm/reports/projects-at-risk', icon: 'material-symbols:engineering-outline', endpoint: '/reports/projects-at-risk' },
]

export const badgeColor = (count: number | null | undefined) => {
  if (!count) return 'neutral'
  if (count >= 5) return 'error'
  return 'warning'
}

export const useAttentionCountsStore = defineStore('attentionCounts', {
  state: () => ({
    // Starts every count at null so the badge renders as a loading skeleton
    // until its request resolves — keeps "not checked yet" visually distinct
    // from a genuine zero. A failed request also settles to 0 (treated as
    // "nothing to flag" rather than stuck loading) — same tradeoff this
    // logic already made before being shared across two widgets.
    counts: Object.fromEntries(ATTENTION_ITEMS.map(item => [item.key, null])) as Record<string, number | null>,
    fetched: false,
  }),
  actions: {
    fetchCounts () {
      if (this.fetched) return
      this.fetched = true
      const { $api } = useNuxtApp()
      for (const item of ATTENTION_ITEMS) {
        $api.get<ApiResponse<unknown[]>>(item.endpoint)
          .then((response) => { this.counts[item.key] = response.data.data.length })
          .catch(() => { this.counts[item.key] = 0 })
      }
    },
  },
})
