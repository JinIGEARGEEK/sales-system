// A small but complete GET /pipeline/overview payload covering every lane
// kind: open, won/lost/converted (terminal), and the "other" catch-all.
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString()

const card = (id: number, name: string, over: Record<string, unknown> = {}) => ({
  id, name, company_id: null, company_name: 'Acme Corp', assigned_to: null, source: 'Website',
  value: 0, probability: null, lost_reason: null, from_prospect: false,
  stage_entered_at: iso(3), created_at: iso(40), stage: '', previous_stage: '', direction: '', ...over,
})

const lane = (name: string, kind: string, cards: ReturnType<typeof card>[], staleDays = 14, value = 0) => ({
  name, kind, terminal: !['open', 'other'].includes(kind), stale_days: kind === 'open' || kind === 'other' ? staleDays : 0,
  count: cards.length, value, cards,
})

export const overviewFixture = () => ({
  period: { date_from: '2026-07-01', date_to: '2026-09-24', prev_date_from: '2026-04-07', prev_date_to: '2026-06-30' },
  summary: {
    new_prospects: { current: 7, previous: 3 },
    new_leads: { current: 5, previous: 5 },
    new_deals: { current: 4, previous: 6 },
    won: { current: 1, previous: 0, value: 480000, previous_value: 0 },
    open_pipeline: { count: 2, value: 2900000, weighted_value: 1200000 },
    conversion: {
      prospect_to_lead: { cohort: 7, converted: 2 },
      lead_to_deal: { cohort: 5, converted: 1 },
      deal_to_won: { cohort: 4, converted: 1 },
    },
  },
  // Deliberately larger than the cards returned, like a busy pipeline.
  highlight: { stale: 42, moved: 3, slipped: 1, stale_deals: 17, stale_deal_value: 5300000 },
  zones: [
    { key: 'prospect', lanes: [
      lane('New', 'open', [card(1, 'Fresh Prospect', { stage: 'New' })]),
      lane('Converted', 'converted', []),
      lane('', 'other', [card(2, 'Blank Status Prospect', { stage: '' })]),
    ] },
    { key: 'lead', lanes: [
      lane('New', 'open', [card(11, 'New Lead', { stage: 'New' })]),
      lane('Converted', 'converted', [card(12, 'Converted Lead', { stage: 'Converted', stage_entered_at: iso(1) })]),
    ] },
    { key: 'deal', lanes: [
      lane('Qualified', 'open', [card(21, 'Slipping Deal', { stage: 'Qualified', value: 900000, previous_stage: 'Negotiation', direction: 'backward', stage_entered_at: iso(2) })], 14, 900000),
      lane('Negotiation', 'open', [card(22, 'Advancing Deal', { stage: 'Negotiation', value: 2000000, previous_stage: 'Qualified', direction: 'forward', stage_entered_at: iso(2) })], 30, 2000000),
      lane('Won', 'won', []),
      lane('Lost', 'lost', []),
    ] },
  ],
})
