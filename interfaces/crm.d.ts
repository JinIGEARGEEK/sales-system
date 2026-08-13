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
type TagCategory = 'Tier' | 'Industry' | 'Priority'
type TagStatus = 'active' | 'inactive'
type BusinessUnit = 'Project' | 'Product'

interface Company {
  id: number
  name: string
  industry: string
  size: string
  website: string
  tags: string[]
  notes: string
  status: ActiveArchivedStatus
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
