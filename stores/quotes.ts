// Real API-backed store, scoped one deal at a time. Quotes are hard-deleted
// server-side. PDF export (GET /quotes/:id/export-pdf) is called directly via
// useDownloadPdfBlob from pages/crm/deals/[id]/quotes.vue, not through this
// store — there's no local state it would update.
const parseDates = (quote: Quote): Quote => ({
  ...quote,
  validity_date: quote.validity_date ? new Date(quote.validity_date) : null,
  uploaded_at: quote.uploaded_at ? new Date(quote.uploaded_at) : undefined,
  issue_date: quote.issue_date ? new Date(quote.issue_date) : null,
})

// The full editable payload PUT /quotes/:id accepts — every field added by
// the quotation-builder rebuild, matching quoteForm on the backend.
export interface QuoteUpdatePayload {
  items: QuoteItem[]
  scope_of_work: string
  validity_date: Date | null
  status: QuoteStatus
  reference_number: string | null
  issue_date: Date | null
  credit_days: number
  price_type: QuotePriceType
  vat_enabled: boolean
  wht_enabled: boolean
  wht_rate: number
  discount_total: number
  notes: string | null
  internal_notes: string | null
}

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
    async add (dealId: number, quote: { items: QuoteItem[], scope_of_work: string, validity_date: Date | null, status: QuoteStatus }): Promise<Quote> {
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
    // PUT /quotes/:id — existed on the backend since before this rebuild but
    // was never called from any UI; the new Quote editor page is the first
    // caller. Merges the response into `items` rather than replacing the
    // whole array, so other already-fetched quotes for the same Deal aren't
    // dropped from state.
    async update (id: number, payload: QuoteUpdatePayload): Promise<Quote> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Quote>>(`/quotes/${id}`, payload)
      const updated = parseDates(response.data.data)
      this.items = [...this.items.filter(q => q.id !== id), updated]
      return updated
    },
    // Loads a single Quote by id directly (not scoped to a known Deal) —
    // used by pages/crm/quotes/[id].vue, reached by URL/link rather than
    // via a Deal's already-fetched quote list.
    async fetchOne (id: number): Promise<Quote> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Quote>>(`/quotes/${id}`)
      const fetched = parseDates(response.data.data)
      this.items = [...this.items.filter(q => q.id !== id), fetched]
      return fetched
    },
  },
})
