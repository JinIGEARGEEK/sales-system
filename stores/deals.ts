// Real API-backed store. Deal delete is a *soft* delete — DELETE /deals/:id sets
// deleted_at and splices the record out of `items`, but it stays recoverable via
// GET /deals/trash + POST /deals/:id/restore (see trashItems below).
const parseDates = (deal: Deal): Deal => ({
  ...deal,
  created_at: new Date(deal.created_at),
  expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : null,
  deleted_at: deal.deleted_at ? new Date(deal.deleted_at) : deal.deleted_at,
})

export const useDealsStore = defineStore('deals', {
  state: () => ({
    items: [] as Deal[],
    total: 0,
    page: 1,
    // Trash (soft-deleted rows) is kept fully separate from `items` so the
    // regular list is never polluted by deleted_at-set records.
    trashItems: [] as Deal[],
    trashTotal: 0,
    trashPage: 1,
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Deal[]>>('/deals', {
        params: { per_page: 200, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    // Server-paginated fetch used by the Deals list (table) view. Deliberately
    // does NOT touch `items`/`total`/`page` above — those stay the "up to 200,
    // everything" cache the Kanban board, Deal detail page, dropdowns and
    // duplicate-deal checks all rely on via fetchAll().
    async fetchList (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Deal[]>>('/deals', { params })
      return {
        items: response.data.data.map(parseDates),
        total: response.data.total,
        page: response.data.page,
        totalPage: response.data.total_page,
      }
    },
    async add (deal: Omit<Deal, 'id'>): Promise<Deal> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Deal>>('/deals', deal)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    // Folds in a Deal returned by POST /leads/:id/convert (raw, unparsed dates)
    // — used by both the pipeline board's drag-to-convert and the manual
    // "Convert to Deal" form, so this state update only needs to be right once.
    receiveConverted (deal: Deal): Deal {
      const parsed = parseDates(deal)
      this.items.push(parsed)
      return parsed
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
    ...createBulkResourceActions<Deal>('/deals', parseDates),
  },
})
