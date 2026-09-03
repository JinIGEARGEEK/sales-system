// Shared by Company and Contact — both are simply active or archived.
type ActiveArchivedStatus = 'active' | 'archived'
type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Disqualified'
// Lead Scoring (FR-CRM-006/007) — server-computed from LeadScoringCriterion rows
// against the Lead's own fields; 'none' means the score is below the configured
// lead_scoring_mql_threshold (AppSettings.lead_scoring_mql_threshold), 'sql' is
// reserved for a Lead that has already converted to a Deal.
type LeadClassification = 'none' | 'mql' | 'sql'
// The closed set of Lead fields a scoring criterion can match against —
// mirrors the backend's LeadScoringCriterion.Field validation.
type LeadScoringCriterionField = 'source' | 'has_company_name' | 'has_phone'
// Workflow Notification Rules (FR-CRM-100/101/102) — the closed set of record
// types a rule can watch, and who gets notified when it fires. Mirrors the
// backend's NotificationRule.EntityType/RecipientRole validation.
type NotificationEntityType = 'deal' | 'quote' | 'contract'
type NotificationRecipientRole = 'owner' | 'owner_and_managers'
// Shared by Lead.source and Deal.channel — both describe the same acquisition channel.
type LeadSource = 'Referral' | 'Website' | 'Event' | 'Ads' | 'Other'
type DealStage = 'Lead' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost'
type DealStatus = 'open' | 'won' | 'lost'
type ActivityType = 'call' | 'email' | 'meeting'
// 'prospect' added 2026-09-01 for Marketing's pre-Lead funnel (§3.1a) — Task
// shares this same union (TaskRelatedType below), so Prospects get a Tasks
// tab for free via the existing polymorphic infra.
type ActivityRelatedType = 'contact' | 'company' | 'deal' | 'prospect'
// A fixed enum, not admin-configurable (mirrors LeadStatus, not the
// admin-configurable PipelineStage) — Marketing's funnel stage is a simple
// closed set. 'Converted' is set only by POST /prospects/:id/convert, never
// chosen directly in the create/edit form.
type ProspectStatus = 'New' | 'Engaging' | 'Nurturing' | 'Disqualified' | 'Converted'
// 'expired' is a read-derived value computed server-side (Quote.EffectiveStatus)
// for display/filtering only — never a value the create/edit status picker sets.
type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
type ContractStatus = 'draft' | 'sent' | 'signed' | 'expired'
type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other'
type TaskStatus = 'pending' | 'done'
// Plain triage label, no workflow behavior attached (unlike TaskStatus).
type TaskPriority = 'low' | 'medium' | 'high'
// Shared by Task.related_type and Activity.related_type — both point at whichever
// record (deal, contact, or company) the follow-up/activity is attached to.
type TaskRelatedType = ActivityRelatedType
type TagCategory = 'Tier' | 'Industry' | 'Priority'
type TagStatus = 'active' | 'inactive'
type LostReason = 'price' | 'timing' | 'competitor' | 'no_budget' | 'other'
type BusinessUnit = 'Project' | 'Product'
type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled'
type CustomerProductStatus = 'Interested' | 'Trial' | 'Active' | 'Churned'
type AttachmentCategory = 'Quotation' | 'Proposal' | 'Estimation' | 'Plan' | 'Support' | 'Other'
// Deliberately broader than ActivityRelatedType (which excludes Lead) — attachments
// are useful before a Lead ever converts to a Deal. 'quote' added 2026-08-23 for the
// Quote editor's attachments section (quotation-builder rebuild) — reuses this same
// generic model, no dedicated Quote-attachments infrastructure.
// 'prospect' added 2026-09-01 — carried over to 'lead' by
// POST /prospects/:id/convert, same as 'lead' is carried to 'deal'.
type AttachmentRelatedType = 'lead' | 'deal' | 'company' | 'project' | 'quote' | 'prospect'
// Added 2026-08-23 (quotation-builder rebuild) — 'excl_tax' is the default; a labeling/
// expectation field only, doesn't change how VAT is computed (see useQuoteTotals).
type QuotePriceType = 'excl_tax' | 'incl_tax'

interface Company {
  id: number
  name: string
  industry: string
  size: string
  revenue_size: string
  website: string
  tags: string[]
  notes: string
  status: ActiveArchivedStatus
  // Registered-party details used on Contract PDF exports — optional since most
  // Companies predate this field and a Contract can still render without them.
  legal_name?: string | null
  address?: string | null
  tax_id?: string | null
  // Present only on trash-listing responses (GET /companies/trash) — absent (undefined) elsewhere.
  deleted_at?: Date | null
  created_at: Date
  updated_at: Date
}

