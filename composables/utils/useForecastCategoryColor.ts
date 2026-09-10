// Shared Forecast Category coloring for the Deal create/detail forms and the
// dashboard's Forecast Breakdown widget — mirrors useDealStageColor's
// shape/naming so both "which color does this Deal concept map to" helpers
// look the same at a glance.
export const useForecastCategoryColor = () => {
  const forecastCategoryColor = (category: string): 'success' | 'warning' | 'neutral' => {
    if (category === 'Commit') return 'success'
    if (category === 'Best Case') return 'warning'
    return 'neutral'
  }

  return { forecastCategoryColor }
}
