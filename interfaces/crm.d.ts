// Shared by Company and Contact — both are simply active or archived.
type ActiveArchivedStatus = 'active' | 'archived'
type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Disqualified'
// Shared by Lead.source and Deal.channel — both describe the same acquisition channel.
type LeadSource = 'Referral' | 'Website' | 'Event' | 'Ads' | 'Other'
type DealStage = 'Lead' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost'
type DealStatus = 'open' | 'won' | 'lost'
type ActivityType = 'call' | 'email' | 'meeting'
type ActivityRelatedType = 'contact' | 'company' | 'deal'
type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
type ContractStatus = 'draft' | 'sent' | 'signed' | 'expired'
type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other'
type TaskStatus = 'pending' | 'done'
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
// are useful before a Lead ever converts to a Deal.
type AttachmentRelatedType = 'lead' | 'deal' | 'company' | 'project'

interface Company {
  id: number
  name: string
  industry: string
  size: string
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
  company_name: string
  email: string
  phone: string
  source: LeadSource
  status: LeadStatus
  notes: string
  assigned_to: number | null
  tags?: string[] | null
  // Set once this Lead has been converted into a Deal (see Deal.lead_id) — null until then.
  converted_deal_id: number | null
  // Present only on trash-listing responses (GET /leads/trash) — absent (undefined) elsewhere.
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

interface QuoteItem {
  description: string
  qty: number
  price: number
}

interface Quote {
  id: number
  deal_id: number
  items: QuoteItem[]
  validity_date: Date | null
  status: QuoteStatus
  // Set when the quotation is an uploaded PDF (e.g. exported from FlowAccount)
  // rather than entered line-by-line — `items` stays empty for these.
  file_name?: string
  file_url?: string
  file_size?: number
  uploaded_at?: Date
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
  due_date: Date
  status: TaskStatus
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
  revenue_trend: { label: string, value: number }[]
  stage_breakdown: { stage: DealStage, value: number, count: number }[]
  industry_breakdown: { industry: string, win_rate: number, won_count: number }[]
  team_performance: { user_id: number, name: string, won_count: number, won_value: number, win_rate: number }[]
  upsell_opportunities: unknown[]
}
