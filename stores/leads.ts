// Real API-backed store. Lead delete is a *soft* delete — DELETE /leads/:id sets
// deleted_at and splices the record out of `items`, but it stays recoverable via
// GET /leads/trash + POST /leads/:id/restore (see trashItems below).
const parseDates = (lead: Lead): Lead => ({
  ...lead,
  created_at: new Date(lead.created_at),
  deleted_at: lead.deleted_at ? new Date(lead.deleted_at) : lead.deleted_at,
})

export const useLeadsStore = defineStore('leads', {
  state: () => ({
    items: [] as Lead[],
    total: 0,
    page: 1,
    // Trash (soft-deleted rows) is kept fully separate from `items` so the
    // regular list is never polluted by deleted_at-set records.
    trashItems: [] as Lead[],
    trashTotal: 0,
    trashPage: 1,
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Lead[]>>('/leads', {
        params: { per_page: 200, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    // Server-paginated fetch used by the Leads list page (search/filter/sort/page
    // all round-trip to GET /leads) and by search-as-you-type pickers/search
    // boxes. Deliberately does NOT touch `items`/`total`/`page` above — see
    // stores/companies.ts's fetchAll for why that cache is capped and what
    // still relies on it. Mixing the two would silently truncate those
    // callers to whatever page the list view last landed on.
    async fetchList (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Lead[]>>('/leads', { params })
      return {
        items: response.data.data.map(parseDates),
        total: response.data.total,
        page: response.data.page,
        totalPage: response.data.total_page,
      }
    },
    // Loads a single Lead by id directly (GET /leads/:id) — for the Lead
    // detail page and anything else that needs one specific Lead regardless
    // of whether it made fetchAll's capped 200-row cache.
    async fetchOne (id: number): Promise<Lead> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Lead>>(`/leads/${id}`)
      const fetched = parseDates(response.data.data)
      this.items = [...this.items.filter(l => l.id !== id), fetched]
      return fetched
    },
    // score/classification are server-computed (FR-CRM-006/007's
    // computeAndClassify runs on every Create/Update) — excluded from the
    // create payload type since the client never supplies them, only reads
    // them back off the response.
    async add (lead: Omit<Lead, 'id' | 'score' | 'classification'>): Promise<Lead> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Lead>>('/leads', lead)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    // classification may be set to 'sql' here as a manual override (FR-CRM-007);
    // score stays server-computed only, excluded same as in add() above.
    async update (id: number, changes: Partial<Omit<Lead, 'id' | 'score'>>): Promise<Lead> {
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
    ...createBulkResourceActions<Lead>('/leads', parseDates),
    async convert (id: number, payload: { company_id?: number, contact_id?: number, deal: Partial<Deal> & { title: string, value: number, stage: DealStage } }): Promise<{ deal: Deal, company: Company, contact: Contact }> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<{ deal: Deal, company: Company, contact: Contact }>>(`/leads/${id}/convert`, payload)
      return response.data.data
    },
    // Folds in a Lead returned by POST /prospects/:id/convert (raw, unparsed
    // dates) — mirrors dealsStore.receiveConverted's role for Lead→Deal.
    receiveConverted (lead: Lead): Lead {
      const parsed = parseDates(lead)
      this.items.push(parsed)
      return parsed
    },
  },
})
