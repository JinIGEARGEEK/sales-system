import { MOCK_DEALS } from '~/constants/mockData'
import { nextId } from './helpers'

export const useDealsStore = defineStore('deals', {
  state: () => ({
    items: [...MOCK_DEALS] as Deal[],
  }),
  actions: {
    add (deal: Omit<Deal, 'id'>): number {
      const id = nextId(this.items)
      this.items.push({ ...deal, id })
      return id
    },
    remove (id: number) {
      this.items = this.items.filter(d => d.id !== id)
    },
  },
})
