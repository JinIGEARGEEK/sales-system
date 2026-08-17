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
    async update (changes: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<AppSettings>>('/admin/settings', changes)
      this.settings = response.data.data
      return this.settings
    },
  },
})
