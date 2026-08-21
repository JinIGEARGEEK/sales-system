// Real API-backed store for the Admin-configurable workflow notification rules
// list (/admin/notification-rules, FR-CRM-100/101/102) — clone of
// leadScoringCriteria.ts's pattern. Delete is a *soft* delete: the DELETE
// endpoint returns 204 and flips `is_active` to false server-side, so we patch
// that locally instead of splicing the record out.
const parseDates = (rule: NotificationRule): NotificationRule => ({
  ...rule,
  created_at: new Date(rule.created_at),
})

export const useNotificationRulesStore = defineStore('notificationRules', {
  state: () => ({
    items: [] as NotificationRule[],
  }),
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<NotificationRule[]>>('/admin/notification-rules')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (rule: Omit<NotificationRule, 'id' | 'created_at'>): Promise<NotificationRule> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<NotificationRule>>('/admin/notification-rules', rule)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<NotificationRule, 'id' | 'created_at'>>): Promise<NotificationRule> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<NotificationRule>>(`/admin/notification-rules/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(r => r.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/notification-rules/${id}`)
      const rule = this.items.find(r => r.id === id)
      if (rule) rule.is_active = false
    },
  },
})
