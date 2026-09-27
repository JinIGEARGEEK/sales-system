// Lead Scoring is optional (FR-CRM-006) — with no active criteria every Lead
// scores 0, and a "0" badge is just noise. Admins can read the criteria list
// (GET /admin/lead-scoring-criteria is adminOnly), so for them the score also
// shows whenever any criterion is active. A Lead with a score or a manual
// MQL/SQL mark shows it regardless. Shared by the Leads list's
// Classification column and the Lead detail page's header score badge.
export const useLeadScoreVisibility = (leads: () => Lead[]) => {
  const { hasRole } = useRole()
  const leadScoringCriteriaStore = useLeadScoringCriteriaStore()
  const criteriaLoaded = ref(false)

  onMounted(() => {
    if (!hasRole('Admin')) return
    // Failure is non-fatal (visibility just falls back to the Lead-based
    // check), so no error toast for a config read the page doesn't need.
    leadScoringCriteriaStore.fetchAll().then(() => { criteriaLoaded.value = true }).catch(() => {})
  })

  const showScore = computed(() =>
    (criteriaLoaded.value && leadScoringCriteriaStore.items.some(c => c.is_active))
    || leads().some(lead => (lead.score ?? 0) > 0 || lead.classification === 'mql' || lead.classification === 'sql'),
  )

  return { showScore }
}
