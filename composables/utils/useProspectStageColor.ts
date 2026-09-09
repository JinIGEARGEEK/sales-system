// Shared status-badge coloring for the Prospect list/detail pages — driven
// by the ProspectStage row's is_disqualified_stage flag (from
// useProspectStagesStore) instead of a hardcoded `status === 'Disqualified'`
// string check, so a custom Admin-renamed stage still colors correctly.
// Mirrors useDealStageColor.ts's pattern. "Converted" stays a reserved
// literal (never a row in the stages table — see ProspectStage's own doc).
// "Engaging" keeps its own literal-name 'info' color — a purely cosmetic
// default with no functional dependency (unlike Disqualified, which also
// gates the "Convert to Lead" action), so it isn't worth a dedicated flag;
// same accepted limitation an unflagged custom Deal stage already has,
// falling to 'neutral'.
export const useProspectStageColor = () => {
  const prospectStagesStore = useProspectStagesStore()

  const statusBadgeColor = (status: string): 'success' | 'error' | 'info' | 'neutral' => {
    if (status === 'Converted') return 'success'
    const row = prospectStagesStore.byName(status)
    if (row) {
      if (row.is_disqualified_stage) return 'error'
      return status === 'Engaging' ? 'info' : 'neutral'
    }
    if (status === 'Disqualified') return 'error'
    if (status === 'Engaging') return 'info'
    return 'neutral'
  }

  return { statusBadgeColor }
}
