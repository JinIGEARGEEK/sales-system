// Real API-backed store. Payments are hard-deleted server-side (no soft-delete status).
const parseDates = (payment: Payment): Payment => ({
  ...payment,
  paid_at: new Date(payment.paid_at),
})

export const usePaymentsStore = defineStore('payments', {
  state: () => ({
    items: [] as Payment[],
    totalPaidByDeal: {} as Record<number, number>,
  }),
  getters: {
    forDeal: state => (dealId: number) => state.items.filter(p => p.deal_id === dealId),
    totalForDeal: state => (dealId: number) => state.totalPaidByDeal[dealId] || 0,
  },
  actions: {
    async fetchForDeal (dealId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<{ payments: Payment[], total_paid: number }>>(`/deals/${dealId}/payments`)
      const { payments, total_paid } = response.data.data
      this.items = [...this.items.filter(p => p.deal_id !== dealId), ...payments.map(parseDates)]
      this.totalPaidByDeal[dealId] = total_paid
      return payments
    },
    async add (dealId: number, payment: { amount: number, paid_at: Date, method: PaymentMethod, note: string }): Promise<Payment> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Payment>>(`/deals/${dealId}/payments`, payment)
      const created = parseDates(response.data.data)
      this.items.push(created)
      this.totalPaidByDeal[dealId] = (this.totalPaidByDeal[dealId] || 0) + created.amount
      return created
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      const payment = this.items.find(p => p.id === id)
      await $api.delete(`/payments/${id}`)
      this.items = this.items.filter(p => p.id !== id)
      if (payment) {
        this.totalPaidByDeal[payment.deal_id] = (this.totalPaidByDeal[payment.deal_id] || 0) - payment.amount
      }
    },
  },
})
