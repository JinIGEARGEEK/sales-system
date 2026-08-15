// Real API-backed store. Contact delete is a *soft* delete (§5 of api-system-spec.md):
// the DELETE endpoint returns 204 and flips `status` to 'archived' server-side, so we
// patch that locally instead of splicing the record out of `items`.
const parseDates = (contact: Contact): Contact => ({
  ...contact,
  created_at: new Date(contact.created_at),
})

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    items: [] as Contact[],
    total: 0,
    page: 1,
  }),
  getters: {
    nameById: state => (id: number) => state.items.find(c => c.id === id)?.name || '-',
  },
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Contact[]>>('/contacts', {
        params: { per_page: 1000, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
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
      const contact = this.items.find(c => c.id === id)
      if (contact) contact.status = 'archived'
    },
  },
})
