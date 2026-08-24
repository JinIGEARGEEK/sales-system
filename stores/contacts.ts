// Real API-backed store. Contact delete is a *soft* delete (§5 of api-system-spec.md):
// the DELETE endpoint returns 204 and sets deleted_at server-side, excluding the row
// from subsequent GET /contacts responses — so we splice it out of `items` locally
// too, same as Leads/Deals. It stays recoverable via GET /contacts/trash +
// POST /contacts/:id/restore (see trashItems below).
const parseDates = (contact: Contact): Contact => ({
  ...contact,
  created_at: new Date(contact.created_at),
  deleted_at: contact.deleted_at ? new Date(contact.deleted_at) : contact.deleted_at,
})

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    items: [] as Contact[],
    total: 0,
    page: 1,
    // Trash (soft-deleted rows) is kept fully separate from `items` so the
    // regular list is never polluted by deleted_at-set records.
    trashItems: [] as Contact[],
    trashTotal: 0,
    trashPage: 1,
  }),
  getters: {
    nameById: state => (id: number) => state.items.find(c => c.id === id)?.name || '-',
    // Accepts number, string, or null/undefined so callers backed by either a
    // select's string v-model or InputCompanySelect's number|null one (e.g. a
    // company_id form field) don't need to coerce first. A null/undefined
    // companyId matches nothing (no Contact has a null company_id) rather
    // than throwing.
    byCompany: state => (companyId: number | string | null | undefined) => state.items.filter(c => String(c.company_id) === String(companyId)),
  },
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Contact[]>>('/contacts', {
        params: { per_page: 200, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    // Server-paginated fetch used by the Contacts list page and by
    // search-as-you-type pickers/search boxes. Deliberately does NOT touch
    // `items`/`total`/`page` above — see stores/companies.ts's fetchAll for
    // why that cache is capped and what still relies on it.
    async fetchList (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Contact[]>>('/contacts', { params })
      return {
        items: response.data.data.map(parseDates),
        total: response.data.total,
        page: response.data.page,
        totalPage: response.data.total_page,
      }
    },
    // Loads a single Contact by id directly (GET /contacts/:id) — for the
    // Contact detail page and anything else that needs one specific Contact
    // regardless of whether it made fetchAll's capped 200-row cache.
    async fetchOne (id: number): Promise<Contact> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Contact>>(`/contacts/${id}`)
      const fetched = parseDates(response.data.data)
      this.items = [...this.items.filter(c => c.id !== id), fetched]
      return fetched
    },
    async add (contact: Omit<Contact, 'id'>): Promise<Contact> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Contact>>('/contacts', contact)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<Contact, 'id'>>): Promise<Contact> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Contact>>(`/contacts/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(c => c.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/contacts/${id}`)
      this.items = this.items.filter(c => c.id !== id)
    },
    ...createTrashActions<Contact>('/contacts', parseDates),
  },
})
