// Shared Forecast Category coloring for the Deal create/detail forms — a
// plain function (not a composable factory like useDealStageColor) since it
// captures no reactive dependency of its own. Takes the real ForecastCategory
// union (not a bare string) so a typo'd/renamed category value fails at
// type-check time instead of silently falling through to 'neutral'.
//
// Note: components/Dashboard/ForecastBreakdown.vue does NOT consume this —
// its per-category colors are baked into each CrmStatCard's own
// icon/icon-bg/accent-glass classes (a richer shape than the single semantic
// color name this returns), so the two are deliberately separate, not a
// missed reuse.
export const forecastCategoryColor = (category: ForecastCategory): 'success' | 'warning' | 'neutral' => {
  if (category === 'Commit') return 'success'
  if (category === 'Best Case') return 'warning'
  return 'neutral'
}
