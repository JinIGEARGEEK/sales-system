// Real API-backed store for the Admin-configurable Company size list
// (/admin/company-sizes) — replaces the previously free-text Company.size
// field as the source of truth for what sizes exist. Delete is a *soft*
// delete: the DELETE endpoint returns 204 and flips `is_active` to false
// server-side, so we patch that locally instead of splicing the record out.
const parseDates = (size: CompanySizeOption): CompanySizeOption => ({
  ...size,
  created_at: new Date(size.created_at),
})

export const useCompanySizeOptionsStore = defineStore('companySizeOptions', {
  state: () => ({
    items: [] as CompanySizeOption[],
  }),
  getters: {
    activeOptions: (state): Select[] => state.items
      .filter(s => s.is_active)
      .map(s => ({ label: s.name, value: s.name })),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<CompanySizeOption[]>>('/admin/company-sizes')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (size: Omit<CompanySizeOption, 'id' | 'created_at'>): Promise<CompanySizeOption> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<CompanySizeOption>>('/admin/company-sizes', size)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<CompanySizeOption, 'id' | 'created_at'>>): Promise<CompanySizeOption> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<CompanySizeOption>>(`/admin/company-sizes/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(s => s.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/company-sizes/${id}`)
      const size = this.items.find(s => s.id === id)
      if (size) size.is_active = false
    },
  },
})