interface Contact {
  id: number
  company_id: number
  name: string
  email: string
  phone: string
  role_title: string
  tags: string[]
  status: ActiveArchivedStatus
  // Present only on trash-listing responses (GET /contacts/trash) — absent (undefined) elsewhere.
  deleted_at?: Date | null
  created_at: Date
}

interface TeamMember {
  id: number
  name: string
  email: string
}

interface Lead {
  id: number
  name: string
  // Replaced free-text company_name 2026-08-24 — a real Company FK, same as
  // Deal.company_id/Contact.company_id. Nullable (unlike Deal/Contact): a
  // Lead can still exist with no company picked, matching company_name's
  // old optional-ness. Set via InputCompanySelect on the create/edit pages —
  // picking an existing Company links to it directly; typing a new name
  // creates a real Company (POST /companies) and links to that instead of
  // ever staying a free-text stand-in.
  company_id: number | null
  email: string
  phone: string
  source: LeadSource
  status: LeadStatus
  notes: string
  assigned_to: number | null
  tags?: string[] | null
  // Set once this Lead has been converted into a Deal (see Deal.lead_id) — null until then.
  converted_deal_id: number | null
  // Server-computed Lead Scoring (FR-CRM-006/007) — sum of matching
  // LeadScoringCriterion weights, and the resulting MQL/SQL bucket against
  // AppSettings.lead_scoring_mql_threshold.
  score: number
  classification: LeadClassification
  // Set when this Lead originated from a Marketing Prospect via
  // POST /prospects/:id/convert — null for a Lead created directly. Mirrors
  // Deal.lead_id's back-reference to its own originating record.
  prospect_id?: number | null
  // Mirrors Deal's own business_unit/business_unit_item — a lightweight tag
  // of which Project or Product this Lead is interested in, not a real FK.
  // Carried over to the Deal on conversion (deals/create.vue pre-fills from
  // it), same as channel/source already are.
  business_unit: BusinessUnit | null
  business_unit_item: string | null
  // Present only on trash-listing responses (GET /leads/trash) — absent (undefined) elsewhere.
  deleted_at?: Date | null
  created_at: Date
}

// The pre-Lead marketing funnel entity (§3.1a) — Marketing works a Prospect,
// with an optional linked Company (same nullable-FK shape as Lead.company_id),
// before it's ready to hand off to Sales via Convert. Endpoint/field shape
// deliberately mirrors Lead one funnel stage earlier.
interface Prospect {
  id: number
  name: string
  company_id: number | null
  email: string
  phone: string
  // A plain string, not LeadSource — Prospect's source list
  // (ProspectSourceOption, /admin/prospect-sources) is deliberately separate
  // from Lead/Deal's (LeadSourceOption): Marketing's actual channels (Social
  // Media, LINE OA, Email Campaign, ...) don't overlap well with Sales's
  // lead-capture sources. Added 2026-09-01.
  source: string
  status: ProspectStatus
  notes: string
  assigned_to: number | null
  tags?: string[] | null
  // Set once this Prospect has been converted into a Lead — null until then.
  converted_lead_id: number | null
  // Mirrors Deal's own business_unit/business_unit_item — a lightweight tag
  // of which Project or Product this Prospect is interested in, not a real
  // FK. Carried over to the Lead automatically on conversion (server-side).
  business_unit: BusinessUnit | null
  business_unit_item: string | null
  // Present only on trash-listing responses (GET /prospects/trash) — absent (undefined) elsewhere.
  deleted_at?: Date | null
  created_at: Date
}

interface Deal {
  id: number
  company_id: number
  contact_id: number
  title: string
  value: number
  stage: DealStage
  status: DealStatus
  expected_close_date: Date | null
  assigned_to: number | null
  channel: LeadSource
  business_unit: BusinessUnit | null
  business_unit_item: string | null
  tags?: string[] | null
  // Set when this Deal was auto-created by converting a Lead — null for Deals created directly.
  lead_id: number | null
  // 0-100 win-probability, defaulted server-side per-stage but manually overridable.
  probability: number | null
  // Required (server-validated) only while stage/status is Lost; cleared once it moves elsewhere.
  lost_reason: LostReason | null
  // Present only on trash-listing responses (GET /deals/trash) — absent (undefined) elsewhere.
  deleted_at?: Date | null
  created_at: Date
}

