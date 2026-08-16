// Real API-backed store, scoped one deal at a time. Quotes are hard-deleted
// server-side. PDF export (GET /quotes/:id/export-pdf) isn't implemented yet —
// no UI here calls it.
const parseDates = (quote: Quote): Quote => ({
  ...quote,
  validity_date: quote.validity_date ? new Date(quote.validity_date) : null,
  uploaded_at: quote.uploaded_at ? new Date(quote.uploaded_at) : undefined,
})

export const useQuotesStore = defineStore('quotes', {
  state: () => ({
    items: [] as Quote[],
  }),
  getters: {
    forDeal: state => (dealId: number) => state.items.filter(q => q.deal_id === dealId),
  },
  actions: {
    async fetchForDeal (dealId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Quote[]>>(`/deals/${dealId}/quotes`)
      const fetched = response.data.data.map(parseDates)
      this.items = [...this.items.filter(q => q.deal_id !== dealId), ...fetched]
      return fetched
    },
    async add (dealId: number, quote: { items: QuoteItem[], validity_date: Date | null, status: QuoteStatus }): Promise<Quote> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Quote>>(`/deals/${dealId}/quotes`, quote)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async upload (dealId: number, file: File): Promise<Quote> {
      const { $api } = useNuxtApp()
      const formData = new FormData()
      formData.append('file', file)
      const response = await $api.post<ApiResponse<Quote>>(`/deals/${dealId}/quotes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/quotes/${id}`)
      this.items = this.items.filter(q => q.id !== id)
    },
  },
})
