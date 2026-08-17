// Real API-backed store. GET /audit-log is Admin-only and append-only —
// there are no write actions here (NFR-007), just server-paginated reads
// with entity_type/entity_id/actor_id/date_from/date_to filters.
const parseDates = (entry: AuditLogEntry): AuditLogEntry => ({
  ...entry,
  created_at: new Date(entry.created_at),
})

export const useAuditLogStore = defineStore('auditLog', {
  state: () => ({
    items: [] as AuditLogEntry[],
    total: 0,
    page: 1,
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<AuditLogEntry[]>>('/audit-log', {
        params: { per_page: 20, sort: '-created_at', ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
  },
})
