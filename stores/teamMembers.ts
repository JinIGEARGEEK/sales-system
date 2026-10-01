import { SALES_PIPELINE_ROLES } from '~/constants/roles'

// Real API-backed store. GET /team-members returns only active users, lightweight
// {id, name, email, role} — no pagination envelope.
const toOption = (member: TeamMember) => ({ label: member.name, value: String(member.id) })

// Whether a member may own a Deal/Lead/Prospect/Task: the API's
// validateAssignee takes an active Admin/Sales Rep/Sales Manager/Marketing
// user and answers 422 on assigned_to for anyone else (Production).
const canOwnRecords = (member: TeamMember) => !member.role || SALES_PIPELINE_ROLES.includes(member.role)

export const useTeamMembersStore = defineStore('teamMembers', {
  state: () => ({
    items: [] as TeamMember[],
  }),
  getters: {
    // Everyone, e.g. for a report filter.
    options: state => state.items.map(toOption),
    // An assignee picker (CrmTeamMemberSelect): only members who may own the
    // record — see canOwnRecords.
    assigneeOptions: state => state.items.filter(canOwnRecords).map(toOption),
    // A bulk "Reassign to" picker: Unassigned plus assigneeOptions.
    bulkReassignOptions: (state): Select[] => [
      { label: 'Unassigned', value: 'unassigned' },
      ...state.items.filter(canOwnRecords).map(toOption),
    ],
    filterOptions: (state): Select[] => [
      { label: 'All Team Members', value: 'all' },
      { label: 'Unassigned', value: 'unassigned' },
      ...state.items.map(toOption),
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
