// Badge coloring for Quote status, including the read-derived "expired" value
// (computed server-side by Quote.EffectiveStatus, never user-settable via the
// create/edit status picker — see QUOTE_STATUS_OPTIONS). Kept separate from
// "rejected" so a Sales Rep can visually tell an actively-declined quote apart
// from one that simply timed out.
const QUOTE_STATUS_COLOR: Partial<Record<QuoteStatus, BadgeColor>> = {
  sent: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
}

export const useQuoteStatusColor = () => {
  const quoteStatusBadgeColor = (status: QuoteStatus) => badgeColorFromMap(status, QUOTE_STATUS_COLOR)

  return { quoteStatusBadgeColor }
}
