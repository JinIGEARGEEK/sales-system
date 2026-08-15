export const TAG_CATEGORY_OPTIONS: Select[] = [
  { label: 'Customer Tier', value: 'Tier' },
  { label: 'Industry', value: 'Industry' },
  { label: 'Priority', value: 'Priority' },
]

export const TAG_STATUS_OPTIONS: Select[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

export const TAG_STATUS_FORM_OPTIONS: Select[] = TAG_STATUS_OPTIONS.filter(o => o.value !== 'all')
