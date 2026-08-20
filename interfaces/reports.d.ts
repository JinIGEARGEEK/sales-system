// GET /reports/lead-source-conversion — one row per Lead source.
interface LeadSourceConversionRow {
  source: LeadSource
  total: number
  qualified: number
  conversion_rate: number
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
