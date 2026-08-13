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

export const MOCK_LEADS: Lead[] = [
  { id: 1, name: 'Piti Sombat', company_name: 'NewCo Startup', email: 'piti@newco.example.com', phone: '0878901234', source: 'Website', status: 'New', notes: 'Submitted inquiry form asking about pricing.', assigned_to: 1, created_at: new Date('2025-07-28') },
  { id: 2, name: 'Ratchada Kul', company_name: 'BrightTech', email: 'ratchada@brighttech.example.com', phone: '0889012345', source: 'Event', status: 'Contacted', notes: 'Met at IGear conference, follow up scheduled.', assigned_to: 2, created_at: new Date('2025-07-20') },
  { id: 3, name: 'Suda Chai', company_name: 'Greenfield Group', email: 'suda@greenfield.example.com', phone: '0890123456', source: 'Referral', status: 'Qualified', notes: 'Referred by Acme Co.', assigned_to: null, created_at: new Date('2025-07-10') },
  { id: 4, name: 'Tom Baker', company_name: 'OldWorks Ltd', email: 'tom@oldworks.example.com', phone: '0801234567', source: 'Ads', status: 'Disqualified', notes: 'Budget too small for v1 scope.', assigned_to: 3, created_at: new Date('2025-06-30') },
]

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
