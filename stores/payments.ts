import { MOCK_PAYMENTS } from '~/constants/mockData'
import { nextId } from './helpers'

export const usePaymentsStore = defineStore('payments', {
  state: () => ({
    items: [...MOCK_PAYMENTS] as Payment[],
  }),
  getters: {
    forDeal: state => (dealId: number) => state.items.filter(p => p.deal_id === dealId),
    totalForDeal: state => (dealId: number) => state.items
      .filter(p => p.deal_id === dealId)
      .reduce((sum, p) => sum + p.amount, 0),
  },
  actions: {
    add (payment: Omit<Payment, 'id'>): number {
      const id = nextId(this.items)
      this.items.push({ ...payment, id })
      return id
    },
    remove (id: number) {
      this.items = this.items.filter(p => p.id !== id)
    },
  },
})
