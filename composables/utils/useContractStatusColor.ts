// Badge coloring and display labels for Contract status.
const CONTRACT_STATUS_COLOR: Partial<Record<ContractStatus, BadgeColor>> = {
  sent: 'info',
  signed: 'success',
  expired: 'warning',
}

export const CONTRACT_STATUSES: ContractStatus[] = ['draft', 'sent', 'signed', 'expired']

export const useContractStatusColor = () => {
  const contractStatusBadgeColor = (status: ContractStatus) => badgeColorFromMap(status, CONTRACT_STATUS_COLOR)
  const contractStatusLabel = (status: ContractStatus) => statusLabelFromGroup('contract', status)
  const contractStatusOptions = computed<Select[]>(() =>
    CONTRACT_STATUSES.map(value => ({ value, label: contractStatusLabel(value) })))
  // What a status select may offer: never Signed — a contract becomes
  // signed only by uploading the signed document (the API answers 422 to
  // status "signed" otherwise).
  const contractEditableStatusOptions = computed<Select[]>(() =>
    CONTRACT_STATUSES.filter(value => value !== 'signed').map(value => ({ value, label: contractStatusLabel(value) })))

  return { contractStatusBadgeColor, contractStatusLabel, contractStatusOptions, contractEditableStatusOptions }
}
