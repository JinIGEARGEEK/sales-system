// Real API-backed store for the fixed product catalog. There's no real delete —
// Deactivate flips is_active: false server-side (api-system-spec.md §8.2).
export const useProductsStore = defineStore('products', {
  state: () => ({
    items: [] as Product[],
  }),
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Product[]>>('/products', {
        params: { per_page: 1000 },
      })
      this.items = response.data.data
      return this.items
    },
    async add (product: Omit<Product, 'id' | 'is_active'>): Promise<Product> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Product>>('/products', product)
      const created = response.data.data
      this.items.push(created)
      return created
    },
    async update (id: number, changes: { name: string, category: string, description: string }): Promise<Product> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Product>>(`/products/${id}`, changes)
      const updated = response.data.data
      const index = this.items.findIndex(p => p.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async deactivate (id: number) {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Product>>(`/products/${id}/deactivate`)
      const updated = response.data.data
      const index = this.items.findIndex(p => p.id === id)
      if (index !== -1) this.items[index] = updated
    },
  },
})
