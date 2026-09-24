// Real API-backed store for the Admin-configurable app settings singleton
// (/admin/settings) — currently just the quarterly sales quota (FR-CRM-058),
// previously hardcoded in the dashboard summary handler. Unlike
// pipelineStages/leadSources (row-per-option config), this is a single
// key-value-style row (always id 1), so there's no add/remove — only
// fetchAll (loads the one row) and update (PATCHes it).
export const useAppSettingsStore = defineStore('appSettings', {
  state: () => ({
    settings: null as AppSettings | null,
  }),
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<AppSettings>>('/admin/settings')
      this.settings = response.data.data
      return this.settings
    },
    // GET /admin/weekly-digest/preview — Monday's email as it would go out
    // now, without sending it.
    async previewWeeklyDigest (): Promise<WeeklyDigestPreview> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<WeeklyDigestPreview>>('/admin/weekly-digest/preview')
      return response.data.data
    },
    // POST /admin/weekly-digest/test — emails the current digest to the
    // signed-in Admin only; returns the address it went to.
    async sendWeeklyDigestTest (): Promise<string> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<{ sent_to: string }>>('/admin/weekly-digest/test')
      return response.data.data.sent_to
    },
    async update (changes: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<AppSettings>>('/admin/settings', changes)
      this.settings = response.data.data
      return this.settings
    },
  },
})
