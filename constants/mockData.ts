export const ACTIVITY_TYPE_OPTIONS: Select[] = [
  { label: 'All Types', value: 'all' },
  { label: 'User', value: 'user' },
  { label: 'Order', value: 'order' },
  { label: 'System', value: 'system' },
  { label: 'Payment', value: 'payment' },
  { label: 'Report', value: 'report' },
]

export const ACTIVITY_TYPE_ICON: Record<ActivityItemType, string> = {
  user: 'material-symbols:person-add-outline',
  order: 'material-symbols:package-2',
  system: 'material-symbols:dns-outline',
  payment: 'material-symbols:credit-card-outline',
  report: 'material-symbols:insert-chart-outline',
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  { title: 'New user registered', description: 'john.doe@example.com signed up', datetime: '2025-03-06T10:30:00', icon: ACTIVITY_TYPE_ICON.user, type: 'user' },
  { title: 'Order completed', description: 'Order #1234 was delivered successfully', datetime: '2025-03-06T09:15:00', icon: ACTIVITY_TYPE_ICON.order, type: 'order' },
  { title: 'System update', description: 'Server maintenance completed', datetime: '2025-03-05T22:00:00', icon: ACTIVITY_TYPE_ICON.system, type: 'system' },
  { title: 'Payment received', description: '$1,250.00 from Premium plan subscription', datetime: '2025-03-05T16:45:00', icon: ACTIVITY_TYPE_ICON.payment, type: 'payment' },
  { title: 'Report generated', description: 'Monthly analytics report is ready', datetime: '2025-03-05T14:00:00', icon: ACTIVITY_TYPE_ICON.report, type: 'report' },
  { title: 'New user registered', description: 'nattaya.wong@example.com signed up', datetime: '2025-03-05T11:20:00', icon: ACTIVITY_TYPE_ICON.user, type: 'user' },
  { title: 'Order cancelled', description: 'Order #1230 was cancelled by customer', datetime: '2025-03-04T17:40:00', icon: ACTIVITY_TYPE_ICON.order, type: 'order' },
  { title: 'Scheduled backup completed', description: 'Nightly database backup finished successfully', datetime: '2025-03-04T02:00:00', icon: ACTIVITY_TYPE_ICON.system, type: 'system' },
  { title: 'Payment failed', description: 'Card declined for invoice #4821', datetime: '2025-03-03T13:05:00', icon: ACTIVITY_TYPE_ICON.payment, type: 'payment' },
  { title: 'Weekly report generated', description: 'Weekly sales summary is ready', datetime: '2025-03-03T09:00:00', icon: ACTIVITY_TYPE_ICON.report, type: 'report' },
  { title: 'User role updated', description: 'Bob Wilson was promoted to Editor', datetime: '2025-03-02T15:30:00', icon: ACTIVITY_TYPE_ICON.user, type: 'user' },
  { title: 'Order completed', description: 'Order #1228 was delivered successfully', datetime: '2025-03-01T10:10:00', icon: ACTIVITY_TYPE_ICON.order, type: 'order' },
]

