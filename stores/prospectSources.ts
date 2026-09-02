// Real API-backed store for the Admin-configurable Prospect source list
// (/admin/prospect-sources) — Marketing's own funnel-source taxonomy,
// deliberately separate from stores/leadSources.ts's list (see
// ProspectSourceOption's doc in interfaces/crm.d.ts for why). Mirrors
// stores/leadSources.ts exactly otherwise, including the soft-delete
// (is_active flip) convention.
const parseDates = (source: ProspectSourceOption): ProspectSourceOption => ({
  ...source,
  created_at: new Date(source.created_at),
})

export const useProspectSourcesStore = defineStore('prospectSources', {
  state: () => ({
    items: [] as ProspectSourceOption[],
  }),
  getters: {
    activeOptions: (state): Select[] => state.items
      .filter(s => s.is_active)
      .map(s => ({ label: s.name, value: s.name })),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<ProspectSourceOption[]>>('/admin/prospect-sources')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (source: Omit<ProspectSourceOption, 'id' | 'created_at'>): Promise<ProspectSourceOption> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<ProspectSourceOption>>('/admin/prospect-sources', source)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<ProspectSourceOption, 'id' | 'created_at'>>): Promise<ProspectSourceOption> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<ProspectSourceOption>>(`/admin/prospect-sources/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(s => s.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/prospect-sources/${id}`)
      const source = this.items.find(s => s.id === id)
      if (source) source.is_active = false
    },
  },
})
