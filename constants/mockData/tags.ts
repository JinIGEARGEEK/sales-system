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

export const MOCK_TAGS: Tag[] = [
  { id: 1, name: 'Tier 1', category: 'Tier', description: 'Top-tier strategic accounts with the highest revenue potential.', status: 'active', created_at: new Date('2024-01-10') },
  { id: 2, name: 'Tier 2', category: 'Tier', description: 'Established accounts generating steady, moderate revenue.', status: 'active', created_at: new Date('2024-01-10') },
  { id: 3, name: 'Tier 3', category: 'Tier', description: 'Smaller or newer accounts under standard support.', status: 'active', created_at: new Date('2024-01-10') },
  { id: 4, name: 'Priority', category: 'Priority', description: 'Accounts flagged for immediate sales or support attention.', status: 'active', created_at: new Date('2024-01-15') },
  { id: 5, name: 'Technology', category: 'Industry', description: 'Companies operating in software, hardware, or IT services.', status: 'active', created_at: new Date('2024-01-15') },
  { id: 6, name: 'Retail', category: 'Industry', description: 'Companies selling goods directly to consumers.', status: 'active', created_at: new Date('2024-01-15') },
  { id: 7, name: 'Manufacturing', category: 'Industry', description: 'Companies producing physical goods at scale.', status: 'active', created_at: new Date('2024-01-15') },
  { id: 8, name: 'Healthcare', category: 'Industry', description: 'Companies in medical, pharmaceutical, or wellness services.', status: 'active', created_at: new Date('2024-01-15') },
  { id: 9, name: 'Finance', category: 'Industry', description: 'Companies in banking, insurance, or financial services.', status: 'active', created_at: new Date('2024-01-15') },
  { id: 10, name: 'Education', category: 'Industry', description: 'Companies providing educational products or services.', status: 'inactive', created_at: new Date('2024-01-15') },
]
