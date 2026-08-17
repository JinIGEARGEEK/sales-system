// Badge coloring for Quote status, including the read-derived "expired" value
// (computed server-side by Quote.EffectiveStatus, never user-settable via the
// create/edit status picker — see QUOTE_STATUS_OPTIONS). Kept separate from
// "rejected" so a Sales Rep can visually tell an actively-declined quote apart
// from one that simply timed out.
export const useQuoteStatusColor = () => {
  const quoteStatusBadgeColor = (status: QuoteStatus): 'neutral' | 'info' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'sent':
        return 'info'
      case 'accepted':
        return 'success'
      case 'rejected':
        return 'error'
      case 'expired':
        return 'warning'
      case 'draft':
      default:
        return 'neutral'
    }
  }

  return { quoteStatusBadgeColor }
}
