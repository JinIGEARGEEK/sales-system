// 'Marketing' added 2026-09-01 for the pre-Lead Prospect funnel (§3.1a) —
// owns /prospects* alongside Admin/Sales Manager oversight, no access to
// Leads/Deals/Quotes/Contracts/Payments.
type Role = 'Admin' | 'Sales Rep' | 'Sales Manager' | 'Production' | 'Marketing'

interface User {
  id: number
  first_name: string
  last_name: string
  tel: string
  email: string
  notes: string
  accepted_consent_id: number | null
  is_active: boolean
  must_change_password: boolean
  role: Role
  latest_login: Date | null
  created_at: Date | null
  updated_at: Date | null
  deleted_at: Date | null
  created_by: number
  updated_by: number
  deleted_by: number
}