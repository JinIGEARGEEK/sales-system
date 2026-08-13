export const INDUSTRY_OPTIONS: Select[] = [
  { label: 'Technology', value: 'Technology' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Education', value: 'Education' },
]

export const COMPANY_STATUS_OPTIONS: Select[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
]

export const COMPANY_STATUS_FORM_OPTIONS: Select[] = COMPANY_STATUS_OPTIONS.filter(o => o.value !== 'all')

export const MOCK_COMPANIES: Company[] = [
  { id: 1, name: 'Acme Co.', industry: 'Technology', size: '51-200', website: 'https://acme.example.com', tags: ['Tier 1', 'Priority'], notes: 'Long-time client, strategic account.', status: 'active', created_at: new Date('2024-02-10'), updated_at: new Date('2025-06-01') },
  { id: 2, name: 'Globex Retail', industry: 'Retail', size: '201-500', website: 'https://globex.example.com', tags: ['Tier 2'], notes: '', status: 'active', created_at: new Date('2024-05-22'), updated_at: new Date('2025-05-14') },
  { id: 3, name: 'Initech Manufacturing', industry: 'Manufacturing', size: '11-50', website: 'https://initech.example.com', tags: [], notes: 'Interested in dashboard product.', status: 'active', created_at: new Date('2024-08-01'), updated_at: new Date('2025-01-11') },
  { id: 4, name: 'Umbrella Health', industry: 'Healthcare', size: '500+', website: 'https://umbrella.example.com', tags: ['Tier 1'], notes: '', status: 'archived', created_at: new Date('2023-11-19'), updated_at: new Date('2024-09-30') },
  { id: 5, name: 'Soylent Finance', industry: 'Finance', size: '51-200', website: 'https://soylent.example.com', tags: ['Tier 2', 'Priority'], notes: '', status: 'active', created_at: new Date('2025-01-05'), updated_at: new Date('2025-07-20') },
]
