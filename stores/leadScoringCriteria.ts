// Real API-backed store for the Admin-configurable lead-scoring criteria list
// (/admin/lead-scoring-criteria, FR-CRM-006/007) — clone of leadSources.ts's
// pattern. Delete is a *soft* delete: the DELETE endpoint returns 204 and
// flips `is_active` to false server-side, so we patch that locally instead
// of splicing the record out.
const parseDates = (criterion: LeadScoringCriterion): LeadScoringCriterion => ({
  ...criterion,
  created_at: new Date(criterion.created_at),
})

export const useLeadScoringCriteriaStore = defineStore('leadScoringCriteria', {
  state: () => ({
    items: [] as LeadScoringCriterion[],
  }),
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<LeadScoringCriterion[]>>('/admin/lead-scoring-criteria')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (criterion: Omit<LeadScoringCriterion, 'id' | 'created_at'>): Promise<LeadScoringCriterion> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<LeadScoringCriterion>>('/admin/lead-scoring-criteria', criterion)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<LeadScoringCriterion, 'id' | 'created_at'>>): Promise<LeadScoringCriterion> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<LeadScoringCriterion>>(`/admin/lead-scoring-criteria/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(c => c.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/lead-scoring-criteria/${id}`)
      const criterion = this.items.find(c => c.id === id)
      if (criterion) criterion.is_active = false
    },
  },
})
