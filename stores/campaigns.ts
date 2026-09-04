// Real API-backed store. Campaigns are a batch of Tasks created together
// against a set of targets (Company/Lead/Contact) — see
// interfaces/crm.d.ts's Campaign/CampaignType/CampaignTarget doc. Mirrors
// stores/tasks.ts' conventions.
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
    // Creates one Task per target under the given Campaign — works the same
    // whether campaignId is a campaign just created for this call or an
    // existing one already carrying Tasks (that's how "add to an existing
    // campaign" works, no separate action needed). The response isn't
    // surfaced here (tasksStore.fetchAll should be re-run by the caller if
    // it needs the newly-created Tasks reflected locally).
    async bulkCreateTasks (campaignId: number, payload: { targets: { related_type: TaskRelatedType, related_id: number }[], title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }): Promise<Task[]> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Task[]>>(`/campaigns/${campaignId}/tasks`, payload)
      return response.data.data
    },
    async fetchProgress (campaignId: number): Promise<CampaignProgress> {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<CampaignProgress>>(`/campaigns/${campaignId}/progress`)
      return response.data.data
    },
    // Single entry point CampaignTaskSetupForm's submit payload maps onto —
    // 'new' creates the Campaign first then bulk-creates Tasks against it,
    // 'existing' skips straight to bulk-creating Tasks on the chosen
    // Campaign. Every list/detail-page "Add to Campaign" action should call
    // this rather than reimplementing the create-then-bulk-create branch.
    async submitCampaignTasks (targets: CampaignTarget[], payload: CampaignTaskSetupSubmitPayload): Promise<Campaign> {
      const campaign = payload.mode === 'existing'
        ? this.items.find(c => c.id === payload.campaignId)
        : await this.create({ name: payload.name, type: payload.type })
      if (!campaign) throw new Error('Campaign not found')

      await this.bulkCreateTasks(campaign.id, {
        targets: targets.map(target => ({ related_type: target.type, related_id: target.id })),
        title: payload.title,
        description: payload.description,
        due_date: payload.due_date,
        priority: payload.priority,
        assigned_to: payload.assigned_to,
      })
      return campaign
    },
  },
})
