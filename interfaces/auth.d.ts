interface User {
  first_name: string
  last_name: string
  tel: string
  email: string
  accepted_consent_id: number | null
  is_active: boolean
  latest_login: Date | null
  created_at: Date | null
  updated_at: Date | null
  deleted_at: Date | null
  created_by: number
  updated_by: number
  deleted_by: number
}