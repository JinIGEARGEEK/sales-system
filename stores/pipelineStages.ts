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
    // Resolves the actual won/lost-flagged stage's configured `name` (an Admin
    // can rename these away from the literal "Won"/"Lost") — falls back to the
    // literal name only if no row is flagged yet (e.g. store hasn't loaded),
    // matching the same store-then-fallback pattern as useDealStageColor.ts.
    wonStageName: (state): string => state.items.find(s => s.is_won_stage)?.name ?? 'Won',
    lostStageName: (state): string => state.items.find(s => s.is_lost_stage)?.name ?? 'Lost',
    // Where a new Deal starts: the first active, non-won/lost stage in sort
    // order (seeded as "Lead", but an Admin can rename it). Mirrors the
    // backend's utils.DefaultPipelineStage.
    firstOpenStageName: (state): string => [...state.items]
      .filter(s => s.is_active && !s.is_won_stage && !s.is_lost_stage)
      .sort((a, b) => a.sort_order - b.sort_order)[0]?.name ?? 'Lead',
    // Won/Lost by the stage row's flag, so a renamed Won/Lost stage still
    // counts; the seeded literal name only before the row has loaded.
    isWonStage: state => (name: string): boolean => state.items.find(s => s.name === name)?.is_won_stage ?? name === 'Won',
    isLostStage: state => (name: string): boolean => state.items.find(s => s.name === name)?.is_lost_stage ?? name === 'Lost',
    // The status a Deal takes in this stage — mirrors the backend's
    // resolveDealStatus for a Won/Lost-flagged stage.
    statusForStage (): (name: string) => DealStatus {
      return (name: string) => {
        if (this.isWonStage(name)) return 'won'
        if (this.isLostStage(name)) return 'lost'
        return 'open'
      }
    },
    // The server's default probability for this stage (PipelineStage.
    // default_probability), or null when the row (or the field) isn't
    // loaded — send null then and the API applies the same default itself.
    defaultProbability: state => (name: string): number | null =>
      state.items.find(s => s.name === name)?.default_probability ?? null,
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
      await this.refreshDefaults()
      return created
    },
    async update (id: number, changes: PipelineStageUpdatePayload): Promise<PipelineStage> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<PipelineStage>>(`/admin/pipeline-stages/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(s => s.id === id)
      if (index !== -1) this.items[index] = updated
      await this.refreshDefaults()
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/pipeline-stages/${id}`)
      const stage = this.items.find(s => s.id === id)
      if (stage) stage.is_active = false
      await this.refreshDefaults()
    },
    // Adding, moving or (de)activating one open stage shifts every other
    // open stage's default_probability (they interpolate across the funnel),
    // so re-read the list after a write. Best effort: the write itself
    // already succeeded, and a stale default only affects a form prefill the
    // server would correct anyway.
    async refreshDefaults () {
      try {
        await this.fetchAll()
      } catch {
        // keep the locally patched list
      }
    },
  },
})
