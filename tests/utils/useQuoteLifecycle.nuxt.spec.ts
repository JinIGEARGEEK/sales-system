import { describe, it, expect } from 'vitest'
import { apiError } from '../factories'

const t = (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key)

describe('useQuoteLifecycle', () => {
  it('offers only the status moves the API allows, the current one first', () => {
    expect(allowedQuoteStatuses('draft')).toEqual(['draft', 'sent', 'accepted', 'rejected'])
    expect(allowedQuoteStatuses('sent')).toEqual(['sent', 'draft', 'accepted', 'rejected'])
    expect(allowedQuoteStatuses('accepted')).toEqual(['accepted', 'rejected'])
    expect(allowedQuoteStatuses('rejected')).toEqual(['rejected'])
  })

  it('treats an expired quote as the Sent it is stored as, minus Accepted', () => {
    expect(storedQuoteStatus('expired')).toBe('sent')
    expect(allowedQuoteStatuses('expired')).toEqual(['sent', 'draft', 'rejected'])
  })

  it('locks Accepted and Rejected quotes only', () => {
    expect(isQuoteLocked('accepted')).toBe(true)
    expect(isQuoteLocked('rejected')).toBe(true)
    expect(isQuoteLocked('draft')).toBe(false)
    expect(isQuoteLocked('sent')).toBe(false)
    expect(isQuoteLocked('expired')).toBe(false)
  })

  it('maps a 422\'s item keys onto the item editor inputs, which are named by row key', () => {
    const map = quoteItemFieldMap([{ key: 11 }, { key: 4 }])

    expect(map['items[0].qty']).toBe('item-qty-11')
    expect(map['items[1].price']).toBe('item-price-4')
    expect(map['items[1].discount_percent']).toBe('item-discount-4')
    expect(quoteFormFieldNames([{ key: 4 }])).toEqual(expect.arrayContaining(['discount_total', 'wht_rate', 'issue_date', 'validity_date', 'item-qty-4']))
  })

  it('reads each quote 409 into its translated message', () => {
    const conflict = (message: string) => describeQuoteConflict(apiError(409, { code: 'CONFLICT', message }), t)

    expect(conflict('quote QT2026100003 is already accepted on this deal; reject it before accepting another'))
      .toEqual({ message: 'crm.quotes.conflict.otherAccepted {"number":"QT2026100003"}', reload: false })
    expect(conflict('this quote has expired and can\'t be accepted; move it back to draft with a new validity_date, or duplicate it'))
      .toEqual({ message: 'crm.quotes.conflict.expired', reload: false })
    expect(conflict('this quote was changed to accepted meanwhile; reload it and try again'))
      .toEqual({ message: 'crm.quotes.conflict.changedMeanwhile', reload: true })
    expect(conflict('an accepted quote is read-only (notes can\'t change); duplicate it to revise'))
      .toEqual({ message: 'crm.quotes.conflict.readOnly', reload: true })
    expect(conflict('a sent quote can\'t be deleted; only drafts can'))
      .toEqual({ message: 'crm.quotes.conflict.deleteNonDraft', reload: true })
    expect(conflict('a rejected quote can\'t be changed to draft'))
      .toEqual({ message: 'crm.quotes.conflict.transition', reload: true })
  })

  it('ignores anything that isn\'t a 409', () => {
    expect(describeQuoteConflict(apiError(422, { fields: { discount_total: ['must be between 0 and the subtotal (100.00)'] } }), t)).toBeNull()
    expect(describeQuoteConflict(new Error('network'), t)).toBeNull()
  })
})
