// Real API-backed store, mirroring stores/payments.ts's own shape — a
// PaymentInstallment is hard-deleted server-side (no soft-delete status),
// same as Payment. Each row arrives from the server already wrapped in its
// derived status (PaymentInstallmentStatus) — see that interface's own doc.
const parseDates = (status: PaymentInstallmentStatus): PaymentInstallmentStatus => ({
  ...status,
  installment: { ...status.installment, due_date: new Date(status.installment.due_date) },
})

export const usePaymentInstallmentsStore = defineStore('paymentInstallments', {
  state: () => ({
    items: [] as PaymentInstallmentStatus[],
  }),
  getters: {
    forDeal: state => (dealId: number) => state.items.filter(s => s.installment.deal_id === dealId),
  },
  actions: {
    async fetchForDeal (dealId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<PaymentInstallmentStatus[]>>(`/deals/${dealId}/payment-installments`)
      const statuses = response.data.data.map(parseDates)
      this.items = [...this.items.filter(s => s.installment.deal_id !== dealId), ...statuses]
      return statuses
    },
    // add/remove both refetch the whole list rather than patching `items`
    // optimistically — adding or removing one installment can shift the
    // waterfall allocation (and therefore the derived status) of every OTHER
    // installment on the same Deal too, so a locally-patched single row
    // would go stale the moment a sibling row's status actually changed.
    async add (dealId: number, installment: { amount: number, due_date: Date, note: string }): Promise<PaymentInstallment> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<PaymentInstallment>>(`/deals/${dealId}/payment-installments`, installment)
      await this.fetchForDeal(dealId)
      return response.data.data
    },
    async remove (dealId: number, id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/payment-installments/${id}`)
      await this.fetchForDeal(dealId)
    },
    // "Generate Schedule" — creates every installment in one request/one
    // transaction (internal/handlers/payment_installments.go's BulkCreate)
    // rather than N calls to add(), so one user action doesn't produce N
    // audit-log entries server-side. Same refetch-after-write reasoning as
    // add/remove above.
    async bulkAdd (dealId: number, installments: { amount: number, due_date: Date, note: string }[]): Promise<PaymentInstallment[]> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<PaymentInstallment[]>>(`/deals/${dealId}/payment-installments/bulk`, { installments })
      await this.fetchForDeal(dealId)
      return response.data.data
    },
  },
})
