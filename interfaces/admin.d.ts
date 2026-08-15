interface AdminUser extends User {
  id: number
  role: 'Admin' | 'Sales Rep' | 'Sales Manager' | 'Production'
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
