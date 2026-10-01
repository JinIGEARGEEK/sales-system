import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'

// The API's quote lifecycle (models.CanTransitionQuoteStatus, Review round
// 2): which stored status may move to which. Rejected is terminal — to
// offer something new, duplicate it. Anything else is a 409.
type StoredQuoteStatus = Exclude<QuoteStatus, 'expired'>
export const QUOTE_STATUS_TRANSITIONS: Record<StoredQuoteStatus, StoredQuoteStatus[]> = {
  draft: ['sent', 'accepted', 'rejected'],
  sent: ['draft', 'accepted', 'rejected'],
  accepted: ['rejected'],
  rejected: [],
}

// 'expired' is read-derived (a Sent quote past its validity date); the row
// itself is still 'sent'.
export const storedQuoteStatus = (status: QuoteStatus): StoredQuoteStatus => (status === 'expired' ? 'sent' : status)

// An Accepted or Rejected quote is read-only apart from its allowed status
// moves: a PUT that changes any other field is a 409.
export const isQuoteLocked = (status: QuoteStatus) => status === 'accepted' || status === 'rejected'

// The statuses a quote whose (effective) status is `status` may be set to,
// its own first. An expired quote can't be accepted (move it back to Draft
// with a new validity date, or duplicate it).
export const allowedQuoteStatuses = (status: QuoteStatus): StoredQuoteStatus[] => {
  const from = storedQuoteStatus(status)
  const next = QUOTE_STATUS_TRANSITIONS[from].filter(to => !(status === 'expired' && to === 'accepted'))
  return [from, ...next]
}

// Where a quote 422's item keys (`items[0].qty`, …) show on CrmQuoteItemsEditor,
// whose inputs are named by row key rather than index.
export const quoteItemFieldMap = (items: { key: number }[]): Record<string, string> => Object.fromEntries(items.flatMap((item, index) => [
  [`items[${index}].qty`, `item-qty-${item.key}`],
  [`items[${index}].price`, `item-price-${item.key}`],
  [`items[${index}].discount_percent`, `item-discount-${item.key}`],
]))

// The editor's own inputs that a 422 can name directly.
export const QUOTE_FORM_FIELDS = ['status', 'reference_number', 'issue_date', 'credit_days', 'validity_date', 'price_type', 'scope_of_work', 'discount_total', 'wht_rate', 'notes', 'internal_notes']

// Every rendered field name for these item rows plus QUOTE_FORM_FIELDS.
export const quoteFormFieldNames = (items: { key: number }[]) => [...QUOTE_FORM_FIELDS, ...Object.values(quoteItemFieldMap(items))]

export interface QuoteConflict {
  message: string
  // The saved quote differs from what's on screen — offer a Reload.
  reload: boolean
}

// Reads a quote 409 (the API sends the generic CONFLICT code, so the
// message says which rule it was) into translated copy. null when `err`
// isn't a 409.
export const describeQuoteConflict = (err: unknown, t: (key: string, params?: Record<string, unknown>) => string): QuoteConflict | null => {
  if (!isAxiosError(err) || err.response?.status !== 409) return null
  const message = getApiErrorMessage(err, '')
  const otherAccepted = /quote (\S+) is already accepted/i.exec(message)
  if (otherAccepted) return { message: t('crm.quotes.conflict.otherAccepted', { number: otherAccepted[1] }), reload: false }
  if (/expired/i.test(message)) return { message: t('crm.quotes.conflict.expired'), reload: false }
  if (/can't be deleted|only draft/i.test(message)) return { message: t('crm.quotes.conflict.deleteNonDraft'), reload: true }
  if (/read-only/i.test(message)) return { message: t('crm.quotes.conflict.readOnly'), reload: true }
  if (/can't be changed to/i.test(message)) return { message: t('crm.quotes.conflict.transition'), reload: true }
  return { message: t('crm.quotes.conflict.changedMeanwhile'), reload: true }
}

// Toasts a quote save/delete failure: a 409 in translated words (with a
// Reload action when `reload` is given and the saved copy differs), anything
// else as the API's message.
export const useQuoteErrorNotifier = () => {
  const { t } = useI18n()
  const { error } = useNotify()

  return (err: unknown, reload?: () => unknown) => {
    const conflict = describeQuoteConflict(err, t)
    if (!conflict) {
      error(getApiErrorMessage(err, t('global.genericError')))
      return
    }
    error(conflict.message, conflict.reload && reload ? { label: t('crm.quotes.conflict.reload'), onClick: () => { reload() } } : undefined)
  }
}
