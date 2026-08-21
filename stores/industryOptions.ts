// Real API-backed store for the Admin-configurable Company industry list
// (/admin/industries) — replaces the previously hardcoded INDUSTRY_OPTIONS
// constant as the source of truth for what industries exist. Delete is a
// *soft* delete: the DELETE endpoint returns 204 and flips `is_active` to
// false server-side, so we patch that locally instead of splicing the
// record out.
const parseDates = (industry: IndustryOption): IndustryOption => ({
  ...industry,
  created_at: new Date(industry.created_at),
})

export const useIndustryOptionsStore = defineStore('industryOptions', {
  state: () => ({
    items: [] as IndustryOption[],
  }),
  getters: {
    activeOptions: (state): Select[] => state.items
      .filter(i => i.is_active)
      .map(i => ({ label: i.name, value: i.name })),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<IndustryOption[]>>('/admin/industries')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (industry: Omit<IndustryOption, 'id' | 'created_at'>): Promise<IndustryOption> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<IndustryOption>>('/admin/industries', industry)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<IndustryOption, 'id' | 'created_at'>>): Promise<IndustryOption> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<IndustryOption>>(`/admin/industries/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(i => i.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/industries/${id}`)
      const industry = this.items.find(i => i.id === id)
      if (industry) industry.is_active = false
    },
  },
})
