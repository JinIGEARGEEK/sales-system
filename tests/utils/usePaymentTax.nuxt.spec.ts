import { describe, it, expect } from 'vitest'
import { makeQuote } from '../factories'

describe('whtFromNetReceived', () => {
  it('backs 3% WHT out of the cash received at 7% VAT (net × 3 / 104)', () => {
    // Pre-VAT base 100,000 → invoice 107,000, WHT 3,000, cash 104,000.
    expect(whtFromNetReceived(104000)).toBe(3000)
  })

  it('rounds to 2 decimals', () => {
    expect(whtFromNetReceived(1000)).toBe(28.85)
  })

  it('supports no VAT and other rates', () => {
    // No VAT: base 1,000, WHT 30, cash 970.
    expect(whtFromNetReceived(970, 3, 0)).toBe(30)
    // 5% WHT at 7% VAT: base 1,000 → cash 1,020, WHT 50.
    expect(whtFromNetReceived(1020, 5, 7)).toBe(50)
  })

  it('returns 0 for a blank or non-positive amount', () => {
    expect(whtFromNetReceived(0)).toBe(0)
    expect(whtFromNetReceived(-5)).toBe(0)
    expect(whtFromNetReceived(Number.NaN)).toBe(0)
  })
})

describe('paymentTaxRates', () => {
  it('falls back to 3% WHT at 7% VAT without an Accepted Quote', () => {
    expect(paymentTaxRates([])).toEqual({ whtRate: 3, vatRate: 7 })
    expect(paymentTaxRates([makeQuote({ status: 'sent', wht_enabled: true, wht_rate: 5 })])).toEqual({ whtRate: 3, vatRate: 7 })
  })

  it('uses the latest Accepted Quote\'s WHT rate, and 0 VAT when it has VAT off', () => {
    const older = makeQuote({ id: 1, status: 'accepted', vat_enabled: true, wht_enabled: true, wht_rate: 1 })
    const latest = makeQuote({ id: 2, status: 'accepted', vat_enabled: false, wht_enabled: true, wht_rate: 5 })
    expect(paymentTaxRates([latest, older].reverse())).toEqual({ whtRate: 5, vatRate: 0 })
  })

  it('keeps the 3% default WHT when the Accepted Quote has WHT off', () => {
    expect(paymentTaxRates([makeQuote({ status: 'accepted', vat_enabled: true, wht_enabled: false, wht_rate: 0 })])).toEqual({ whtRate: 3, vatRate: 7 })
  })

  it('feeds whtFromNetReceived: 5% WHT, no VAT', () => {
    const { whtRate, vatRate } = paymentTaxRates([makeQuote({ status: 'accepted', vat_enabled: false, wht_enabled: true, wht_rate: 5 })])
    // Base 1,000, no VAT, 5% WHT -> cash 950.
    expect(whtFromNetReceived(950, whtRate, vatRate)).toBe(50)
  })
})

describe('isWhtCertificatePending', () => {
  it('is true only with WHT deducted and no certificate yet', () => {
    expect(isWhtCertificatePending({ wht_amount: 30, wht_certificate_received: false })).toBe(true)
    expect(isWhtCertificatePending({ wht_amount: 30, wht_certificate_received: true })).toBe(false)
    expect(isWhtCertificatePending({ wht_amount: 0, wht_certificate_received: false })).toBe(false)
  })
})

describe('installmentNumbers', () => {
  it('numbers installments 1..n in the order the API returns them (due date)', () => {
    const status = (id: number): PaymentInstallmentStatus => ({
      installment: { id, deal_id: 1, amount: 100, due_date: new Date(), note: '' },
      covered: 0,
      status: 'upcoming',
    })
    const numbers = installmentNumbers([status(7), status(3), status(9)])
    expect(numbers.get(7)).toBe(1)
    expect(numbers.get(3)).toBe(2)
    expect(numbers.get(9)).toBe(3)
  })
})
