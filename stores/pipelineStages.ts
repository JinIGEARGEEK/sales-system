// Real API-backed store for the Admin-configurable pipeline stage list
// (/admin/pipeline-stages) — replaces the previously hardcoded
// DEAL_STAGE_OPTIONS/DEAL_STAGE_COLORS constants as the source of truth for
// what stages exist and how the Kanban board colors them. Delete is a *soft*
// delete: the DELETE endpoint returns 204 and flips `is_active` to false
// server-side, so we patch that locally instead of splicing the record out.
const parseDates = (stage: PipelineStage): PipelineStage => ({
  ...stage,
  created_at: new Date(stage.created_at),
})

export const usePipelineStagesStore = defineStore('pipelineStages', {
  state: () => ({
    items: [] as PipelineStage[],
  }),
  getters: {
    // Kanban/select options — active stages only, in configured sort order.
    activeOptions: (state): Select[] => state.items
      .filter(s => s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({ label: s.name, value: s.name })),
    byName: state => (name: string) => state.items.find(s => s.name === name),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<PipelineStage[]>>('/admin/pipeline-stages')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (stage: Omit<PipelineStage, 'id' | 'created_at'>): Promise<PipelineStage> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<PipelineStage>>('/admin/pipeline-stages', stage)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<PipelineStage, 'id' | 'created_at'>>): Promise<PipelineStage> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<PipelineStage>>(`/admin/pipeline-stages/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(s => s.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/pipeline-stages/${id}`)
      const stage = this.items.find(s => s.id === id)
      if (stage) stage.is_active = false
    },
  },
})
