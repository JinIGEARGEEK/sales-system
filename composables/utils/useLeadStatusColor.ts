// Badge coloring for Lead status, shared between the list and detail pages.
const LEAD_STATUS_COLOR: Partial<Record<LeadStatus, BadgeColor>> = {
  Qualified: 'success',
  Disqualified: 'error',
  Contacted: 'info',
}

export const useLeadStatusColor = () => {
  const leadStatusColor = (status: LeadStatus) => badgeColorFromMap(status, LEAD_STATUS_COLOR)

  return { leadStatusColor }
}
