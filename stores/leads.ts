// Real API-backed store. Lead delete is a *hard* delete (§3 of api-system-spec.md) —
// unlike Company/Contact, so a successful DELETE splices the record out of `items`.
const parseDates = (lead: Lead): Lead => ({
  ...lead,
  created_at: new Date(lead.created_at),
})

export const useLeadsStore = defineStore('leads', {
  state: () => ({
    items: [] as Lead[],
    total: 0,
    page: 1,
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Lead[]>>('/leads', {
        params: { per_page: 1000, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    async add (lead: Omit<Lead, 'id'>): Promise<Lead> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Lead>>('/leads', lead)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<Lead, 'id'>>): Promise<Lead> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Lead>>(`/leads/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(l => l.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/leads/${id}`)
      this.items = this.items.filter(l => l.id !== id)
    },
    async convert (id: number, payload: { company_id?: number, contact_id?: number, deal: Partial<Deal> & { title: string, value: number, stage: DealStage } }): Promise<{ deal: Deal, company: Company, contact: Contact }> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<{ deal: Deal, company: Company, contact: Contact }>>(`/leads/${id}/convert`, payload)
      return response.data.data
    },
  },
})
