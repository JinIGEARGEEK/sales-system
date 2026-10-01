// Real API-backed store. Payments are soft-deleted server-side (deleted_at,
// audited; Review round 2) — a deleted one drops out of the list, totals and
// installment statuses, and there's no restore in the UI.
// `amount` is cash received net of withholding tax; `wht_amount` also counts
// as settled (GET /deals/:dealId/payments returns total_paid / total_wht; its
// total_settled = paid + WHT is derived here instead, as settledForDeal).
const parseDates = (payment: Payment): Payment => ({
  ...payment,
  paid_at: new Date(payment.paid_at),
  // Older rows / fixtures may predate the 2026-09-27 fields.
  wht_amount: payment.wht_amount ?? 0,
  wht_certificate_received: payment.wht_certificate_received ?? false,
  document_number: payment.document_number ?? null,
  installment_id: payment.installment_id ?? null,
})

export const usePaymentsStore = defineStore('payments', {
  state: () => ({
    items: [] as Payment[],
    totalPaidByDeal: {} as Record<number, number>,
    totalWhtByDeal: {} as Record<number, number>,
  }),
  getters: {
    forDeal: state => (dealId: number) => state.items.filter(p => p.deal_id === dealId),
    totalForDeal: state => (dealId: number) => state.totalPaidByDeal[dealId] || 0,
    whtForDeal: state => (dealId: number) => state.totalWhtByDeal[dealId] || 0,
    // Satang-rounded: float residue (0.1 + 0.2) would otherwise hide "Fully paid".
    settledForDeal: state => (dealId: number) => roundSatang((state.totalPaidByDeal[dealId] || 0) + (state.totalWhtByDeal[dealId] || 0)),
  },
  actions: {
    async fetchForDeal (dealId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<{ payments: Payment[], total_paid: number, total_wht?: number }>>(`/deals/${dealId}/payments`)
      const { payments, total_paid, total_wht } = response.data.data
      this.items = [...this.items.filter(p => p.deal_id !== dealId), ...payments.map(parseDates)]
      this.totalPaidByDeal[dealId] = total_paid
      this.totalWhtByDeal[dealId] = total_wht ?? 0
      return payments
    },
    async add (dealId: number, payment: Partial<PaymentPayload> & Pick<PaymentPayload, 'amount' | 'paid_at' | 'method' | 'note'>): Promise<Payment> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Payment>>(`/deals/${dealId}/payments`, payment)
      const created = parseDates(response.data.data)
      this.items.push(created)
      this.adjustTotals(dealId, created.amount, created.wht_amount)
      return created
    },
    // PUT /payments/:id is a real partial merge server-side (only keys present
    // change; `installment_id: null` unlinks, `document_number: null` clears).
    async update (id: number, changes: Partial<PaymentPayload>): Promise<Payment> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Payment>>(`/payments/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(p => p.id === id)
      const previous = index !== -1 ? this.items[index] : undefined
      if (previous) {
        this.items[index] = updated
        this.adjustTotals(updated.deal_id, updated.amount - previous.amount, updated.wht_amount - previous.wht_amount)
      } else {
        this.items.push(updated)
      }
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      const payment = this.items.find(p => p.id === id)
      await $api.delete(`/payments/${id}`)
      this.items = this.items.filter(p => p.id !== id)
      if (payment) this.adjustTotals(payment.deal_id, -payment.amount, -(payment.wht_amount || 0))
    },
    adjustTotals (dealId: number, paidDelta: number, whtDelta: number) {
      this.totalPaidByDeal[dealId] = roundSatang((this.totalPaidByDeal[dealId] || 0) + paidDelta)
      this.totalWhtByDeal[dealId] = roundSatang((this.totalWhtByDeal[dealId] || 0) + whtDelta)
    },
  },
})
