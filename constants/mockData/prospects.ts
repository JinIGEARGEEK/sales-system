// 'Converted' is a reserved, system-set terminal status — excluded from the
// admin-configurable ProspectStage table entirely (see its own doc) and set
// only by POST /prospects/:id/convert, never chosen directly in the
// create/edit form or the Kanban board's drop targets.
export const PROSPECT_CONVERTED_STATUS = 'Converted'

// Prospect statuses are now admin-configurable (ProspectStage,
// /admin/prospect-stages, stores/prospectStages.ts) — replacing what used to
// be the hardcoded PROSPECT_STATUS_OPTIONS/PROSPECT_STATUS_FORM_OPTIONS/
// PROSPECT_STATUS_COLORS constants here. Callers now build their columns/
// filter options from useProspectStagesStore().activeOptions (plus an
// appended read-only PROSPECT_CONVERTED_STATUS entry where the Kanban board
// or a filter needs it) instead of importing a fixed list from this file.
// Status badge coloring moved to composables/utils/useProspectStageColor.ts
// (a plain function here couldn't resolve a renamed "Disqualified" stage
// against the store — see that composable's own doc).

// ── Duplicate detection (mirrors findDuplicateLeads) ─────────────────────

export const findDuplicateProspects = (prospects: Prospect[], email: string, phone: string, excludeId?: number): Prospect[] => {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()
  if (!normalizedEmail && !normalizedPhone) return []

  return prospects.filter((prospect) => {
    if (prospect.id === excludeId) return false
    const emailMatch = !!normalizedEmail && prospect.email.trim().toLowerCase() === normalizedEmail
    const phoneMatch = !!normalizedPhone && prospect.phone.trim() === normalizedPhone
    return emailMatch || phoneMatch
  })
}
