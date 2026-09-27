import { describe, it, expect } from 'vitest'
import { makeQuote } from '../factories'

describe('dealReceivable', () => {
  it('is the deal value when there is no Accepted Quote', () => {
    const quotes = [makeQuote({ status: 'sent', items: [{ description: 'x', qty: 1, price: 999 }] })]
    expect(dealReceivable(quotes, 5000)).toEqual({ amount: 5000, fromQuote: false })
  })

  it('is the latest Accepted Quote\'s taxable amount + VAT, before WHT', () => {
    const older = makeQuote({ id: 1, status: 'accepted', items: [{ description: 'x', qty: 1, price: 1000 }] })
    // 2 × 1,000 − 500 discount = 1,500 taxable, + 7% VAT = 1,605; WHT ignored.
    const latest = makeQuote({ id: 2, status: 'accepted', items: [{ description: 'x', qty: 2, price: 1000 }], discount_total: 500, vat_enabled: true, wht_enabled: true, wht_rate: 3 })
    expect(dealReceivable([latest, older].reverse(), 5000)).toEqual({ amount: 1605, fromQuote: true })
  })

  it('rounds to satang', () => {
    const quote = makeQuote({ status: 'accepted', items: [{ description: 'x', qty: 1, price: 333.333 }], vat_enabled: true })
    expect(dealReceivable([quote], 0).amount).toBe(356.67)
  })

  it('falls back to the deal value when the Accepted Quote has no priced content', () => {
    // An uploaded quote whose extraction failed: no items, or items priced at 0.
    expect(dealReceivable([makeQuote({ status: 'accepted', items: [] })], 5000)).toEqual({ amount: 5000, fromQuote: false })
    expect(dealReceivable([makeQuote({ status: 'accepted', items: [{ description: 'x', qty: 1, price: 0 }] })], 5000)).toEqual({ amount: 5000, fromQuote: false })
  })
})

describe('roundSatang', () => {
  it('rounds to 2 decimals', () => {
    expect(roundSatang(1.005 + 0.001)).toBe(1.01)
    expect(roundSatang(0.1 + 0.2)).toBe(0.3)
    expect(roundSatang(1234.5678)).toBe(1234.57)
  })
})
