// Real API-backed store. Wraps: create, list, update (title/description/due
// date/priority/assigned_to), toggle pending<->done, delete, and bulk
// mark-done/reassign.
const parseDates = (task: Task): Task => ({
  ...task,
  due_date: new Date(task.due_date),
  created_at: new Date(task.created_at),
})

// In-flight fetchForRelated requests, keyed by related_type:related_id.
const relatedFetches = new Map<string, Promise<Task[]>>()

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [] as Task[],
  }),
  getters: {
    forRelated: state => (relatedType: TaskRelatedType, relatedId: number) => state.items
      .filter(task => task.related_type === relatedType && task.related_id === relatedId)
      .sort((a, b) => a.due_date.getTime() - b.due_date.getTime()),
  },
  actions: {
    // Server-paginated fetch (the all-tasks page's due-date groups, the
    // dashboard's widgets). Doesn't touch `items`, which only caches the
    // records whose Tasks tabs were opened (fetchForRelated).
    async fetchList (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Task[]>>('/tasks', { params })
      return {
        items: response.data.data.map(parseDates),
        total: response.data.total,
        page: response.data.page,
        totalPage: response.data.total_page,
      }
    },
    // One record's tasks (GET /tasks?related_type=&related_id=), merged into
    // `items` so `forRelated` picks them up. For a detail page's Tasks tab,
    // which otherwise only shows whatever an earlier visit happened to cache.
    // Concurrent calls for the same record share one request (the Deal
    // page's overdue badge and its Tasks tab both ask on the same visit).
    fetchForRelated (relatedType: TaskRelatedType, relatedId: number): Promise<Task[]> {
      const key = `${relatedType}:${relatedId}`
      const pending = relatedFetches.get(key)
      if (pending) return pending
      const request = (async () => {
        const { $api } = useNuxtApp()
        const response = await $api.get<ApiResponse<Task[]>>('/tasks', {
          params: { related_type: relatedType, related_id: relatedId, per_page: 200, sort: 'due_date' },
        })
        const fetched = response.data.data.map(parseDates)
        this.items = [
          ...this.items.filter(task => !(task.related_type === relatedType && task.related_id === relatedId)),
          ...fetched,
        ]
        return fetched
      })().finally(() => relatedFetches.delete(key))
      relatedFetches.set(key, request)
      return request
    },
    async add (task: Omit<Task, 'id' | 'status' | 'created_at'>): Promise<Task> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Task>>('/tasks', task)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }): Promise<Task> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Task>>(`/tasks/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(t => t.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/tasks/${id}`)
      this.items = this.items.filter(task => task.id !== id)
    },
    async toggleDone (id: number): Promise<Task> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Task>>(`/tasks/${id}/toggle`)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(t => t.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    // Bulk mark-done/reassign mirror stores/helpers.ts' createBulkResourceActions
    // pattern (update `items` locally instead of refetching) but are declared
    // directly here rather than spread from that helper, since Task has no
    // `tags` field and so doesn't fit that helper's generic constraint.
    async bulkMarkDone (ids: number[]) {
      const { $api } = useNuxtApp()
      await $api.patch('/tasks/bulk-mark-done', { ids })
      this.items.forEach((task) => {
        if (ids.includes(task.id)) task.status = 'done'
      })
    },
    async bulkReassign (ids: number[], assignedTo: number | null) {
      const { $api } = useNuxtApp()
      await $api.patch('/tasks/bulk-reassign', { ids, assigned_to: assignedTo })
      this.items.forEach((task) => {
        if (ids.includes(task.id)) task.assigned_to = assignedTo
      })
    },
  },
})
