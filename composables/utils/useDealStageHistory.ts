// Surfaces Deal pipeline stage-change history (from the audit log) as
// read-only reference context alongside manually-logged Activities — the
// two are deliberately separate backend concepts (Activity = a rep logging
// a call/email/meeting; AuditLogEntry = the system recording a field
// change), but reps asked to see stage-change history "in Activities" too.
//
// GET /audit-log is now open to Sales Rep/Sales Manager (not just Admin),
// but internal/handlers/auditlog.go hard-restricts what a non-Admin caller
// can see to exactly this: entity_type=deal, action=stage_changed. Calling
// it any other way as a non-Admin silently gets the same restricted result
// regardless of the params sent, so this composable only ever needs to pass
// entity_id (optional) and paging — reassignment history and every other
// entity type stay behind the Admin-only audit viewer.
export const useDealStageHistory = () => {
  const { $api } = useNuxtApp()
  const teamMembersStore = useTeamMembersStore()

  const fetchDealStageHistory = async (dealId?: number): Promise<DealStageChangeEntry[]> => {
    if (teamMembersStore.items.length === 0) await teamMembersStore.fetchAll()
    const response = await $api.get<ApiResponse<AuditLogEntry[]>>('/audit-log', {
      params: {
        entity_type: 'deal',
        action: 'stage_changed',
        ...(dealId ? { entity_id: dealId } : {}),
        per_page: 200,
        sort: '-created_at',
      },
    })
    return response.data.data.map(entry => ({
      id: entry.id,
      dealId: entry.entity_id,
      fromStage: (entry.before?.stage as string | undefined) ?? null,
      toStage: entry.after?.stage as string,
      actorName: teamMembersStore.nameById(entry.actor_id),
      created_at: new Date(entry.created_at),
    }))
  }

  return { fetchDealStageHistory }
}
