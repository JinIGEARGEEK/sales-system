// GET /reports/top-referrers — one row per referrer (an existing Company or
// Contact, per Lead.referred_by_type/referred_by_id, FR-CRM-119), how many
// Leads they referred, how many became Deals, how many of those were Won,
// and total Won revenue (FR-CRM-121).
interface TopReferrerRow {
  referrer_type: 'company' | 'contact'
  referrer_id: number
  referrer_name: string
  leads_referred: number
  deals_created: number
  deals_won: number
  won_revenue: number
}

// GET /reports/lead-source-conversion — one row per Lead source.
interface LeadSourceConversionRow {
  source: LeadSource
  total: number
  qualified: number
  conversion_rate: number
}

// GET /reports/prospect-source-conversion — Marketing's own funnel report,
// one row per Prospect source. "Converted" mirrors LeadSourceConversionRow's
// "qualified": Prospect.Status === 'Converted', set only by
// POST /prospects/:id/convert.
interface ProspectSourceConversionRow {
  source: string
  total: number
  converted: number
  conversion_rate: number
}

// GET /dashboard/prospect-summary — Marketing's own dashboard tab (added
// 2026-09-03, FR-CRM-107). source_breakdown reuses ProspectSourceConversionRow
// exactly (backend computes both from the same fetchProspectSourceConversion).
interface ProspectDashboardSummary {
  total_prospects: number
  open_prospects: number
  converted_count: number
  conversion_rate: number
  status_breakdown: { status: string, count: number }[]
  source_breakdown: ProspectSourceConversionRow[]
}

// GET /dashboard/lead-summary — Sales tab's own Lead stats widget.
// source_breakdown reuses LeadSourceConversionRow exactly (backend computes
// both from the same fetchLeadSourceConversion used by
// GET /reports/lead-source-conversion), so any Lead Source configured in
// Admin > Lead Sources (e.g. "Marketing") shows up here automatically once
// leads use it.
interface LeadDashboardSummary {
  total_leads: number
  new_leads: number
  qualified_leads: number
  disqualified_leads: number
  status_breakdown: { status: string, count: number }[]
  source_breakdown: LeadSourceConversionRow[]
}

// GET /reports/customers-by-product-status — one row per Company/Product link.
interface CustomerByProductStatusRow {
  company_id: number
  company_name: string
  product_id: number
  status: CustomerProductStatus
  start_date: string
}

// GET /reports/win-loss-reasons — one row per outcome. `reason` is either
// "won" (every Won deal collapses into this one bucket) or a LostReason
// value (FR-CRM-093).
interface WinLossReasonRow {
  reason: LostReason | 'won'
  count: number
  value: number
}

// GET /reports/stalled-deals — open Deals with no logged Activity for at
// least `min_days` (FR-CRM-094). last_activity_at falls back to the Deal's
// created_at when it has no Activity at all.
interface StalledDealRow {
  deal_id: number
  title: string
  company_name: string
  stage: DealStage
  value: number
  assigned_to: number | null
  last_activity_at: Date
  days_stalled: number
}

// GET /reports/outstanding-balance — Won Deals whose Payments sum to less
// than the Deal's value (FR-CRM-095). Not date-bucketed aging — Payment has
// no due_date field, only paid_at (when actually received).
interface OutstandingBalanceRow {
  deal_id: number
  deal_title: string
  company_name: string
  deal_value: number
  paid_amount: number
  outstanding_amount: number
  // "overdue"/"upcoming" when the Deal has a PaymentInstallment schedule
  // defined, "none" otherwise (today's pre-schedule behavior, unchanged).
  aging: 'overdue' | 'upcoming' | 'none'
}

// GET /reports/quotes-expiring-soon — Sent quotes whose validity_date falls
// within the next `within_days` (FR-CRM-096).
interface QuoteExpiringSoonRow {
  quote_id: number
  deal_id: number
  deal_title: string
  company_name: string
  validity_date: string
  total_value: number
}

// GET /reports/contracts-stuck — Draft/Sent contracts unsigned for at least
// `min_days` (FR-CRM-097).
interface ContractStuckRow {
  contract_id: number
  deal_id: number
  deal_title: string
  company_name: string
  status: ContractStatus
  assigned_to: number | null
  days_in_status: number
}

