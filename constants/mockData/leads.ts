export const LEAD_SOURCE_OPTIONS: Select[] = [
  { label: 'Referral', value: 'Referral' },
  { label: 'Website', value: 'Website' },
  { label: 'Event', value: 'Event' },
  { label: 'Ads', value: 'Ads' },
  { label: 'Other', value: 'Other' },
]

export const LEAD_STATUS_OPTIONS: Select[] = [
  { label: 'All Status', value: 'all' },
  { label: 'New', value: 'New' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Qualified', value: 'Qualified' },
  { label: 'Disqualified', value: 'Disqualified' },
]

export const LEAD_STATUS_FORM_OPTIONS: Select[] = LEAD_STATUS_OPTIONS.filter(o => o.value !== 'all')

// ── Duplicate detection (simple lead dedup) ─────────────────────────

export const findDuplicateLeads = (leads: Lead[], email: string, phone: string, excludeId?: number): Lead[] => {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()
  if (!normalizedEmail && !normalizedPhone) return []

  return leads.filter((lead) => {
    if (lead.id === excludeId) return false
    const emailMatch = !!normalizedEmail && lead.email.trim().toLowerCase() === normalizedEmail
    const phoneMatch = !!normalizedPhone && lead.phone.trim() === normalizedPhone
    return emailMatch || phoneMatch
  })
}
