// Real API-backed store for the Admin-configurable Company revenue size list
// (/admin/revenue-sizes) — replaces the previously free-text
// Company.revenue_size field as the source of truth for what revenue sizes
// exist. Delete is a *soft* delete: the DELETE endpoint returns 204 and flips
// `is_active` to false server-side, so we patch that locally instead of
// splicing the record out.
const parseDates = (size: RevenueSizeOption): RevenueSizeOption => ({
  ...size,
  created_at: new Date(size.created_at),
})

export const useRevenueSizeOptionsStore = defineStore('revenueSizeOptions', {
  state: () => ({
    items: [] as RevenueSizeOption[],
  }),
  getters: {
    activeOptions: (state): Select[] => state.items
      .filter(s => s.is_active)
      .map(s => ({ label: s.name, value: s.name })),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<RevenueSizeOption[]>>('/admin/revenue-sizes')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (size: Omit<RevenueSizeOption, 'id' | 'created_at'>): Promise<RevenueSizeOption> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<RevenueSizeOption>>('/admin/revenue-sizes', size)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<RevenueSizeOption, 'id' | 'created_at'>>): Promise<RevenueSizeOption> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<RevenueSizeOption>>(`/admin/revenue-sizes/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(s => s.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/revenue-sizes/${id}`)
      const size = this.items.find(s => s.id === id)
      if (size) size.is_active = false
    },
  },
})