// GET /reports/projects-at-risk — Projects past target_end_date that
// aren't Completed or Cancelled (FR-CRM-098).
interface ProjectAtRiskRow {
  project_id: number
  name: string
  company_id: number
  company_name: string
  status: ProjectStatus
  target_end_date: string
  days_overdue: number
}

// GET /reports/sales-cycle — average time-in-stage and total sales-cycle
// length, broken out by pipeline stage / Sales Rep / Lead source (FR-CRM-099,
// extending FR-CRM-057's single running average). `key` is the stage name,
// the Sales Rep's user id (as a string), or the Lead source name depending on
// which bucket array it's in — this endpoint returns all three breakdowns of
// the same underlying stage-transition data, not three separate reports.
interface SalesCycleBucketRow {
  key: string
  avg_days: number
  count: number
}

interface SalesCycleReport {
  by_stage: SalesCycleBucketRow[]
  by_rep: SalesCycleBucketRow[]
  by_source: SalesCycleBucketRow[]
  avg_sales_cycle_days: number
  closed_deal_count: number
}

// GET /notification-log — recent NotificationRule firings, in-app (FR-CRM-100/
// 101/102's previously email-only notifications). Scoped server-side per
// viewer (a Sales Rep only sees firings for Deals they own).
interface NotificationFiring {
  id: number
  rule_name: string
  entity_type: NotificationEntityType
  // deal_id/deal_title are present for 'deal'/'quote'/'contract' firings;
  // prospect_id/prospect_name for 'prospect' firings (added 2026-09-03,
  // FR-CRM-107); company_id/company_name for 'company' firings (added
  // 2026-09-04, FR-CRM-108) — additive fields, not a rename, so existing
  // Deal/Quote/Contract consumers (the dashboard's Recent Alerts widget)
  // are untouched.
  deal_id?: number
  deal_title?: string
  prospect_id?: number
  prospect_name?: string
  company_id?: number
  company_name?: string
  notified_at: Date
}

// GET /pipeline/overview (FR-CRM-123) — the Overview Pipeline page's whole
// payload: a period summary strip plus Prospect/Lead/Deal lanes. Open lanes
// hold every current record; terminal lanes (kind won/lost/converted) hold
// only records that entered them inside the selected period. `count`/`value`
// are exact; `cards` is capped at the request's card_limit.
type PipelineOverviewZoneKey = 'prospect' | 'lead' | 'deal'
// 'other' (only when non-empty, name "") holds records whose stage isn't one
// of the zone's lanes — blank, or a stage an Admin deactivated/renamed.
type PipelineOverviewLaneKind = 'open' | 'won' | 'lost' | 'converted' | 'other'

interface PipelineOverviewCard {
  id: number
  name: string
  company_id: number | null
  company_name: string
  assigned_to: number | null
  source: string
  value: number
  probability: number | null
  lost_reason: string | null
  from_prospect: boolean
  stage_entered_at: string | null
  created_at: string
  // The record's own stage/status value ("" if blank) — what an 'other'
  // lane card shows, since that lane's name doesn't say.
  stage: string
}

interface PipelineOverviewLane {
  name: string
  kind: PipelineOverviewLaneKind
  terminal: boolean
  count: number
  value: number
  cards: PipelineOverviewCard[]
}

interface PipelineOverviewZone {
  key: PipelineOverviewZoneKey
  lanes: PipelineOverviewLane[]
}

interface PipelineOverviewCompare {
  current: number
  previous: number
}

interface PipelineOverview {
  period: { date_from: string, date_to: string, prev_date_from: string, prev_date_to: string }
  summary: {
    new_prospects: PipelineOverviewCompare
    new_leads: PipelineOverviewCompare
    new_deals: PipelineOverviewCompare
    won: PipelineOverviewCompare & { value: number, previous_value: number }
    open_pipeline: { count: number, value: number, weighted_value: number }
  }
  zones: PipelineOverviewZone[]
}

interface PipelineOverviewParams {
  date_from?: string
  date_to?: string
  assigned_to?: string
  source?: string
  business_unit?: string
  tag?: string
  search?: string
  card_limit?: number
}

// The card a viewer clicked on the Overview Pipeline board, with the lane and
// zone it sits in (frontend-only).
interface PipelineOverviewSelection {
  zone: PipelineOverviewZoneKey
  lane: PipelineOverviewLane
  card: PipelineOverviewCard
}
