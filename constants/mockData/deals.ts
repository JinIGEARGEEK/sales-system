// Per-stage colors for the Kanban board — used by CrmPipelineBoard as the
// fallback color for any of the hardcoded/seeded stage names below.
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

// Mirrors the backend's StageDefaultProbability (internal/models/deal.go) —
// prefills Deal.probability per-stage, always manually overridable.
const STAGE_DEFAULT_PROBABILITY: Record<DealStage, number> = {
  Lead: 10,
  Qualified: 30,
  'Proposal Sent': 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
}

export const stageDefaultProbability = (stage: string): number => STAGE_DEFAULT_PROBABILITY[stage as DealStage] ?? 10

export const LOST_REASON_OPTIONS: Select[] = [
  { label: 'Price', value: 'price' },
  { label: 'Timing', value: 'timing' },
  { label: 'Competitor', value: 'competitor' },
  { label: 'No Budget', value: 'no_budget' },
  { label: 'Other', value: 'other' },
]

// ── Business units (deal filtering on the dashboard) ──

export const BUSINESS_UNIT_OPTIONS: Select[] = [
  { label: 'Project', value: 'Project' },
  { label: 'Product', value: 'Product' },
]

export const BUSINESS_UNIT_FILTER_OPTIONS: Select[] = [
  { label: 'All Business Units', value: 'all' },
  ...BUSINESS_UNIT_OPTIONS,
]

// ── Duplicate detection (simple deal dedup) ─────────────────────────

export const findDuplicateDeals = (deals: Deal[], companyId: string | number | null, contactId: string, excludeId?: number): Deal[] => {
  if (!companyId) return []

  return deals.filter((deal) => {
    if (deal.id === excludeId) return false
    if (deal.status !== 'open') return false
    const companyMatch = String(deal.company_id) === String(companyId)
    const contactMatch = !contactId || String(deal.contact_id) === contactId
    return companyMatch && contactMatch
  })
}
