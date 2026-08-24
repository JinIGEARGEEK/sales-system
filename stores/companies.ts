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
    // Accepts null/undefined (not just number) so callers can pass an
    // optional FK straight through — e.g. Lead.company_id, which unlike
    // Deal/Contact's own company_id can be unset — without an extra guard
    // at every call site; a no-match (including a null/undefined id) falls
    // back to '-'.
    nameById: state => (id: number | null | undefined) => state.items.find(c => c.id === id)?.name || '-',
    // Case/whitespace-insensitive exact-match lookup — used by
    // components/Input/CompanySelect.vue to reuse an existing Company
    // instead of creating a near-duplicate when a typed name already
    // matches one differently cased/padded.
    findByName: state => (name: string) => state.items.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase()),
  },
  actions: {
    // Capped at 200 (the backend's own per-page ceiling, internal/utils/
    // response.go — anything higher silently falls back to the default 20,
    // it doesn't raise the cap) and ordered newest-first, so past ~200
    // companies this misses older ones — every plain `companyOptions =
    // computed(() => companiesStore.items.map(...))`-style dropdown built
    // from `items` inherits that limit. Fine for a picker whose full list
    // fits comfortably under 200; anything that must find one *specific*
    // Company regardless of scale (the detail page, CompanySelect) uses
    // fetchOne below instead.
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
    // Server-paginated fetch used by the Companies list page and by
    // CompanySelect's search-as-you-type. Deliberately does NOT touch
    // `items`/`total`/`page` above — see fetchAll's own doc for why that
    // cache is capped and what still relies on it.
    async fetchList (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Company[]>>('/companies', { params })
      return {
        items: response.data.data.map(parseDates),
        total: response.data.total,
        page: response.data.page,
        totalPage: response.data.total_page,
      }
    },
    // Loads a single Company by id directly (GET /companies/:id) — for
    // anything that needs one specific Company regardless of whether it
    // made fetchAll's capped 200-row cache (nameById/findByName/the
    // dropdowns still built from `items` can all miss a company past that
    // cutoff; this doesn't). Upserts into `items` so nameById and any
    // v-for over `items` immediately pick it up too.
    async fetchOne (id: number): Promise<Company> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Company>>(`/companies/${id}`)
      const fetched = parseDates(response.data.data)
      this.items = [...this.items.filter(c => c.id !== id), fetched]
      return fetched
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
