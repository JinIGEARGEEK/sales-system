// Real API-backed store for GET /notification-log — recent NotificationRule
// firings, in-app (dashboard "Recent Alerts" widget). Read-only, no
// add/update/remove — this mirrors a log, it isn't a resource the frontend
// ever creates or edits.
const parseDates = (firing: NotificationFiring): NotificationFiring => ({
  ...firing,
  notified_at: new Date(firing.notified_at),
})

export const useNotificationLogStore = defineStore('notificationLog', {
  state: () => ({
    items: [] as NotificationFiring[],
  }),
  actions: {
    async fetchRecent (): Promise<NotificationFiring[]> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<NotificationFiring[]>>('/notification-log')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
  },
})
