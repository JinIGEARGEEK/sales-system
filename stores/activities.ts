// Real API-backed store. GET /activities requires related_type+related_id together;
// items are cached per related record and merged into a single flat list.
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
    // Unfiltered GET /activities — omitting related_type/related_id (the
    // backend requires them together, not that they're required at all)
    // returns every activity across all related records, for the
    // cross-entity Activities list page. Capped at 200 (the backend's real
    // ceiling — utils.Pagination in sales-system-api silently resets
    // anything outside 1..200 back to its 20-row default, it does not clamp
    // up to 200, so asking for more than 200 here would silently return
    // only the 20 most recent activities system-wide instead of "every
    // activity"). Merges into `this.items` by id (like fetchForRelated
    // below) rather than replacing it wholesale, so a slower fetchAll
    // response landing after a detail page's own fetchForRelated doesn't
    // clobber activities that call already merged in for a record outside
    // this fetch's own 200-row window.
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Activity[]>>('/activities', {
        params: { per_page: 200, sort: '-created_at' },
      })
      const fetched = response.data.data.map(parseDates)
      this.items = [
        ...this.items.filter(existing => !fetched.some(f => f.id === existing.id)),
        ...fetched,
      ]
      return fetched
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
