export const PROSPECT_STATUS_OPTIONS: Select[] = [
  { label: 'All Status', value: 'all' },
  { label: 'New', value: 'New' },
  { label: 'Engaging', value: 'Engaging' },
  { label: 'Nurturing', value: 'Nurturing' },
  { label: 'Disqualified', value: 'Disqualified' },
]

export const PROSPECT_STATUS_FORM_OPTIONS: Select[] = PROSPECT_STATUS_OPTIONS.filter(o => o.value !== 'all')

// Per-status colors for the Prospect Kanban board (components/Crm/PipelineBoard.vue)
// — mirrors DEAL_STAGE_COLORS' role for Deal stages. 'Converted' isn't a
// droppable column (see pages/crm/prospects/index.vue), but still needs a
// color in case a converted Prospect briefly renders before its card is
// removed from the board.
export const PROSPECT_STATUS_COLORS: Record<ProspectStatus, string> = {
  New: '#5B5FE9',
  Engaging: '#4A9FE8',
  Nurturing: '#F5A623',
  Disqualified: '#E2445C',
  Converted: '#00C875',
}

export const prospectStatusColor = (status: ProspectStatus) => {
  if (status === 'Converted') return 'success'
  if (status === 'Disqualified') return 'error'
  if (status === 'Engaging') return 'info'
  return 'neutral'
}

// ── Duplicate detection (mirrors findDuplicateLeads) ─────────────────────

export const findDuplicateProspects = (prospects: Prospect[], email: string, phone: string, excludeId?: number): Prospect[] => {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()
  if (!normalizedEmail && !normalizedPhone) return []

  return prospects.filter((prospect) => {
    if (prospect.id === excludeId) return false
    const emailMatch = !!normalizedEmail && prospect.email.trim().toLowerCase() === normalizedEmail
    const phoneMatch = !!normalizedPhone && prospect.phone.trim() === normalizedPhone
    return emailMatch || phoneMatch
  })
}
