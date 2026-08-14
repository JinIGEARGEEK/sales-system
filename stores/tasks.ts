import { MOCK_TASKS } from '~/constants/mockData'
import { nextId } from './helpers'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [...MOCK_TASKS] as Task[],
  }),
  getters: {
    forRelated: state => (relatedType: TaskRelatedType, relatedId: number) => state.items
      .filter(task => task.related_type === relatedType && task.related_id === relatedId)
      .sort((a, b) => a.due_date.getTime() - b.due_date.getTime()),
    pending: state => state.items.filter(task => task.status === 'pending'),
  },
  actions: {
    add (task: Omit<Task, 'id' | 'status' | 'created_at'>): number {
      const id = nextId(this.items)
      this.items.push({ ...task, id, status: 'pending', created_at: new Date() })
      return id
    },
    update (id: number, changes: Pick<Task, 'title' | 'due_date' | 'assigned_to'>) {
      const task = this.items.find(t => t.id === id)
      if (task) Object.assign(task, changes)
    },
    remove (id: number) {
      this.items = this.items.filter(task => task.id !== id)
    },
    toggleDone (id: number) {
      const task = this.items.find(t => t.id === id)
      if (task) task.status = task.status === 'done' ? 'pending' : 'done'
    },
    markDone (ids: number[]) {
      const idSet = new Set(ids)
      this.items.forEach((task) => {
        if (idSet.has(task.id)) task.status = 'done'
      })
    },
    reassign (ids: number[], assignedTo: number | null) {
      const idSet = new Set(ids)
      this.items.forEach((task) => {
        if (idSet.has(task.id)) task.assigned_to = assignedTo
      })
    },
  },
})
