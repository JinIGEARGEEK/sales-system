// Badge coloring and display labels for Quote status, including the
// read-derived "expired" value (computed server-side by Quote.EffectiveStatus,
// never user-settable via the create/edit status picker — so it has a label
// but isn't in QUOTE_SELECTABLE_STATUSES). Kept separate from "rejected" so a
// Sales Rep can visually tell an actively-declined quote apart from one that
// simply timed out.
const QUOTE_STATUS_COLOR: Partial<Record<QuoteStatus, BadgeColor>> = {
  sent: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
}

// The statuses a user can pick in a status select (create/edit form, the
// Deal's Quotes tab inline select). 'expired' is derived, not picked.
const QUOTE_SELECTABLE_STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected']

export const useQuoteStatusColor = () => {
  const quoteStatusBadgeColor = (status: QuoteStatus) => badgeColorFromMap(status, QUOTE_STATUS_COLOR)
  const quoteStatusLabel = (status: QuoteStatus) => statusLabelFromGroup('quote', status)
  const quoteStatusOptions = computed<Select[]>(() =>
    QUOTE_SELECTABLE_STATUSES.map(value => ({ value, label: quoteStatusLabel(value) })))
  // Only the moves the API allows from `status` (allowedQuoteStatuses),
  // the current one first — for an existing quote's status select.
  const quoteStatusOptionsFor = (status: QuoteStatus): Select[] =>
    allowedQuoteStatuses(status).map(value => ({ value, label: quoteStatusLabel(value) }))

  return { quoteStatusBadgeColor, quoteStatusLabel, quoteStatusOptions, quoteStatusOptionsFor }
}
