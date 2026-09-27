// Real API-backed store, scoped one company at a time. Links a Company to a
// Product with a status (Interested/Trial/Active/Churned) — api-system-spec.md §8.2.
const parseDates = (record: CustomerProduct): CustomerProduct => ({
  ...record,
  start_date: new Date(record.start_date),
  end_date: record.end_date ? new Date(record.end_date) : null,
  // Date-only: keep the 'YYYY-MM-DD' prefix, never a Date (see useDateOnly.ts).
  renewal_date: toDateOnly(record.renewal_date),
  billing_cycle: record.billing_cycle ?? null,
  price: record.price ?? null,
})

// Renewal fields (added 2026-09-27) — informational only; invoicing stays in
// FlowAccount. renewal_date goes out as 'YYYY-MM-DD'.
export interface CustomerProductRenewalFields {
  renewal_date: string | null
  billing_cycle: CustomerProductBillingCycle | null
  price: number | null
}

export const useCustomerProductsStore = defineStore('customerProducts', {
  state: () => ({
    items: [] as CustomerProduct[],
  }),
  getters: {
    forCompany: state => (companyId: number) => state.items.filter(r => r.company_id === companyId),
  },
  actions: {
    async fetchForCompany (companyId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<CustomerProduct[]>>(`/companies/${companyId}/products`)
      const fetched = response.data.data.map(parseDates)
      this.items = [...this.items.filter(r => r.company_id !== companyId), ...fetched]
      return fetched
    },
    // The Create response doesn't merge the Product back in (unlike the list
    // endpoint), so the caller passes the already-selected Product to attach locally.
    async add (companyId: number, payload: { product_id: number, status: CustomerProductStatus, start_date?: Date | null, end_date?: Date | null, source_deal_id?: number | null } & Partial<CustomerProductRenewalFields>, product: Product): Promise<CustomerProduct> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Omit<CustomerProduct, 'product'>>>(`/companies/${companyId}/products`, {
        product_id: payload.product_id,
        status: payload.status,
        start_date: payload.start_date ? payload.start_date.toISOString() : undefined,
        end_date: payload.end_date ? payload.end_date.toISOString() : undefined,
        source_deal_id: payload.source_deal_id ?? undefined,
        renewal_date: payload.renewal_date || undefined,
        billing_cycle: payload.billing_cycle || undefined,
        price: payload.price ?? undefined,
      })
      const created = parseDates({ ...response.data.data, product })
      this.items.push(created)
      return created
    },
    // Only `status`/`end_date` and the renewal fields are updatable —
    // company_id/product_id are immutable after creation
    // (internal/handlers/products.go's UpdateCustomerProduct). PATCH is a real
    // partial merge: a renewal key that's present changes the field (null
    // clears it), an omitted one is kept. The Update response doesn't merge
    // Product back in, so it's carried over from the existing local record.
    async update (id: number, changes: { status: CustomerProductStatus, end_date: Date | null } & Partial<CustomerProductRenewalFields>): Promise<CustomerProduct> {
      const { $api } = useNuxtApp()
      const { status, end_date, ...renewal } = changes
      const response = await $api.patch<ApiResponse<Omit<CustomerProduct, 'product'>>>(`/customer-products/${id}`, {
        status,
        end_date: end_date ? end_date.toISOString() : null,
        ...renewal,
      })
      const index = this.items.findIndex(r => r.id === id)
      const product = this.items[index]?.product
      const updated = parseDates({ ...response.data.data, product: product as Product })
      if (index !== -1) this.items[index] = updated
      return updated
    },
  },
})
