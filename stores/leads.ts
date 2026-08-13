import { MOCK_LEADS } from '~/constants/mockData'
import { nextId } from './helpers'

export const useLeadsStore = defineStore('leads', {
  state: () => ({
    items: [...MOCK_LEADS] as Lead[],
  }),
  actions: {
    add (lead: Omit<Lead, 'id'>): number {
      const id = nextId(this.items)
      this.items.push({ ...lead, id })
      return id
    },
    remove (id: number) {
      this.items = this.items.filter(l => l.id !== id)
    },
  },
})
