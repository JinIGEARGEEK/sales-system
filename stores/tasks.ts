// Real API-backed store. Only wraps what the backend supports: create, list,
// toggle pending<->done, delete, and bulk mark-done/reassign — there's still
// no endpoint to edit a task's other fields or reassign a single task
// outside of a bulk call, so those actions don't exist here.
const parseDates = (task: Task): Task => ({
  ...task,
  due_date: new Date(task.due_date),
  created_at: new Date(task.created_at),
})

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [] as Task[],
  }),
  getters: {
    forRelated: state => (relatedType: TaskRelatedType, relatedId: number) => state.items
      .filter(task => task.related_type === relatedType && task.related_id === relatedId)
      .sort((a, b) => a.due_date.getTime() - b.due_date.getTime()),
    pending: state => state.items.filter(task => task.status === 'pending'),
  },
  actions: {
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Task[]>>('/tasks', {
        params: { per_page: 1000, ...params },
      })
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (task: Omit<Task, 'id' | 'status' | 'created_at'>): Promise<Task> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Task>>('/tasks', task)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/tasks/${id}`)
      this.items = this.items.filter(task => task.id !== id)
    },
    async toggleDone (id: number) {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Task>>(`/tasks/${id}/toggle`)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(t => t.id === id)
      if (index !== -1) this.items[index] = updated
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
