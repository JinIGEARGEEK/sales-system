// Real API-backed store, scoped one deal at a time — mirrors stores/quotes.ts.
// Contracts are never hard-deleted from the UI (no remove action exists on the
// backend), so there's no `remove` action here.
const parseDates = (contract: Contract): Contract => ({
  ...contract,
  signed_date: contract.signed_date ? new Date(contract.signed_date) : null,
  created_at: new Date(contract.created_at),
})

export const useContractsStore = defineStore('contracts', {
  state: () => ({
    items: [] as Contract[],
  }),
  getters: {
    forDeal: state => (dealId: number) => state.items.filter(c => c.deal_id === dealId),
  },
  actions: {
    async fetchForDeal (dealId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Contract[]>>(`/deals/${dealId}/contracts`)
      const fetched = response.data.data.map(parseDates)
      this.items = [...this.items.filter(c => c.deal_id !== dealId), ...fetched]
      return fetched
    },
    async add (dealId: number, contract: { status?: ContractStatus, quote_id?: number | null }): Promise<Contract> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Contract>>(`/deals/${dealId}/contracts`, contract)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: { status?: ContractStatus, quote_id?: number | null }): Promise<Contract> {
      const { $api } = useNuxtApp()
      const response = await $api.put<ApiResponse<Contract>>(`/contracts/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(c => c.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async upload (id: number, file: File): Promise<Contract> {
      const { $api } = useNuxtApp()
      const formData = new FormData()
      formData.append('file', file)
      const response = await $api.post<ApiResponse<Contract>>(`/contracts/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(c => c.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
  },
})
