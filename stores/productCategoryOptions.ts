// Real API-backed store for the Admin-configurable Product category list
// (/admin/product-categories) — replaces the previously free-text Product.category
// field as the source of truth for what categories exist. Delete is a *soft*
// delete: the DELETE endpoint returns 204 and flips `is_active` to false
// server-side, so we patch that locally instead of splicing the record out.
const parseDates = (category: ProductCategoryOption): ProductCategoryOption => ({
  ...category,
  created_at: new Date(category.created_at),
})

export const useProductCategoryOptionsStore = defineStore('productCategoryOptions', {
  state: () => ({
    items: [] as ProductCategoryOption[],
  }),
  getters: {
    activeOptions: (state): Select[] => state.items
      .filter(c => c.is_active)
      .map(c => ({ label: c.name, value: c.name })),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<ProductCategoryOption[]>>('/admin/product-categories')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (category: Omit<ProductCategoryOption, 'id' | 'created_at'>): Promise<ProductCategoryOption> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<ProductCategoryOption>>('/admin/product-categories', category)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<ProductCategoryOption, 'id' | 'created_at'>>): Promise<ProductCategoryOption> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<ProductCategoryOption>>(`/admin/product-categories/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(c => c.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/product-categories/${id}`)
      const category = this.items.find(c => c.id === id)
      if (category) category.is_active = false
    },
  },
})
