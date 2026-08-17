// Shared stage-badge coloring for the Deal detail header, DealsTable, and the
// Kanban board — driven by the PipelineStage row's is_won_stage/is_lost_stage
// flags (from usePipelineStagesStore) instead of a hardcoded `stage === 'Won'`
// string check, so a custom Admin-added stage can render as won/lost too.
// Falls back to the literal "Won"/"Lost" names if the store hasn't loaded yet
// (or a row is missing) so nothing regresses before the store is populated.
export const useDealStageColor = () => {
  const pipelineStagesStore = usePipelineStagesStore()

  const stageBadgeColor = (stage: string): 'success' | 'error' | 'neutral' => {
    const row = pipelineStagesStore.byName(stage)
    if (row) {
      if (row.is_won_stage) return 'success'
      if (row.is_lost_stage) return 'error'
      return 'neutral'
    }
    if (stage === 'Won') return 'success'
    if (stage === 'Lost') return 'error'
    return 'neutral'
  }

  return { stageBadgeColor }
}