// An Admin-configurable pipeline stage — GET/POST/PATCH/DELETE /admin/pipeline-stages.
// Replaces the previously hardcoded DealStage enum as the source of truth for what
// stages exist; DealStage itself stays a plain string so existing Deal rows keep working.
interface PipelineStage {
  id: number
  name: string
  sort_order: number
  is_active: boolean
  is_won_stage: boolean
  is_lost_stage: boolean
  created_at: Date
}

// An Admin-configurable lead/deal source — GET/POST/PATCH/DELETE /admin/lead-sources.
// Replaces the previously hardcoded LeadSource enum shared by Lead.source/Deal.channel.
interface LeadSourceOption {
  id: number
  name: string
  is_active: boolean
  created_at: Date
}

// An Admin-configurable Prospect (marketing funnel) source — GET/POST/PATCH/
// DELETE /admin/prospect-sources. Deliberately separate from LeadSourceOption
// above — see Prospect.source's own comment for why.
interface ProspectSourceOption {
  id: number
  name: string
  is_active: boolean
  created_at: Date
}

// An Admin-configurable Company industry option — GET/POST/PATCH/DELETE
// /admin/industries. Replaces the previously hardcoded INDUSTRY_OPTIONS
// constant as the source of truth for what industries exist.
interface IndustryOption {
  id: number
  name: string
  is_active: boolean
  created_at: Date
}

// An Admin-configurable Company size option — GET/POST/PATCH/DELETE
// /admin/company-sizes. Replaces the previously free-text Company.size field.
interface CompanySizeOption {
  id: number
  name: string
  is_active: boolean
  created_at: Date
}

// An Admin-configurable Company revenue size option — GET/POST/PATCH/DELETE
// /admin/revenue-sizes. Replaces the previously free-text Company.revenue_size field.
interface RevenueSizeOption {
  id: number
  name: string
  is_active: boolean
  created_at: Date
}

// An Admin-configurable Contact job title/role option — GET/POST/PATCH/DELETE
// /admin/job-titles. Replaces the previously free-text Contact.role_title field.
interface JobTitleOption {
  id: number
  name: string
  is_active: boolean
  created_at: Date
}

// An Admin-configurable Product category option — GET/POST/PATCH/DELETE
// /admin/product-categories. Replaces the previously free-text Product.category field.
interface ProductCategoryOption {
  id: number
  name: string
  is_active: boolean
  created_at: Date
}

// An Admin-configurable lead-scoring rule — GET/POST/PATCH/DELETE
// /admin/lead-scoring-criteria (FR-CRM-006/007). Each active criterion whose
// `field` matches a Lead (against `match_value`, where applicable) adds
// `weight` to that Lead's score server-side; the resulting total is bucketed
// into Lead.classification against AppSettings.lead_scoring_mql_threshold.
interface LeadScoringCriterion {
  id: number
  name: string
  field: LeadScoringCriterionField
  // Only meaningful when field === 'source' (matched against Lead.source);
  // ignored server-side for the boolean-shaped fields (has_company_name/has_phone).
  match_value: string
  weight: number
  is_active: boolean
  created_at: Date
}

// An Admin-configurable workflow notification rule — GET/POST/PATCH/DELETE
// /admin/notification-rules (FR-CRM-100/101/102). Each active rule watches one
// entity_type for a stale/at-risk condition (an open Deal sitting in its stage,
// a Sent Quote nearing its validity date, or a Draft/Sent Contract left unsigned)
// for threshold_days, and notifies either just the Deal owner or the owner plus
// all active Sales Managers.
interface NotificationRule {
  id: number
  name: string
  entity_type: NotificationEntityType
  threshold_days: number
  recipient_role: NotificationRecipientRole
  is_active: boolean
  created_at: Date
}

// The Admin-configurable app-wide settings singleton — GET/PATCH /admin/settings.
// Holds the quarterly sales quota (FR-CRM-058) and the annual revenue goal
// (FR-CRM-091), both previously hardcoded in the dashboard summary handler.
interface AppSettings {
  id: number
  quarterly_sales_target: number
  annual_revenue_goal: number
  // MQL threshold for Lead Scoring (FR-CRM-006/007) — a Lead's computed
  // `score` at or above this value is classified 'mql' rather than 'none'.
  lead_scoring_mql_threshold: number
  // FR-CRM-045 — "configurable, not hard-enforced by default" (so this
  // defaults false). Once true, the backend blocks a Deal from moving into
  // Won unless it already has at least one Contract with status Signed.
  require_signed_contract_before_won: boolean
  // Neither figure resets itself on a new quarter/year — this is surfaced in
  // the Admin config UI as a "last updated" hint so a stale value (e.g. last
  // year's annual goal still sitting there in February) doesn't go unnoticed.
  updated_at: Date
}

