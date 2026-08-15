// Real API-backed store. Only wraps what the backend supports: create, list,
// toggle pending<->done, and delete — there's no endpoint to edit a task's
// fields or reassign it, so those actions don't exist here.
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
  },
})