export const MOCK_USERS: AdminUser[] = [
  { id: 1, first_name: 'John', last_name: 'Doe', username: 'johndoe', email: 'john.doe@example.com', tel: '0812345678', role: 'Admin', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2024-01-15'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 0, updated_by: 1, deleted_by: 0 },
  { id: 2, first_name: 'Jane', last_name: 'Smith', username: 'janesmith', email: 'jane.smith@example.com', tel: '0823456789', role: 'Editor', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-05'), created_at: new Date('2024-02-20'), updated_at: new Date('2025-03-05'), deleted_at: null, created_by: 1, updated_by: 2, deleted_by: 0 },
  { id: 3, first_name: 'Bob', last_name: 'Wilson', username: 'bobwilson', email: 'bob.wilson@example.com', tel: '0834567890', role: 'Viewer', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-04'), created_at: new Date('2024-03-10'), updated_at: new Date('2025-03-04'), deleted_at: null, created_by: 1, updated_by: 3, deleted_by: 0 },
  { id: 4, first_name: 'Alice', last_name: 'Johnson', username: 'alicej', email: 'alice.j@example.com', tel: '0845678901', role: 'Editor', is_active: false, accepted_consent_id: 1, latest_login: new Date('2025-02-28'), created_at: new Date('2024-04-05'), updated_at: new Date('2025-02-28'), deleted_at: null, created_by: 1, updated_by: 4, deleted_by: 0 },
  { id: 5, first_name: 'Charlie', last_name: 'Brown', username: 'charlieb', email: 'charlie.b@example.com', tel: '0856789012', role: 'Viewer', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2024-05-12'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 2, updated_by: 5, deleted_by: 0 },
  { id: 6, first_name: 'Diana', last_name: 'Lee', username: 'dianlee', email: 'diana.lee@example.com', tel: '0867890123', role: 'Admin', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2024-06-01'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 1, updated_by: 6, deleted_by: 0 },
  { id: 7, first_name: 'Edward', last_name: 'Kim', username: 'edwardk', email: 'edward.kim@example.com', tel: '0878901234', role: 'Editor', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-03'), created_at: new Date('2024-07-18'), updated_at: new Date('2025-03-03'), deleted_at: null, created_by: 1, updated_by: 7, deleted_by: 0 },
  { id: 8, first_name: 'Fiona', last_name: 'Chen', username: 'fionac', email: 'fiona.chen@example.com', tel: '0889012345', role: 'Viewer', is_active: false, accepted_consent_id: 1, latest_login: new Date('2025-02-15'), created_at: new Date('2024-08-22'), updated_at: new Date('2025-02-15'), deleted_at: null, created_by: 2, updated_by: 8, deleted_by: 0 },
  { id: 9, first_name: 'George', last_name: 'Taylor', username: 'georget', email: 'george.t@example.com', tel: '0890123456', role: 'Editor', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-05'), created_at: new Date('2024-09-30'), updated_at: new Date('2025-03-05'), deleted_at: null, created_by: 1, updated_by: 9, deleted_by: 0 },
  { id: 10, first_name: 'Hannah', last_name: 'Park', username: 'hannahp', email: 'hannah.park@example.com', tel: '0801234567', role: 'Viewer', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2024-10-14'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 6, updated_by: 10, deleted_by: 0 },
  { id: 11, first_name: 'Ivan', last_name: 'Wong', username: 'ivanw', email: 'ivan.wong@example.com', tel: '0812345679', role: 'Editor', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-04'), created_at: new Date('2024-11-05'), updated_at: new Date('2025-03-04'), deleted_at: null, created_by: 1, updated_by: 11, deleted_by: 0 },
  { id: 12, first_name: 'Julia', last_name: 'Martinez', username: 'juliam', email: 'julia.m@example.com', tel: '0823456780', role: 'Viewer', is_active: false, accepted_consent_id: 1, latest_login: new Date('2025-01-20'), created_at: new Date('2024-12-01'), updated_at: new Date('2025-01-20'), deleted_at: null, created_by: 2, updated_by: 12, deleted_by: 0 },
  { id: 13, first_name: 'Kevin', last_name: 'Nguyen', username: 'kevinn', email: 'kevin.n@example.com', tel: '0834567891', role: 'Admin', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2025-01-10'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 1, updated_by: 13, deleted_by: 0 },
  { id: 14, first_name: 'Laura', last_name: 'Anderson', username: 'lauraa', email: 'laura.a@example.com', tel: '0845678902', role: 'Editor', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-05'), created_at: new Date('2025-02-01'), updated_at: new Date('2025-03-05'), deleted_at: null, created_by: 6, updated_by: 14, deleted_by: 0 },
  { id: 15, first_name: 'Michael', last_name: 'Davis', username: 'michaeld', email: 'michael.d@example.com', tel: '0856789013', role: 'Viewer', is_active: true, accepted_consent_id: 1, latest_login: new Date('2025-03-06'), created_at: new Date('2025-02-20'), updated_at: new Date('2025-03-06'), deleted_at: null, created_by: 1, updated_by: 15, deleted_by: 0 },
]

export const ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all' },
  { label: 'Admin', value: 'Admin' },
  { label: 'Editor', value: 'Editor' },
  { label: 'Viewer', value: 'Viewer' },
]

export const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

// ── CRM ──────────────────────────────────────────────────────────────

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

export const LEAD_SOURCE_OPTIONS: Select[] = [
  { label: 'Referral', value: 'Referral' },
  { label: 'Website', value: 'Website' },
  { label: 'Event', value: 'Event' },
  { label: 'Ads', value: 'Ads' },
  { label: 'Other', value: 'Other' },
]

export const LEAD_STATUS_OPTIONS: Select[] = [
  { label: 'All Status', value: 'all' },
  { label: 'New', value: 'New' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Qualified', value: 'Qualified' },
  { label: 'Disqualified', value: 'Disqualified' },
]

export const LEAD_STATUS_FORM_OPTIONS: Select[] = LEAD_STATUS_OPTIONS.filter(o => o.value !== 'all')

export const DEAL_STAGE_OPTIONS: Select[] = [
  { label: 'Lead', value: 'Lead' },
  { label: 'Qualified', value: 'Qualified' },
  { label: 'Proposal Sent', value: 'Proposal Sent' },
  { label: 'Negotiation', value: 'Negotiation' },
  { label: 'Won', value: 'Won' },
  { label: 'Lost', value: 'Lost' },
]

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

// ── Team members (lead/deal assignment) ─────────────────────────────

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: 1, name: 'Sirinya Boonmee', email: 'sirinya@igeargeek.com' },
  { id: 2, name: 'Kritsada Panya', email: 'kritsada@igeargeek.com' },
  { id: 3, name: 'Melissa Tran', email: 'melissa@igeargeek.com' },
  { id: 4, name: 'Anucha Srisawat', email: 'anucha@igeargeek.com' },
]

export const TEAM_MEMBER_OPTIONS: Select[] = MOCK_TEAM_MEMBERS.map(m => ({ label: m.name, value: String(m.id) }))

export const TEAM_MEMBER_FILTER_OPTIONS: Select[] = [
  { label: 'All Team Members', value: 'all' },
  { label: 'Unassigned', value: 'unassigned' },
  ...TEAM_MEMBER_OPTIONS,
]

export const teamMemberNameById = (id: number | null) => MOCK_TEAM_MEMBERS.find(m => m.id === id)?.name || 'Unassigned'

// Shared predicate for the "All / Unassigned / <member>" assignee filter used
// on both the leads and deals list pages.
export const matchesAssigneeFilter = (assignedTo: number | null, filter: string): boolean => {
  if (filter === 'all') return true
  if (filter === 'unassigned') return assignedTo === null
  return String(assignedTo) === filter
}

export const MOCK_COMPANIES: Company[] = [
  { id: 1, name: 'Acme Co.', industry: 'Technology', size: '51-200', website: 'https://acme.example.com', tags: ['Tier 1', 'Priority'], notes: 'Long-time client, strategic account.', status: 'active', created_at: new Date('2024-02-10'), updated_at: new Date('2025-06-01') },
  { id: 2, name: 'Globex Retail', industry: 'Retail', size: '201-500', website: 'https://globex.example.com', tags: ['Tier 2'], notes: '', status: 'active', created_at: new Date('2024-05-22'), updated_at: new Date('2025-05-14') },
  { id: 3, name: 'Initech Manufacturing', industry: 'Manufacturing', size: '11-50', website: 'https://initech.example.com', tags: [], notes: 'Interested in dashboard product.', status: 'active', created_at: new Date('2024-08-01'), updated_at: new Date('2025-01-11') },
  { id: 4, name: 'Umbrella Health', industry: 'Healthcare', size: '500+', website: 'https://umbrella.example.com', tags: ['Tier 1'], notes: '', status: 'archived', created_at: new Date('2023-11-19'), updated_at: new Date('2024-09-30') },
  { id: 5, name: 'Soylent Finance', industry: 'Finance', size: '51-200', website: 'https://soylent.example.com', tags: ['Tier 2', 'Priority'], notes: '', status: 'active', created_at: new Date('2025-01-05'), updated_at: new Date('2025-07-20') },
]

export const companyNameById = (companyId: number) => MOCK_COMPANIES.find(c => c.id === companyId)?.name || '-'

export const MOCK_CONTACTS: Contact[] = [
  { id: 1, company_id: 1, name: 'Somchai Prasert', email: 'somchai@acme.example.com', phone: '0812345678', role_title: 'CTO', tags: ['Decision Maker'], status: 'active', created_at: new Date('2024-02-12') },
  { id: 2, company_id: 1, name: 'Nattaya Wong', email: 'nattaya@acme.example.com', phone: '0823456789', role_title: 'Product Owner', tags: [], status: 'active', created_at: new Date('2024-03-01') },
  { id: 3, company_id: 2, name: 'David Chen', email: 'david@globex.example.com', phone: '0834567890', role_title: 'Ops Manager', tags: [], status: 'active', created_at: new Date('2024-05-25') },
  { id: 4, company_id: 3, name: 'Preecha Boon', email: 'preecha@initech.example.com', phone: '0845678901', role_title: 'Founder', tags: ['Decision Maker'], status: 'active', created_at: new Date('2024-08-03') },
  { id: 5, company_id: 4, name: 'Alice Wright', email: 'alice@umbrella.example.com', phone: '0856789012', role_title: 'IT Director', tags: [], status: 'inactive', created_at: new Date('2023-11-20') },
  { id: 6, company_id: 5, name: 'Kittipong Sae', email: 'kittipong@soylent.example.com', phone: '0867890123', role_title: 'Head of Finance', tags: ['Decision Maker'], status: 'active', created_at: new Date('2025-01-08') },
]

export const MOCK_LEADS: Lead[] = [
  { id: 1, name: 'Piti Sombat', company_name: 'NewCo Startup', email: 'piti@newco.example.com', phone: '0878901234', source: 'Website', status: 'New', notes: 'Submitted inquiry form asking about pricing.', assigned_to: 1, created_at: new Date('2025-07-28') },
  { id: 2, name: 'Ratchada Kul', company_name: 'BrightTech', email: 'ratchada@brighttech.example.com', phone: '0889012345', source: 'Event', status: 'Contacted', notes: 'Met at IGear conference, follow up scheduled.', assigned_to: 2, created_at: new Date('2025-07-20') },
  { id: 3, name: 'Suda Chai', company_name: 'Greenfield Group', email: 'suda@greenfield.example.com', phone: '0890123456', source: 'Referral', status: 'Qualified', notes: 'Referred by Acme Co.', assigned_to: null, created_at: new Date('2025-07-10') },
  { id: 4, name: 'Tom Baker', company_name: 'OldWorks Ltd', email: 'tom@oldworks.example.com', phone: '0801234567', source: 'Ads', status: 'Disqualified', notes: 'Budget too small for v1 scope.', assigned_to: 3, created_at: new Date('2025-06-30') },
]

export const MOCK_DEALS: Deal[] = [
  { id: 1, company_id: 1, contact_id: 1, title: 'Acme Co. — Ops Platform Rollout', value: 850000, stage: 'Negotiation', status: 'open', expected_close_date: new Date('2025-09-15'), assigned_to: 1, channel: 'Referral', business_unit: 'Project', business_unit_item: 'ops-platform-rollout', created_at: new Date('2025-05-01') },
  { id: 2, company_id: 2, contact_id: 3, title: 'Globex — POS Integration', value: 320000, stage: 'Proposal Sent', status: 'open', expected_close_date: new Date('2025-08-30'), assigned_to: 2, channel: 'Event', business_unit: 'Project', business_unit_item: 'pos-integration', created_at: new Date('2025-06-10') },
  { id: 3, company_id: 3, contact_id: 4, title: 'Initech — Dashboard MVP', value: 180000, stage: 'Qualified', status: 'open', expected_close_date: new Date('2025-09-01'), assigned_to: null, channel: 'Website', business_unit: 'Product', business_unit_item: 'dashboard-suite', created_at: new Date('2025-07-05') },
  { id: 4, company_id: 5, contact_id: 6, title: 'Soylent — Finance Reporting Suite', value: 540000, stage: 'Won', status: 'won', expected_close_date: new Date('2025-07-01'), assigned_to: 1, channel: 'Referral', business_unit: 'Product', business_unit_item: 'finance-reporting-suite', created_at: new Date('2025-04-15') },
  { id: 5, company_id: 4, contact_id: 5, title: 'Umbrella — Legacy Migration', value: 95000, stage: 'Lost', status: 'lost', expected_close_date: new Date('2025-05-01'), assigned_to: 3, channel: 'Ads', business_unit: 'Project', business_unit_item: 'legacy-migration', created_at: new Date('2025-03-01') },
  { id: 6, company_id: 1, contact_id: 2, title: 'Acme Co. — Mobile App Add-on', value: 210000, stage: 'Lead', status: 'open', expected_close_date: null, assigned_to: 4, channel: 'Website', business_unit: 'Product', business_unit_item: 'mobile-app', created_at: new Date('2025-07-25') },
]

// ── Duplicate detection (simple lead/deal dedup) ────────────────────

export const findDuplicateLeads = (leads: Lead[], email: string, phone: string, excludeId?: number): Lead[] => {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()
  if (!normalizedEmail && !normalizedPhone) return []

  return leads.filter((lead) => {
    if (lead.id === excludeId) return false
    const emailMatch = !!normalizedEmail && lead.email.trim().toLowerCase() === normalizedEmail
    const phoneMatch = !!normalizedPhone && lead.phone.trim() === normalizedPhone
    return emailMatch || phoneMatch
  })
}

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

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 1, type: 'call', subject: 'Discovery call', notes: 'Discussed scope for Ops Platform Rollout.', related_type: 'deal', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2025-05-05') },
  { id: 2, type: 'email', subject: 'Sent proposal draft', notes: 'Shared pricing options v1.', related_type: 'deal', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2025-06-01') },
  { id: 3, type: 'meeting', subject: 'Kickoff meeting', notes: 'Aligned on timeline with CTO.', related_type: 'company', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2025-06-15') },
  { id: 4, type: 'call', subject: 'Check-in call', notes: 'Confirmed budget approved.', related_type: 'contact', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2025-07-02') },
  { id: 5, type: 'email', subject: 'Contract signed confirmation', notes: 'Received signed contract for Finance Reporting Suite.', related_type: 'deal', related_id: 4, created_by: 'Sales Rep', created_at: new Date('2025-07-01') },
  { id: 6, type: 'call', subject: 'Quarterly check-in', notes: 'Reviewed usage and flagged interest in the mobile add-on.', related_type: 'company', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2026-07-25') },
]

// ── Customer engagement (upsell tracking) ───────────────────────────

export const companyActivities = (companyId: number): Activity[] => {
  const dealIds = MOCK_DEALS.filter(d => d.company_id === companyId).map(d => d.id)
  const contactIds = MOCK_CONTACTS.filter(c => c.company_id === companyId).map(c => c.id)

  return MOCK_ACTIVITIES.filter(a =>
    (a.related_type === 'company' && a.related_id === companyId)
    || (a.related_type === 'deal' && dealIds.includes(a.related_id))
    || (a.related_type === 'contact' && contactIds.includes(a.related_id)),
  )
}

export const lastContactDate = (companyId: number): Date | null => {
  const activities = companyActivities(companyId)
  if (activities.length === 0) return null
  return activities.reduce((latest, a) => (a.created_at > latest ? a.created_at : latest), activities[0].created_at)
}

export const MOCK_QUOTES: Quote[] = [
  { id: 1, deal_id: 1, items: [{ description: 'Platform license (annual)', qty: 1, price: 600000 }, { description: 'Implementation services', qty: 1, price: 250000 }], validity_date: new Date('2025-08-01'), status: 'sent' },
  { id: 2, deal_id: 2, items: [{ description: 'POS Integration package', qty: 1, price: 320000 }], validity_date: new Date('2025-08-15'), status: 'sent' },
  { id: 3, deal_id: 4, items: [{ description: 'Finance Reporting Suite', qty: 1, price: 540000 }], validity_date: new Date('2025-06-20'), status: 'accepted' },
]

export const TESTIMONIALS = [
  { name: 'Sarah Chen', company: 'TechCorp', quote: 'This platform has transformed how our team works. The intuitive interface and powerful features have boosted our productivity by 40%.', avatar: 'SC' },
  { name: 'James Wilson', company: 'StartupHub', quote: 'We switched from our old solution and never looked back. The support team is incredibly responsive and the product keeps getting better.', avatar: 'JW' },
  { name: 'Maria Garcia', company: 'DesignStudio', quote: 'As a designer, I appreciate the attention to detail. Everything is beautifully crafted and works exactly as expected.', avatar: 'MG' },
]
