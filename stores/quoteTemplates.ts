// Real API-backed store for Quote Templates — deliberately minimal (no
// Update; see interfaces/crm.d.ts's QuoteTemplate doc). Not paginated:
// GET /quote-templates returns the full list directly (expected to stay
// small), so unlike most stores here there's no per_page param to send.
export const useQuoteTemplatesStore = defineStore('quoteTemplates', {
  state: () => ({
    items: [] as QuoteTemplate[],
  }),
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<QuoteTemplate[]>>('/quote-templates')
      this.items = response.data.data
      return this.items
    },
    async add (template: Omit<QuoteTemplate, 'id' | 'created_at'>): Promise<QuoteTemplate> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<QuoteTemplate>>('/quote-templates', template)
      const created = response.data.data
      this.items.unshift(created)
      return created
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/quote-templates/${id}`)
      this.items = this.items.filter(t => t.id !== id)
    },
  },
})
