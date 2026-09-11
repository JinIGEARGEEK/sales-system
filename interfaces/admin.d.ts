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
