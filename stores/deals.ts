// Real API-backed store. Deal delete is a *soft* delete — DELETE /deals/:id sets
// deleted_at and splices the record out of `items`, but it stays recoverable via
// GET /deals/trash + POST /deals/:id/restore (see trashItems below).
const parseDates = (deal: Deal): Deal => ({
  ...deal,
  created_at: new Date(deal.created_at),
  expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : null,
  deleted_at: deal.deleted_at ? new Date(deal.deleted_at) : deal.deleted_at,
})

// PUT /deals/:id replaces every mapped field (CLAUDE.md, design-system.md §8)
// and Deal has no narrow "edit these fields" endpoint, so every update()
// resends the whole current record with just `changes` swapped in. The one
// list of those fields — DealUpdatePayload makes a missing one a compile error.
export const fullDealUpdatePayload = (deal: Deal, changes: Partial<DealUpdatePayload> = {}): DealUpdatePayload => ({
  company_id: deal.company_id,
  contact_id: deal.contact_id,
  title: deal.title,
  value: deal.value,
  stage: deal.stage,
  status: deal.status,
  probability: deal.probability,
  lost_reason: deal.lost_reason,
  forecast_category: deal.forecast_category,
  expected_close_date: deal.expected_close_date,
  assigned_to: deal.assigned_to,
  channel: deal.channel,
  business_unit: deal.business_unit,
  business_unit_item: deal.business_unit_item,
  ...changes,
})

// Only single-deal responses (GET/PUT/PATCH /deals/:id) carry
// value_quote_number; a list row whose value follows a quote leaves it out.
// True for such a row — the "From accepted quote Q-…" hint needs a re-read
// (useCurrentDeal) unless keepValueQuoteNumber below can fill it in.
export const lacksValueQuoteNumber = (deal: Deal) => Boolean(deal.value_quote_id) && deal.value_quote_number === undefined

// Keeps the value_quote_number already loaded for the same Deal and quote,
// so a list refresh doesn't blank the hint.
const keepValueQuoteNumber = (deal: Deal, loaded: Deal[]): Deal => {
  if (!lacksValueQuoteNumber(deal)) return deal
  const previous = loaded.find(d => d.id === deal.id && d.value_quote_id === deal.value_quote_id)
  return previous?.value_quote_number !== undefined ? { ...deal, value_quote_number: previous.value_quote_number } : deal
}

// The trailing axios-config argument carrying the override reason as
// ?reason=, or nothing at all — a call without one sends exactly what it
// always did.
const reasonParams = (reason?: string): [] | [{ params: { reason: string } }] => (reason ? [{ params: { reason } }] : [])

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
    // Deals loaded one at a time (fetchOne, e.g. a detail page) that the
    // newest-200 list may not include. fetchAll keeps them, so a list load
    // that finishes after a detail page's own fetch doesn't drop its deal.
    singleIds: [] as number[],
  }),
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Deal[]>>('/deals', {
        params: { per_page: 200, ...params },
      })
      const listed = response.data.data.map(parseDates).map(deal => keepValueQuoteNumber(deal, this.items))
      const listedIds = new Set(listed.map(d => d.id))
      const singles = this.items.filter(d => this.singleIds.includes(d.id) && !listedIds.has(d.id))
      this.items = [...listed, ...singles]
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    // Server-paginated fetch used by the Deals list (table) view and by
    // search-as-you-type pickers/search boxes. Deliberately does NOT touch
    // `items`/`total`/`page` above — those stay the "up to 200, newest-first"
    // cache that fetchAll() populates (capped by the backend's own per-page
    // ceiling — see stores/companies.ts's fetchAll for the full explanation).
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
    // Loads a single Deal by id directly (GET /deals/:id) — for the Deal
    // detail page (useCurrentDeal) and anything else that needs one specific
    // Deal regardless of whether it made fetchAll's capped 200-row cache.
    // Upserts into `items` so every getter/computed built over `items`
    // immediately picks it up too.
    // skipErrorRedirect: a missing record is the detail page's own
    // NotFoundState, not the app-wide error page.
    async fetchOne (id: number): Promise<Deal> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Deal>>(`/deals/${id}`, { skipErrorRedirect: true })
      const fetched = parseDates(response.data.data)
      this.items = [...this.items.filter(d => d.id !== id), fetched]
      if (!this.singleIds.includes(id)) this.singleIds.push(id)
      return fetched
    },
    async add (deal: Omit<Deal, 'id' | 'position'>): Promise<Deal> {
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
    // `reason` (here, updateStage and remove): a manager's ?reason= for
    // un-winning or deleting a Won Deal with money attached — the API
    // answers 409 REASON_REQUIRED without it (useWonDealGuard asks for it).
    async update (id: number, changes: DealUpdatePayload, reason?: string): Promise<Deal> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Deal>>(`/deals/${id}`, changes, ...reasonParams(reason))
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(d => d.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    // position is the Kanban board's own computed drop-index within the
    // destination stage lane (PipelineBoard.vue) — omitted for the mobile
    // dropdown-move, which has no drag geometry to compute one from; the
    // backend then auto-appends to the end of the destination lane instead.
    // lostReason is optional (the Kanban drag doesn't collect one); when sent
    // with a move into a Lost stage the backend validates and saves it.
    async updateStage (id: number, stage: DealStage, position?: number, lostReason?: LostReason, reason?: string): Promise<Deal> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Deal>>(`/deals/${id}/stage`, { stage, position, lost_reason: lostReason }, ...reasonParams(reason))
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
    async remove (id: number, reason?: string) {
      const { $api } = useNuxtApp()
      await $api.delete(`/deals/${id}`, ...reasonParams(reason))
      this.items = this.items.filter(d => d.id !== id)
      this.singleIds = this.singleIds.filter(i => i !== id)
    },
    ...createBulkResourceActions<Deal>('/deals', parseDates),
  },
})
