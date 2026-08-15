// Real API-backed store. Deal delete is a *hard* delete (§7.1 of api-system-spec.md) —
// unlike Company/Contact, so a successful DELETE splices the record out of `items`.
const parseDates = (deal: Deal): Deal => ({
  ...deal,
  created_at: new Date(deal.created_at),
  expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : null,
})

export const useDealsStore = defineStore('deals', {
  state: () => ({
    items: [] as Deal[],
    total: 0,
    page: 1,
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Deal[]>>('/deals', {
        params: { per_page: 1000, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    async add (deal: Omit<Deal, 'id'>): Promise<Deal> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Deal>>('/deals', deal)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<Deal, 'id'>>): Promise<Deal> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Deal>>(`/deals/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(d => d.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async updateStage (id: number, stage: DealStage): Promise<Deal> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Deal>>(`/deals/${id}/stage`, { stage })
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(d => d.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async reassign (id: number, assignedTo: number | null): Promise<Deal> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Deal>>(`/deals/${id}/reassign`, { assigned_to: assignedTo })
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(d => d.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/deals/${id}`)
      this.items = this.items.filter(d => d.id !== id)
    },
  },
})
