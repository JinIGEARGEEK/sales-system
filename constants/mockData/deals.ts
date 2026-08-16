// Labels are the display text shown to users; `value` stays 'Proposal Sent' since
// that's the DealStage the backend API and stored deals actually use — renaming the
// label doesn't touch the underlying stage identifier.
export const DEAL_STAGE_OPTIONS: Select[] = [
  { label: 'Lead', value: 'Lead' },
  { label: 'Qualified', value: 'Qualified' },
  { label: 'Proposition', value: 'Proposal Sent' },
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

export const BUSINESS_UNIT_OPTIONS: Select[] = [
  { label: 'Project', value: 'Project' },
  { label: 'Product', value: 'Product' },
]

export const BUSINESS_UNIT_FILTER_OPTIONS: Select[] = [
  { label: 'All Business Units', value: 'all' },
  ...BUSINESS_UNIT_OPTIONS,
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
