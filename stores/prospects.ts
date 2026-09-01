// Real API-backed store. Mirrors stores/leads.ts one funnel stage earlier —
// Prospect delete is also a *soft* delete, recoverable via trash/restore.
const parseDates = (prospect: Prospect): Prospect => ({
  ...prospect,
  created_at: new Date(prospect.created_at),
  deleted_at: prospect.deleted_at ? new Date(prospect.deleted_at) : prospect.deleted_at,
})

export const useProspectsStore = defineStore('prospects', {
  state: () => ({
    items: [] as Prospect[],
    total: 0,
    page: 1,
    // Trash (soft-deleted rows) is kept fully separate from `items` so the
    // regular list is never polluted by deleted_at-set records.
    trashItems: [] as Prospect[],
    trashTotal: 0,
    trashPage: 1,
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Prospect[]>>('/prospects', {
        params: { per_page: 200, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    // Server-paginated fetch — see stores/leads.ts's fetchList for why this
    // deliberately does NOT touch `items`/`total`/`page` above.
    async fetchList (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Prospect[]>>('/prospects', { params })
      return {
        items: response.data.data.map(parseDates),
        total: response.data.total,
        page: response.data.page,
        totalPage: response.data.total_page,
      }
    },
    // Loads a single Prospect by id directly (GET /prospects/:id) — for the
    // Prospect detail page regardless of whether it made fetchAll's capped
    // 200-row cache.
    async fetchOne (id: number): Promise<Prospect> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Prospect>>(`/prospects/${id}`)
      const fetched = parseDates(response.data.data)
      this.items = [...this.items.filter(p => p.id !== id), fetched]
      return fetched
    },
    async add (prospect: Omit<Prospect, 'id'>): Promise<Prospect> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Prospect>>('/prospects', prospect)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<Prospect, 'id'>>): Promise<Prospect> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Prospect>>(`/prospects/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(p => p.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/prospects/${id}`)
      this.items = this.items.filter(p => p.id !== id)
    },
    ...createBulkResourceActions<Prospect>('/prospects', parseDates),
    async convert (id: number, payload: { company_id?: number, contact_id?: number, lead?: { assigned_to?: number | null } }): Promise<{ lead: Lead, company: Company, contact: Contact }> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<{ lead: Lead, company: Company, contact: Contact }>>(`/prospects/${id}/convert`, payload)
      return response.data.data
    },
  },
})
