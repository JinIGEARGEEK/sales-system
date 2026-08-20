// Real API-backed store for per-quarter/per-year sales targets
// (/admin/sales-targets, FR-CRM-092) — full row-per-period CRUD, unlike
// appSettings.ts's single always-id-1 row. A row here overrides
// AppSettings.quarterly_sales_target/4 for its specific (year, quarter) in
// the dashboard's pipeline_coverage_ratio calc; deleting a row just reverts
// that period back to the flat fallback (a hard delete server-side, unlike
// PipelineStage's soft is_active flip — nothing else references a row by ID).
const parseDates = (target: SalesTarget): SalesTarget => ({
  ...target,
  created_at: new Date(target.created_at),
  updated_at: new Date(target.updated_at),
})

export const useSalesTargetsStore = defineStore('salesTargets', {
  state: () => ({
    items: [] as SalesTarget[],
  }),
  getters: {
    // Sorted oldest-to-newest so the admin config UI renders past/current/
    // future periods as a natural timeline, regardless of fetch/insert order.
    sorted: (state): SalesTarget[] => [...state.items]
      .sort((a, b) => a.year - b.year || a.quarter - b.quarter),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<SalesTarget[]>>('/admin/sales-targets')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (target: Pick<SalesTarget, 'year' | 'quarter' | 'target_value'>): Promise<SalesTarget> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<SalesTarget>>('/admin/sales-targets', target)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Pick<SalesTarget, 'year' | 'quarter' | 'target_value'>): Promise<SalesTarget> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<SalesTarget>>(`/admin/sales-targets/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(t => t.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/sales-targets/${id}`)
      this.items = this.items.filter(t => t.id !== id)
    },
  },
})
