export const COMPANY_STATUS_OPTIONS: Select[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
]

export const COMPANY_STATUS_FORM_OPTIONS: Select[] = COMPANY_STATUS_OPTIONS.filter(o => o.value !== 'all')
