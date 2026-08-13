// ── Team members (lead/deal assignment) ─────────────────────────────

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: 1, name: 'Sirinya Boonmee', email: 'sirinya@igeargeek.com' },
  { id: 2, name: 'Kritsada Panya', email: 'kritsada@igeargeek.com' },
  { id: 3, name: 'Melissa Tran', email: 'melissa@igeargeek.com' },
  { id: 4, name: 'Anucha Srisawat', email: 'anucha@igeargeek.com' },
]

export const TEAM_MEMBER_OPTIONS: Select[] = MOCK_TEAM_MEMBERS.map(m => ({ label: m.name, value: String(m.id) }))

export const TEAM_MEMBER_FILTER_OPTIONS: Select[] = [
  { label: 'All Team Members', value: 'all' },
  { label: 'Unassigned', value: 'unassigned' },
  ...TEAM_MEMBER_OPTIONS,
]

export const teamMemberNameById = (id: number | null) => MOCK_TEAM_MEMBERS.find(m => m.id === id)?.name || 'Unassigned'

// Shared predicate for the "All / Unassigned / <member>" assignee filter used
// on both the leads and deals list pages.
export const matchesAssigneeFilter = (assignedTo: number | null, filter: string): boolean => {
  if (filter === 'all') return true
  if (filter === 'unassigned') return assignedTo === null
  return String(assignedTo) === filter
}
