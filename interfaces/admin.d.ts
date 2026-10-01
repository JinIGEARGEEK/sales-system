interface AdminUser extends User {
  id: number
}

// GET/POST /admin/api-keys, POST /admin/api-keys/:id/revoke — credentials
// for the /open/* external-integration route group (backend's
// middleware.RequireAPIKey). Admin-only. The raw secret is never persisted
// or returned again after creation — only key_prefix (enough to tell keys
// apart in this list) is stored.
interface APIKey {
  id: number
  name: string
  key_prefix: string
  owner_user_id: number
  is_active: boolean
  last_used_at: Date | null
  created_by?: number | null
  revoked_at?: Date | null
  revoked_by?: number | null
  created_at: Date
}

// GET /audit-log — api-system-spec.md, admin-only, read-only (NFR-007).
interface AuditLogEntry {
  id: number
  entity_type: string
  entity_id: number
  action: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  actor_id: number
  created_at: Date
}

// Deactivating a user (PUT /users/:id status inactive,
// PATCH /users/bulk-deactivate), deleting one, or moving one to Production
// reports the open pipeline records they still own (`open_records`) and,
// when `reassign_to` was sent, what moved (`reassigned`). "Open" = Deals with
// status open, Leads/Prospects not converted or disqualified, pending Tasks.
interface OpenRecordCounts {
  deals: number
  leads: number
  prospects: number
  tasks: number
  total: number
}

interface ReassignedRecords extends OpenRecordCounts {
  user_id: number
  reassign_to: number
}

interface UserOpenRecords extends OpenRecordCounts {
  user_id: number
}

// PUT /users/:id — the user plus the two fields above, present only when the
// update took the user's records away (deactivation / move to Production).
interface AdminUserWriteResult {
  user: AdminUser
  open_records: OpenRecordCounts | null
  reassigned: ReassignedRecords | null
}

// DELETE /users/:id — 200 { id, open_records, reassigned? }.
interface UserDeleteResult {
  id: number
  open_records: OpenRecordCounts
  reassigned?: ReassignedRecords | null
}

// PATCH /users/bulk-deactivate — 200 { open_records: [...], reassigned: [...] }.
// bulk-activate answers 204.
interface UserBulkDeactivateResult {
  open_records: UserOpenRecords[]
  reassigned: ReassignedRecords[]
}
