// Real API-backed store, scoped one company at a time. Projects are a summary
// record only — no sub-resources for tasks/sprints/milestones (api-system-spec.md §8.3).
const parseDates = (project: Project): Project => ({
  ...project,
  start_date: new Date(project.start_date),
  target_end_date: project.target_end_date ? new Date(project.target_end_date) : null,
  expected_proposal_date: project.expected_proposal_date ? new Date(project.expected_proposal_date) : null,
  expected_start_date: project.expected_start_date ? new Date(project.expected_start_date) : null,
})

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    items: [] as Project[],
    total: 0,
    page: 1,
  }),
  getters: {
    forCompany: state => (companyId: number) => state.items.filter(p => p.company_id === companyId),
    forDeal: state => (dealId: number) => state.items.find(p => p.deal_id === dealId),
    // Deduped, sorted list of previously-used Project names, optionally scoped
    // to one company — feeds AddProjectModal's creatable name combobox so reps
    // can reuse an existing name or type a new one.
    projectNames: state => (companyId?: number | null) => [...new Set(
      state.items
        .filter(p => companyId == null || p.company_id === companyId)
        .map(p => p.name),
    )].sort(),
  },
  actions: {
    // GET /projects — the cross-company list (each row carries `company_name`),
    // as opposed to fetchForCompany's single-company GET /companies/:id/projects.
    async fetchAll (params?: Record<string, unknown>) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Project[]>>('/projects', {
        params: { per_page: 1000, ...params },
      })
      this.items = response.data.data.map(parseDates)
      this.total = response.data.total
      this.page = response.data.page
      return this.items
    },
    async fetchForCompany (companyId: number) {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<Project[]>>(`/companies/${companyId}/projects`)
      const fetched = response.data.data.map(parseDates)
      this.items = [...this.items.filter(p => p.company_id !== companyId), ...fetched]
      return fetched
    },
    async add (companyId: number, project: Omit<Project, 'id' | 'company_id'>): Promise<Project> {
      const { $api } = useNuxtApp()
      const response = await $api.post<ApiResponse<Project>>(`/companies/${companyId}/projects`, project)
      const created = parseDates(response.data.data)
      this.items.push(created)
      return created
    },
    async update (id: number, changes: Partial<Omit<Project, 'id' | 'company_id'>>): Promise<Project> {
      const { $api } = useNuxtApp()
      const response = await $api.patch<ApiResponse<Project>>(`/projects/${id}`, changes)
      const updated = parseDates(response.data.data)
      const index = this.items.findIndex(p => p.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
  },
})
