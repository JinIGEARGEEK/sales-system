// Real API-backed store. `items` caches per-related-record timelines
// (fetchForRelated), merged into a single flat list; the cross-entity
// Activities page pages server-side through fetchFeed instead.

// One row of GET /activities?include_stage_changes=true (the Activities
// page's feed). `kind: 'stage_change'` rows are Deal stage-change audit
// history (type 'stage_change', related_type 'deal', from/to stage); ids are
// only unique per kind, so key rows by kind+id.
export interface ActivityFeedItem {
  id: number
  kind: 'activity' | 'stage_change'
  type: ActivityType | 'stage_change'
  subject: string
  notes: string
  related_type: ActivityRelatedType
  related_id: number
  created_by: string
  created_at: Date
  from_stage?: string
  to_stage?: string
}

const parseDates = (activity: Activity): Activity => ({
  ...activity,
  created_at: new Date(activity.created_at),
})

export const useActivitiesStore = defineStore('activities', {
  state: () => ({
    items: [] as Activity[],
  }),
  getters: {
    forRelated: state => (relatedType: ActivityRelatedType, relatedId: number) => state.items
      .filter(a => a.related_type === relatedType && a.related_id === relatedId),
  },
  actions: {
    // Server-paginated cross-entity feed for the /crm/activities page: real
    // Activities plus Deal stage-change history, interleaved, filtered,
    // sorted and paged server-side (GET /activities?include_stage_changes=true).
    // Does NOT touch `items` — feed rows aren't all real Activities, and a
    // filtered page merged into the cache would leak into detail-page
    // timelines' `forRelated`.
    async fetchFeed (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<ActivityFeedItem[]>>('/activities', {
        params: { sort: '-created_at', ...params, include_stage_changes: true },
      })
      return {
        items: response.data.data.map(item => ({ ...item, created_at: new Date(item.created_at) })),
        total: response.data.total,
        page: response.data.page,
        totalPage: response.data.total_page,
      }
    },
    async fetchForRelated (relatedType: ActivityRelatedType, relatedId: number) {
      const { $api } = useNuxtApp()
      // Pre-existing bug fixed alongside fetchAll's above: per_page above 200
      // silently resets to the backend's 20-row default (utils.Pagination in
      // sales-system-api) rather than clamping up to 200 — a record with
      // more than 20 logged activities had its timeline silently truncated.
      const response = await $api.get<ApiResponse<Activity[]>>('/activities', {
        params: { related_type: relatedType, related_id: relatedId, per_page: 200 },
      })
      const fetched = response.data.data.map(parseDates)
      this.items = [
        ...this.items.filter(a => !(a.related_type === relatedType && a.related_id === relatedId)),
        ...fetched,
      ]
      return fetched
    },
    // created_at lets a caller backdate a manually-logged Activity (e.g.
    // "mark as contacted on <past date>" from the Company page's Add
    // Activity modal). Omitted, the backend stamps the current time as usual.
    async add (activity: Omit<Activity, 'id' | 'created_by' | 'created_at'> & { created_at?: string }): Promise<Activity> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Activity>>('/activities', activity)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/activities/${id}`)
      this.items = this.items.filter(a => a.id !== id)
    },
  },
})