// An Admin-configurable target for one specific (year, quarter) period —
// GET/POST/PATCH/DELETE /admin/sales-targets, FR-CRM-092. Overrides
// AppSettings.quarterly_sales_target/4 for its period in the dashboard's
// pipeline_coverage_ratio calc; a period with no row here just falls back to
// that flat quarterly figure, so this is purely additive on top of it.
interface SalesTarget {
  id: number
  year: number
  // Plain number, not a 1|2|3|4 literal union: the backend sends/accepts a
  // bare int with no compile-time narrowing, and the literal union caused a
  // real typecheck failure at the one call site that actually constructs
  // this shape from a form payload (pages/admin/pipeline-config.vue's
  // onSubmitTarget) — TS can't narrow a plain `number` down to the literal
  // union without an explicit assertion. Runtime validity (1-4) is enforced
  // server-side (internal/handlers/sales_targets.go's salesTargetForm.validate).
  quarter: number
  target_value: number
  created_at: Date
  updated_at: Date
}

interface Activity {
  id: number
  type: ActivityType
  subject: string
  notes: string
  related_type: ActivityRelatedType
  related_id: number
  created_by: string
  created_at: Date
}

interface Tag {
  id: number
  name: string
  category: TagCategory
  description: string
  status: TagStatus
  created_at: Date
}

// Editable-row shape used by components/Crm/QuoteItemsEditor.vue and the
// Quote create/edit pages — a superset of QuoteItem with the UI-only `key`
// (stable v-for identity) and `kind` (explicit scope-vs-product toggle,
// never sent to the backend — product_id already implies it on submit).
interface QuoteItemRow {
  key: number
  description: string
  qty: number
  price: number
  product_id: string | null
  kind: 'scope' | 'product'
  discount_percent: number
}

interface QuoteItem {
  description: string
  qty: number
  price: number
  // Optional link to the Product catalog. When set, the backend snapshots
  // that Product's current name/price into description/price at save
  // time (not a live reference) — later Product edits never retroactively
  // change a saved quote's line item. Left unset, the item is pure free
  // text, exactly as before this field existed.
  product_id?: number | null
  // 0-100, reduces this item's own line total — independent of Quote's own
  // discount_total below. Added 2026-08-23 (quotation-builder rebuild).
  discount_percent?: number
}

interface Quote {
  id: number
  deal_id: number
  items: QuoteItem[]
  // Generated document number (e.g. "QT2026080004"), assigned once at create
  // time — never user-edited. Quotes created before this field existed have
  // no number. Added 2026-08-23.
  number?: string
  // Free-text narrative for the overall engagement (deliverables/phases/terms)
  // — separate from each line item's own short description. Optional; shows
  // as a wrapped paragraph above the line-items table in the exported PDF.
  scope_of_work: string
  validity_date: Date | null
  status: QuoteStatus
  // Set when the quotation is an uploaded PDF (e.g. exported from FlowAccount)
  // rather than entered line-by-line — `items` stays empty for these.
  file_name?: string
  file_url?: string
  file_size?: number
  uploaded_at?: Date
  // All added 2026-08-23 (quotation-builder rebuild) — see useQuoteTotals for
  // how they combine into the totals block, mirroring the backend's
  // utils.ComputeQuoteTotals so the two never disagree.
  reference_number?: string | null
  issue_date: Date | null
  credit_days: number
  price_type: QuotePriceType
  vat_enabled: boolean
  wht_enabled: boolean
  wht_rate: number
  discount_total: number
  notes?: string | null
  internal_notes?: string | null
  // Set only on Quotes created via the PDF-upload flow (never on manually
  // created ones) — the outcome of best-effort field extraction from a
  // FlowAccount export (see api-system-spec.md §7.4's Upload row). 'ok': every
  // field extraction looked for was found and self-consistent. 'partial':
  // some fields were pre-filled, extraction_warnings lists what's missing or
  // suspect (e.g. a recomputed total that doesn't match the PDF's printed
  // one) — worth a second look before Sending. 'failed': the file is still
  // attached but didn't look like a FlowAccount export, so nothing was
  // pre-filled. Added 2026-08-23.
  extraction_status?: 'ok' | 'partial' | 'failed' | null
  extraction_warnings?: string[] | null
}

// A Contract attached to a Deal — optionally linked to the Quote it prices from
// (quote_id), tracked through draft/sent/signed/expired, with a signed-document
// upload replacing e-signature (api-system-spec.md §8.1).
interface Contract {
  id: number
  deal_id: number
  quote_id: number | null
  status: ContractStatus
  signed_file_url: string | null
  signed_date: Date | null
  created_at: Date
}

