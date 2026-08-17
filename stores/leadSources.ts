// Real API-backed store for the Admin-configurable lead/deal source list
// (/admin/lead-sources) — replaces the previously hardcoded CHANNEL_OPTIONS
// constant as the source of truth for what sources exist (shared by
// Lead.source and Deal.channel). Delete is a *soft* delete: the DELETE
// endpoint returns 204 and flips `is_active` to false server-side, so we
// patch that locally instead of splicing the record out.
const parseDates = (source: LeadSourceOption): LeadSourceOption => ({
  ...source,
  created_at: new Date(source.created_at),
})

export const useLeadSourcesStore = defineStore('leadSources', {
  state: () => ({
    items: [] as LeadSourceOption[],
  }),
  getters: {
    activeOptions: (state): Select[] => state.items
      .filter(s => s.is_active)
      .map(s => ({ label: s.name, value: s.name })),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<LeadSourceOption[]>>('/admin/lead-sources')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (source: Omit<LeadSourceOption, 'id' | 'created_at'>): Promise<LeadSourceOption> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<LeadSourceOption>>('/admin/lead-sources', source)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<LeadSourceOption, 'id' | 'created_at'>>): Promise<LeadSourceOption> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<LeadSourceOption>>(`/admin/lead-sources/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(s => s.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/lead-sources/${id}`)
      const source = this.items.find(s => s.id === id)
      if (source) source.is_active = false
    },
  },
})
