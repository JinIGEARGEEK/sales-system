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
    async fetchForRelated (relatedType: ActivityRelatedType, relatedId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Activity[]>>('/activities', {
        params: { related_type: relatedType, related_id: relatedId, per_page: 1000 },
      })
      const fetched = response.data.data.map(parseDates)
      this.items = [
        ...this.items.filter(a => !(a.related_type === relatedType && a.related_id === relatedId)),
        ...fetched,
      ]
      return fetched
    },
    async add (activity: Omit<Activity, 'id' | 'created_by' | 'created_at'>): Promise<Activity> {
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
