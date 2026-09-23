// Overview Pipeline (FR-CRM-123) — GET /pipeline/overview returns the whole
// board (summary strip + Prospect/Lead/Deal lanes) in one payload, so this
// store holds exactly one response. Stage moves themselves still go through
// each entity's own store (dealsStore.updateStage, leadsStore.updateStatus,
// prospectsStore.updateStatus); the page just refetches here afterwards.
export const usePipelineOverviewStore = defineStore('pipelineOverview', {
  state: () => ({
    data: null as PipelineOverview | null,
    // When `data` last landed, for the page's "Updated hh:mm" note.
    fetchedAt: null as Date | null,
    loading: false,
    // Bumped on every fetch so a slow response for an older filter set can't
    // overwrite a newer one that already landed (fast filter/period clicks).
    requestSeq: 0,
  }),
  actions: {
    async fetch (params: PipelineOverviewParams = {}): Promise<PipelineOverview | null> {
      const { $api } = useNuxtApp()
      const seq = ++this.requestSeq
      this.loading = true
      try {
        const response = await $api.get<ApiResponse<PipelineOverview>>('/pipeline/overview', { params })
        if (seq !== this.requestSeq) return this.data
        this.data = response.data.data
        this.fetchedAt = new Date()
        return this.data
      } finally {
        if (seq === this.requestSeq) this.loading = false
      }
    },
  },
})
