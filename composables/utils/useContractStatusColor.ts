// Badge coloring for Contract status.
const CONTRACT_STATUS_COLOR: Partial<Record<ContractStatus, BadgeColor>> = {
  sent: 'info',
  signed: 'success',
  expired: 'warning',
}

export const useContractStatusColor = () => {
  const contractStatusBadgeColor = (status: ContractStatus) => badgeColorFromMap(status, CONTRACT_STATUS_COLOR)

  return { contractStatusBadgeColor }
}
