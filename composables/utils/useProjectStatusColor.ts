// Badge coloring and display labels for Project status.
const PROJECT_STATUS_COLOR: Partial<Record<ProjectStatus, BadgeColor>> = {
  'In Progress': 'info',
  'On Hold': 'warning',
  'Completed': 'success',
  'Cancelled': 'error',
}

// Project status values are Title Case with spaces (the API's own strings),
// so they map onto camelCase locale keys under global.status.project.
const PROJECT_STATUS_KEY: Record<ProjectStatus, string> = {
  'Not Started': 'notStarted',
  'In Progress': 'inProgress',
  'On Hold': 'onHold',
  'Completed': 'completed',
  'Cancelled': 'cancelled',
}

const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_KEY) as ProjectStatus[]

export const useProjectStatusColor = () => {
  const projectStatusBadgeColor = (status: ProjectStatus) => badgeColorFromMap(status, PROJECT_STATUS_COLOR)
  const projectStatusLabel = (status: ProjectStatus) => statusLabelFromGroup('project', status, PROJECT_STATUS_KEY)
  const projectStatusOptions = computed<Select[]>(() =>
    PROJECT_STATUSES.map(value => ({ value, label: projectStatusLabel(value) })))

  return { projectStatusBadgeColor, projectStatusLabel, projectStatusOptions }
}
