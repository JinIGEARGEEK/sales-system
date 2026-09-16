// Badge coloring for Project status.
const PROJECT_STATUS_COLOR: Partial<Record<ProjectStatus, BadgeColor>> = {
  'In Progress': 'info',
  'On Hold': 'warning',
  'Completed': 'success',
  'Cancelled': 'error',
}

export const useProjectStatusColor = () => {
  const projectStatusBadgeColor = (status: ProjectStatus) => badgeColorFromMap(status, PROJECT_STATUS_COLOR)

  return { projectStatusBadgeColor }
}
