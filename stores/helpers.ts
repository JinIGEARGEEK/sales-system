// The `data` of an endpoint that answers either 200 with a body or 204
// (axios gives '' for an empty body).
export const optionalResponseData = <T>(body: ApiResponse<T> | '' | null | undefined): T | undefined =>
  body && typeof body === 'object' ? body.data : undefined

// The bulk-archive response body, or (for a 204) every requested id archived.
export const toBulkArchiveResult = (ids: number[], body: ApiResponse<BulkArchiveResult> | '' | null | undefined): BulkArchiveResult => {
  const data = optionalResponseData(body)
  if (!data || !Array.isArray(data.archived)) return { archived: [...ids], skipped: [] }
  return { archived: data.archived, skipped: Array.isArray(data.skipped) ? data.skipped : [] }
}

// POST /leads, /prospects, /contacts: resend with ?allow_duplicate=true after
// the user has seen the duplicate 409 and chosen "Create anyway".
export interface CreateOptions {
  allowDuplicate?: boolean
}
export const createParams = (options: CreateOptions) =>
  options.allowDuplicate ? { params: { allow_duplicate: true } } : undefined

// GET <resourcePath>/:id, upserted into `items` — for a detail page and
// anything that needs one specific record whether or not it made the capped
// 200-row fetchAll cache. skipErrorRedirect: a missing record is the detail
// page's own NotFoundState, not the app-wide error page.
export const createFetchOneAction = <T extends { id: number }>(resourcePath: string, parseDates: (item: T) => T) => ({
  async fetchOne (this: { items: T[] }, id: number): Promise<T> {
    const { $api } = useNuxtApp()
    const response = await $api.get<ApiResponse<T>>(`${resourcePath}/${id}`, { skipErrorRedirect: true })
    const fetched = parseDates(response.data.data)
    this.items = [...this.items.filter(item => item.id !== id), fetched]
    return fetched
  },
})

// POST <resourcePath>/:id/merge (Companies, Contacts): folds the sources into
// this record. The target comes back updated (filled fields) and the sources
// — now in Trash — leave `items`. Linked lists elsewhere are stale; callers
// refetch them.
export const createMergeAction = <T extends { id: number }>(resourcePath: string, parseDates: (item: T) => T) => ({
  async merge (this: { items: T[] }, id: number, sourceIds: number[]): Promise<MergeResult<T>> {
    const { $api } = useNuxtApp()
    const response = await $api.post<ApiResponse<MergeResult<T>>>(`${resourcePath}/${id}/merge`, { source_ids: sourceIds })
    const result = response.data.data
    const target = parseDates(result.target)
    this.items = [...this.items.filter(item => item.id !== id && !sourceIds.includes(item.id)), target]
    return { ...result, target }
  },
})

export const nextId = <T extends { id: number }>(items: T[]): number => Math.max(0, ...items.map(item => item.id)) + 1

// Shared by every resource that got a GET :resource/trash + POST :id/restore pair
// added (Leads, Deals, Companies, Contacts), gated Admin/Sales Manager on the
// backend. Spread the result into a store's `actions` — the explicit `this`
// typings below only require the bit of state each action actually touches, so
// they're satisfied by the full store instance without any other changes to
// the store.
export const createTrashActions = <T extends { id: number }>(
  resourcePath: string,
  parseDates: (item: T) => T,
) => ({
  async restore (this: { trashItems: T[] }, id: number): Promise<T> {
    const { $api } = useNuxtApp()
    const response = await $api.post<ApiResponse<T>>(`${resourcePath}/${id}/restore`)
    const restored = parseDates(response.data.data)
    this.trashItems = this.trashItems.filter(item => item.id !== id)
    return restored
  },
  async fetchTrash (this: { trashItems: T[], trashTotal: number, trashPage: number }, page = 1, perPage = 10, search?: string): Promise<T[]> {
    const { $api } = useNuxtApp()
    const response = await $api.get<ApiResponse<T[]>>(`${resourcePath}/trash`, {
      params: { page, per_page: perPage, search: search || undefined },
    })
    this.trashItems = response.data.data.map(parseDates)
    this.trashTotal = response.data.total
    this.trashPage = response.data.page
    return this.trashItems
  },
})

// Additionally shared by stores/deals.ts and stores/leads.ts only — Companies and
// Contacts don't have an `assigned_to` field or bulk-reassign/bulk-tag/bulk-archive
// endpoints on the backend (only trash/restore), so they use createTrashActions
// directly instead of this superset.
export const createBulkResourceActions = <T extends { id: number, assigned_to: number | null, tags?: string[] | null }>(
  resourcePath: string,
  parseDates: (item: T) => T,
) => ({
  async bulkReassign (this: { items: T[] }, ids: number[], assignedTo: number | null) {
    const { $api } = useNuxtApp()
    await $api.patch(`${resourcePath}/bulk-reassign`, { ids, assigned_to: assignedTo })
    this.items.forEach((item) => {
      if (ids.includes(item.id)) item.assigned_to = assignedTo
    })
  },
  async bulkTag (this: { items: T[] }, ids: number[], tags: string[], mode: 'add' | 'set' = 'add') {
    const { $api } = useNuxtApp()
    await $api.patch(`${resourcePath}/bulk-tag`, { ids, tags, mode })
    this.items.forEach((item) => {
      if (!ids.includes(item.id)) return
      item.tags = mode === 'set' ? [...tags] : [...new Set([...(item.tags || []), ...tags])]
    })
  },
  // PATCH /deals/bulk-archive answers 200 { archived, skipped } (a Won Deal
  // with money attached is skipped, not archived); /leads and /prospects
  // answer 204, which normalizes to "all archived, none skipped".
  async bulkArchive (this: { items: T[] }, ids: number[]): Promise<BulkArchiveResult> {
    const { $api } = useNuxtApp()
    const response = await $api.patch<ApiResponse<BulkArchiveResult> | ''>(`${resourcePath}/bulk-archive`, { ids })
    const result = toBulkArchiveResult(ids, response.data)
    this.items = this.items.filter(item => !result.archived.includes(item.id))
    return result
  },
  ...createTrashActions<T>(resourcePath, parseDates),
})
