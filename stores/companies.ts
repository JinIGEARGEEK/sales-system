// Real API-backed store. Company delete is a *soft* delete (§4 of api-system-spec.md):
// the DELETE endpoint returns 204 and sets deleted_at server-side, excluding the row
// from subsequent GET /companies responses — so we splice it out of `items` locally
// too, same as Leads/Deals. It stays recoverable via GET /companies/trash +
// POST /companies/:id/restore (see trashItems below).
const parseDates = (company: Company): Company => ({
  ...company,
  created_at: new Date(company.created_at),
  updated_at: new Date(company.updated_at),
  deleted_at: company.deleted_at ? new Date(company.deleted_at) : company.deleted_at,
})

export const useCompaniesStore = defineStore('companies', {
  state: () => ({
    items: [] as Company[],
    total: 0,
    page: 1,
    // Trash (soft-deleted rows) is kept fully separate from `items` so the
    // regular list is never polluted by deleted_at-set records.
    trashItems: [] as Company[],
    trashTotal: 0,
    trashPage: 1,
  }),
  getters: {
    nameById: state => (id: number) => state.items.find(c => c.id === id)?.name || '-',
    findByName: state => (name: string) => state.items.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase()),
  },
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Company[]>>('/companies', {
        params: { per_page: 200, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    async add (company: Omit<Company, 'id'>): Promise<Company> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Company>>('/companies', company)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<Company, 'id'>>): Promise<Company> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Company>>(`/companies/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(c => c.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    addTag (id: number, tag: string) {
      const company = this.items.find(c => c.id === id)
      if (company && !company.tags.includes(tag)) {
        company.tags.push(tag)
      }
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/companies/${id}`)
      this.items = this.items.filter(c => c.id !== id)
    },
    ...createTrashActions<Company>('/companies', parseDates),
  },
})
