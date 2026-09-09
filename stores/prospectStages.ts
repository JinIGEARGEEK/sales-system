// Real API-backed store for the Admin-configurable Prospect stage list
// (/admin/prospect-stages) — replaces the previously hardcoded
// PROSPECT_STATUS_OPTIONS/PROSPECT_STATUS_COLORS constants as the source of
// truth for what stages exist. Mirrors stores/pipelineStages.ts, minus the
// won/lost getters (Prospect stages have no win/loss concept). Delete is a
// *soft* delete: the DELETE endpoint returns 204 and flips `is_active` to
// false server-side, so we patch that locally instead of splicing the
// record out.
const parseDates = (stage: ProspectStage): ProspectStage => ({
  ...stage,
  created_at: new Date(stage.created_at),
})

export const useProspectStagesStore = defineStore('prospectStages', {
  state: () => ({
    items: [] as ProspectStage[],
  }),
  getters: {
    // Kanban/select options — active stages only, in configured sort order.
    activeOptions: (state): Select[] => state.items
      .filter(s => s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({ label: s.name, value: s.name })),
    byName: state => (name: string) => state.items.find(s => s.name === name),
    // Resolves the actual disqualified-flagged stage's configured `name` (an
    // Admin can rename it away from the literal "Disqualified") — falls back
    // to the literal name only if no row is flagged yet (e.g. store hasn't
    // loaded), same pattern as usePipelineStagesStore's wonStageName/lostStageName.
    disqualifiedStageName: (state): string => state.items.find(s => s.is_disqualified_stage)?.name ?? 'Disqualified',
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<ProspectStage[]>>('/admin/prospect-stages')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (stage: Omit<ProspectStage, 'id' | 'created_at'>): Promise<ProspectStage> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<ProspectStage>>('/admin/prospect-stages', stage)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<ProspectStage, 'id' | 'created_at'>>): Promise<ProspectStage> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<ProspectStage>>(`/admin/prospect-stages/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(s => s.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/prospect-stages/${id}`)
      const stage = this.items.find(s => s.id === id)
      if (stage) stage.is_active = false
    },
  },
})
