// Real API-backed store for the Admin-configurable Contact job title/role list
// (/admin/job-titles) — replaces the previously free-text Contact.role_title
// field as the source of truth for what job titles exist. Delete is a *soft*
// delete: the DELETE endpoint returns 204 and flips `is_active` to false
// server-side, so we patch that locally instead of splicing the record out.
const parseDates = (jobTitle: JobTitleOption): JobTitleOption => ({
  ...jobTitle,
  created_at: new Date(jobTitle.created_at),
})

export const useJobTitleOptionsStore = defineStore('jobTitleOptions', {
  state: () => ({
    items: [] as JobTitleOption[],
  }),
  getters: {
    activeOptions: (state): Select[] => state.items
      .filter(j => j.is_active)
      .map(j => ({ label: j.name, value: j.name })),
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<JobTitleOption[]>>('/admin/job-titles')
      this.items = response.data.data.map(parseDates)
      return this.items
    },
    async add (jobTitle: Omit<JobTitleOption, 'id' | 'created_at'>): Promise<JobTitleOption> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<JobTitleOption>>('/admin/job-titles', jobTitle)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<JobTitleOption, 'id' | 'created_at'>>): Promise<JobTitleOption> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<JobTitleOption>>(`/admin/job-titles/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(j => j.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove (id: number) {
      const { $api } = useNuxtApp()
      await $api.delete(`/admin/job-titles/${id}`)
      const jobTitle = this.items.find(j => j.id === id)
      if (jobTitle) jobTitle.is_active = false
    },
  },
})
