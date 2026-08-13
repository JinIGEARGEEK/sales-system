export const DEAL_STAGE_OPTIONS: Select[] = [
  { label: 'Lead', value: 'Lead' },
  { label: 'Qualified', value: 'Qualified' },
  { label: 'Proposal Sent', value: 'Proposal Sent' },
  { label: 'Negotiation', value: 'Negotiation' },
  { label: 'Won', value: 'Won' },
  { label: 'Lost', value: 'Lost' },
]

// Per-stage colors for the Kanban board, co-located with DEAL_STAGE_OPTIONS so the two
// lists are kept in sync in one place instead of two — see CrmPipelineBoard's fallback
// color for what happens if a stage here is missing a color.
export const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  Lead: '#5B5FE9',
  Qualified: '#4A9FE8',
  'Proposal Sent': '#00C2B8',
  Negotiation: '#F5A623',
  Won: '#00C875',
  Lost: '#E2445C',
}

export const dealStatusForStage = (stage: DealStage): DealStatus => {
  if (stage === 'Won') return 'won'
  if (stage === 'Lost') return 'lost'
  return 'open'
}

// ── Sales channels & business units (deal filtering on the dashboard) ──

export const CHANNEL_OPTIONS: Select[] = [
  { label: 'Referral', value: 'Referral' },
  { label: 'Website', value: 'Website' },
  { label: 'Event', value: 'Event' },
  { label: 'Ads', value: 'Ads' },
  { label: 'Other', value: 'Other' },
]

export const CHANNEL_FILTER_OPTIONS: Select[] = [
  { label: 'All Channels', value: 'all' },
  ...CHANNEL_OPTIONS,
]

export const BUSINESS_UNIT_FILTER_OPTIONS: Select[] = [
  { label: 'All Business Units', value: 'all' },
  { label: 'Project', value: 'Project' },
  { label: 'Product', value: 'Product' },
]

export const MOCK_PROJECTS: Select[] = [
  { label: 'Ops Platform Rollout', value: 'ops-platform-rollout' },
  { label: 'POS Integration', value: 'pos-integration' },
  { label: 'Legacy Migration', value: 'legacy-migration' },
]

export const MOCK_PRODUCTS: Select[] = [
  { label: 'Dashboard Suite', value: 'dashboard-suite' },
  { label: 'Finance Reporting Suite', value: 'finance-reporting-suite' },
  { label: 'Mobile App', value: 'mobile-app' },
]

export const PROJECT_FILTER_OPTIONS: Select[] = [
  { label: 'All Projects', value: 'all' },
  ...MOCK_PROJECTS,
]

export const PRODUCT_FILTER_OPTIONS: Select[] = [
  { label: 'All Products', value: 'all' },
  ...MOCK_PRODUCTS,
]

// Quarterly new-business quota used for the pipeline coverage ratio on the dashboard.
export const QUARTERLY_SALES_TARGET = 2000000

export const MOCK_DEALS: Deal[] = [
  { id: 1, company_id: 1, contact_id: 1, title: 'Acme Co. — Ops Platform Rollout', value: 850000, stage: 'Negotiation', status: 'open', expected_close_date: new Date('2025-09-15'), assigned_to: 1, channel: 'Referral', business_unit: 'Project', business_unit_item: 'ops-platform-rollout', created_at: new Date('2025-05-01') },
  { id: 2, company_id: 2, contact_id: 3, title: 'Globex — POS Integration', value: 320000, stage: 'Proposal Sent', status: 'open', expected_close_date: new Date('2025-08-30'), assigned_to: 2, channel: 'Event', business_unit: 'Project', business_unit_item: 'pos-integration', created_at: new Date('2025-06-10') },
  { id: 3, company_id: 3, contact_id: 4, title: 'Initech — Dashboard MVP', value: 180000, stage: 'Qualified', status: 'open', expected_close_date: new Date('2025-09-01'), assigned_to: null, channel: 'Website', business_unit: 'Product', business_unit_item: 'dashboard-suite', created_at: new Date('2025-07-05') },
  { id: 4, company_id: 5, contact_id: 6, title: 'Soylent — Finance Reporting Suite', value: 540000, stage: 'Won', status: 'won', expected_close_date: new Date('2025-07-01'), assigned_to: 1, channel: 'Referral', business_unit: 'Product', business_unit_item: 'finance-reporting-suite', created_at: new Date('2025-04-15') },
  { id: 5, company_id: 4, contact_id: 5, title: 'Umbrella — Legacy Migration', value: 95000, stage: 'Lost', status: 'lost', expected_close_date: new Date('2025-05-01'), assigned_to: 3, channel: 'Ads', business_unit: 'Project', business_unit_item: 'legacy-migration', created_at: new Date('2025-03-01') },
  { id: 6, company_id: 1, contact_id: 2, title: 'Acme Co. — Mobile App Add-on', value: 210000, stage: 'Lead', status: 'open', expected_close_date: null, assigned_to: 4, channel: 'Website', business_unit: 'Product', business_unit_item: 'mobile-app', created_at: new Date('2025-07-25') },
]

// ── Duplicate detection (simple deal dedup) ─────────────────────────

export const findDuplicateDeals = (deals: Deal[], companyId: string, contactId: string, excludeId?: number): Deal[] => {
  if (!companyId) return []

  return deals.filter((deal) => {
    if (deal.id === excludeId) return false
    if (deal.status !== 'open') return false
    const companyMatch = String(deal.company_id) === companyId
    const contactMatch = !contactId || String(deal.contact_id) === contactId
    return companyMatch && contactMatch
  })
}
