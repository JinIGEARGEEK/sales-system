// Shared predicate for the "All / Unassigned / <member>" assignee filter used
// on both the leads and deals list pages.
export const matchesAssigneeFilter = (assignedTo: number | null, filter: string): boolean => {
  if (filter === 'all') return true
  if (filter === 'unassigned') return assignedTo === null
  return String(assignedTo) === filter
}
