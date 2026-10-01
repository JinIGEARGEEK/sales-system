// Real API-backed store, scoped one deal at a time. Quotes are hard-deleted
// server-side, and only Drafts can be deleted (409 otherwise). PDF export (GET /quotes/:id/export-pdf) is called directly via
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

// A GET /quotes row — the Quote plus its parent Deal's title.
export type QuoteSearchResult = Quote & { deal_title: string }

export const useQuotesStore = defineStore('quotes', {
  state: () => ({
    items: [] as Quote[],
  }),
  getters: {
    forDeal: state => (dealId: number) => state.items.filter(q => q.deal_id === dealId),
  },
  actions: {
    // `keepId`: leave that Quote's already-loaded copy (same object) in place
    // — the editor page's open Quote, whose form a fresh copy would reset.
    async fetchForDeal (dealId: number, keepId?: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Quote[]>>(`/deals/${dealId}/quotes`)
      const fetched = response.data.data.map(parseDates)
      const kept = keepId === undefined ? undefined : this.items.find(q => q.id === keepId)
      const merged = kept ? fetched.map(q => q.id === kept.id ? kept : q) : fetched
      this.items = [...this.items.filter(q => q.deal_id !== dealId), ...merged]
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
    // Status-only transition for an uploaded (file-based) Quote — it has no
    // items/scope_of_work editor of its own (pages/crm/quotes/[id].vue is
    // structured-items only), but PUT /quotes/:id still requires the full
    // payload, so this rebuilds it from the already-loaded Quote rather than
    // asking the caller to know every other field.
    //
    // An Accepted/Rejected quote is read-only: its PUT carries only
    // `{ status }` (the API's documented status-only body) — resending the
    // rest could read as a change (e.g. a date re-serialized differently)
    // and be refused with a 409.
    async updateStatus (id: number, status: QuoteStatus): Promise<Quote> {
      const quote = this.items.find(q => q.id === id)
      if (!quote) throw new Error(`Quote ${id} not loaded`)
      if (isQuoteLocked(quote.status)) {
        const { $api } = useNuxtApp()
        const response = await $api.put<ApiResponse<Quote>>(`/quotes/${id}`, { status })
        const updated = parseDates(response.data.data)
        this.items = [...this.items.filter(q => q.id !== id), updated]
        return updated
      }
      return this.update(id, {
        items: quote.items,
        scope_of_work: quote.scope_of_work,
        validity_date: quote.validity_date,
        status,
        reference_number: quote.reference_number ?? null,
        issue_date: quote.issue_date,
        credit_days: quote.credit_days,
        price_type: quote.price_type,
        vat_enabled: quote.vat_enabled,
        wht_enabled: quote.wht_enabled,
        wht_rate: quote.wht_rate,
        discount_total: quote.discount_total,
        notes: quote.notes ?? null,
        internal_notes: quote.internal_notes ?? null,
      })
    },
    // POST /quotes/:id/duplicate — a new Draft on the same Deal with the
    // original's items/terms, a fresh QT number and today's issue date
    // (validity shifted by the original's gap). Pushed into `items` so the
    // Deal's quote list already has it.
    async duplicate (id: number): Promise<Quote> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Quote>>(`/quotes/${id}/duplicate`)
      const created = parseDates(response.data.data)
      this.items = [...this.items.filter(q => q.id !== created.id), created]
      return created
    },
    // GET /quotes?search= (added 2026-10-01) — searches every Quote the
    // caller can see by number / reference_number / parent Deal title, for
    // the global search bar. Doesn't touch `items` (results span Deals).
    async search (params: { search: string, per_page?: number, page?: number }) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<QuoteSearchResult[]>>('/quotes', { params })
      return {
        items: response.data.data.map(q => ({ ...parseDates(q), deal_title: q.deal_title })),
        total: response.data.total,
        page: response.data.page,
        totalPage: response.data.total_page,
      }
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