// The company's fixed product catalog (api-system-spec.md §8.2).
interface Product {
  id: number
  name: string
  category: string
  description: string
  price: number
  is_active: boolean
}

// Links a Company to a Product it's interested in/using. GET /companies/:id/products
// is the only way the frontend lists these, and it always merges the Product in —
// there's no bare CustomerProduct-without-product response to model separately.
interface CustomerProduct {
  id: number
  company_id: number
  product_id: number
  status: CustomerProductStatus
  start_date: Date
  end_date: Date | null
  source_deal_id: number | null
  product: Product
}

// A summary record only — no sub-resources for tasks/sprints/milestones (api-system-spec.md §8.3).
interface Project {
  id: number
  company_id: number
  deal_id: number | null
  name: string
  status: ProjectStatus
  start_date: Date
  target_end_date: Date | null
  // Planning estimates set by Sales before work is confirmed — distinct from
  // start_date (record-creation time, not a schedule) and target_end_date
  // (the deadline the projects-at-risk report checks against). Both
  // nullable: unknown until estimated.
  expected_proposal_date: Date | null
  expected_start_date: Date | null
  production_reference: string | null
  notes: string
  // Only present on rows from GET /projects (the cross-company list) — the
  // per-company GET /companies/:id/projects doesn't merge this in since the
  // company is already known from context.
  company_name?: string
}

// A single installment paid against a Deal. A Deal's `value` is the total contract
// value — revenue actually collected is the sum of its Payments, which can span
// multiple partial payments over the life of a project or product sale.
interface Payment {
  id: number
  deal_id: number
  amount: number
  paid_at: Date
  method: PaymentMethod
  note: string
}

// A follow-up/reminder attached to a Deal, Contact, or Company — e.g. "call back
// Thursday" or "send renewal quote". Kept separate from Activity: Activity is a log
// of things already done, Task is a to-do with a due date that hasn't happened yet.
interface Task {
  id: number
  related_type: TaskRelatedType
  related_id: number
  title: string
  description: string
  due_date: Date
  status: TaskStatus
  priority: TaskPriority
  assigned_to: number | null
  created_at: Date
}

// A file or external link attached to a Lead/Deal/Company/Project — quotations,
// proposals, estimations, plans, etc. Distinct from Quote's own PDF export and
// Contract.signed_file_url, which stay purpose-specific (api-system-spec.md §8.6).
// Exactly one of file_url/external_url is set.
interface Attachment {
  id: number
  related_type: AttachmentRelatedType
  related_id: number
  category: AttachmentCategory
  file_name: string
  file_url: string | null
  external_url: string | null
  file_size: number | null
  mime_type: string | null
  uploaded_by: number
  created_at: Date
}

// GET /dashboard/summary — api-system-spec.md §9.
interface DashboardSummary {
  open_pipeline_value: number
  won_value: number
  win_rate: number
  open_deals_count: number
  forecasted_revenue: number
  avg_deal_size: number
  avg_sales_cycle_days: number
  pipeline_coverage_ratio: number
  quarterly_sales_target: number
  // Company-wide annual revenue goal (FR-CRM-091), Admin-configurable via
  // AppSettings above — annual_revenue_actual is Won Deal value since Jan 1
  // of the current calendar year, ignoring the dashboard's own filter bar
  // (same convention as revenue_trend/forecast_trend below).
  annual_revenue_goal: number
  annual_revenue_actual: number
  annual_revenue_progress_ratio: number
  // Cumulative Won value by month, Jan through the current month, alongside
  // a straight-line goal_pace (annual_revenue_goal × months-elapsed/12) for
  // the same point — lets the dashboard chart whether the company is ahead
  // of or behind pace over the year, not just infer it from today's ratio.
  annual_revenue_trend: { label: string, actual: number, goal_pace: number }[]
  revenue_trend: { label: string, value: number }[]
  // Forward-looking counterpart to revenue_trend: probability-weighted value of
  // open deals bucketed by ExpectedCloseDate month (next 6 months). Deals with no
  // expected_close_date are excluded from every point, so these points may sum to
  // less than forecasted_revenue above — don't present this as the full forecast.
  forecast_trend: { label: string, value: number }[]
  stage_breakdown: { stage: DealStage, value: number, count: number }[]
  industry_breakdown: { industry: string, win_rate: number, won_count: number }[]
  team_performance: { user_id: number, name: string, won_count: number, won_value: number, win_rate: number }[]
  upsell_opportunities: unknown[]
}
