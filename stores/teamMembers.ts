// Real API-backed store. GET /team-members returns only active users, lightweight
// {id, name, email} — no pagination envelope.
export const useTeamMembersStore = defineStore('teamMembers', {
  state: () => ({
    items: [] as TeamMember[],
  }),
  getters: {
    options: state => state.items.map(m => ({ label: m.name, value: String(m.id) })),
    // Who a Task may be assigned to: an active Admin/Sales Rep/Sales Manager/
    // Marketing user (POST /tasks, PATCH /tasks/:id and the bulk/campaign
    // reassigns answer 422 assigned_to otherwise). The list is active users
    // only already; Production is dropped once the API says who that is.
    taskAssigneeOptions: state => state.items
      .filter(m => !m.role || m.role !== 'Production')
      .map(m => ({ label: m.name, value: String(m.id) })),
    filterOptions: (state): Select[] => [
      { label: 'All Team Members', value: 'all' },
      { label: 'Unassigned', value: 'unassigned' },
      ...state.items.map(m => ({ label: m.name, value: String(m.id) })),
    ],
    nameById: state => (id: number | null) => state.items.find(m => m.id === id)?.name || 'Unassigned',
  },
  actions: {
    async fetchAll () {
      const { $api } = useNuxtApp()
      const response = await $api.get<ApiResponse<TeamMember[]>>('/team-members')
      this.items = response.data.data
      return this.items
    },
  },
})
