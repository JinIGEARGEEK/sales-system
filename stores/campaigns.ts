// Real API-backed store. Campaigns are a batch of Tasks created together
// against a set of Companies (e.g. bulk win-back outreach) — see
// interfaces/crm.d.ts's Campaign/CampaignType doc. Mirrors stores/tasks.ts'
// conventions.
const parseDates = (campaign: Campaign): Campaign => ({
  ...campaign,
  created_at: new Date(campaign.created_at),
})

export const useCampaignsStore = defineStore('campaigns', {
  state: () => ({
    items: [] as Campaign[],
  }),
  getters: {
    nameById: state => (id: number | null | undefined) => state.items.find(c => c.id === id)?.name || '-',
  },
  actions: {
    async fetchAll (): Promise<Campaign[]> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Campaign[]>>('/campaigns')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async create (payload: { name: string, type: CampaignType }): Promise<Campaign> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Campaign>>('/campaigns', payload)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    // Creates one Task per company_id under the given Campaign — the
    // response isn't surfaced here (tasksStore.fetchAll should be re-run by
    // the caller if it needs the newly-created Tasks reflected locally).
    async bulkCreateTasks (campaignId: number, payload: { company_ids: number[], title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }): Promise<Task[]> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Task[]>>(`/campaigns/${campaignId}/tasks`, payload)
      return response.data.data
    },
    async fetchProgress (campaignId: number): Promise<CampaignProgress> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<CampaignProgress>>(`/campaigns/${campaignId}/progress`)
      return response.data.data
    },
  },
})
