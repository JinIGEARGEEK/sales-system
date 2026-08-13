import { MOCK_DEALS } from './deals'
import { MOCK_CONTACTS } from './contacts'

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 1, type: 'call', subject: 'Discovery call', notes: 'Discussed scope for Ops Platform Rollout.', related_type: 'deal', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2025-05-05') },
  { id: 2, type: 'email', subject: 'Sent proposal draft', notes: 'Shared pricing options v1.', related_type: 'deal', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2025-06-01') },
  { id: 3, type: 'meeting', subject: 'Kickoff meeting', notes: 'Aligned on timeline with CTO.', related_type: 'company', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2025-06-15') },
  { id: 4, type: 'call', subject: 'Check-in call', notes: 'Confirmed budget approved.', related_type: 'contact', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2025-07-02') },
  { id: 5, type: 'email', subject: 'Contract signed confirmation', notes: 'Received signed contract for Finance Reporting Suite.', related_type: 'deal', related_id: 4, created_by: 'Sales Rep', created_at: new Date('2025-07-01') },
  { id: 6, type: 'call', subject: 'Quarterly check-in', notes: 'Reviewed usage and flagged interest in the mobile add-on.', related_type: 'company', related_id: 1, created_by: 'Sales Rep', created_at: new Date('2026-07-25') },
]

// ── Customer engagement (upsell tracking) ───────────────────────────

export const companyActivities = (companyId: number): Activity[] => {
  const dealIds = MOCK_DEALS.filter(d => d.company_id === companyId).map(d => d.id)
  const contactIds = MOCK_CONTACTS.filter(c => c.company_id === companyId).map(c => c.id)

  return MOCK_ACTIVITIES.filter(a =>
    (a.related_type === 'company' && a.related_id === companyId)
    || (a.related_type === 'deal' && dealIds.includes(a.related_id))
    || (a.related_type === 'contact' && contactIds.includes(a.related_id)),
  )
}

export const lastContactDate = (companyId: number): Date | null => {
  const activities = companyActivities(companyId)
  if (activities.length === 0) return null
  return activities.reduce((latest, a) => (a.created_at > latest ? a.created_at : latest), activities[0].created_at)
}
