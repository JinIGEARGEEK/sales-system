// Withholding-tax helpers for the Deal's Payments tab — plain functions (no
// refs), unit-tested apart from CrmAddPaymentModal.

// Thai WHT on services is most often 3% — the "Fill WHT" default when the
// Deal has no Accepted Quote saying otherwise.
export const DEFAULT_WHT_PERCENT = 3

// Thai WHT is charged on the pre-VAT amount, while the rep records the cash
// that actually arrived. With a pre-VAT base B, the customer pays
// B × (1 + VAT) − B × WHT, so B = net ÷ (1 + VAT − WHT) and the WHT is
// B × WHT. At 7% VAT and 3% WHT that's net × 3 / 104.
export const whtFromNetReceived = (net: number, whtRate = DEFAULT_WHT_PERCENT, vatRate = VAT_PERCENT): number => {
  if (!Number.isFinite(net) || net <= 0 || whtRate <= 0) return 0
  const divisor = 100 + vatRate - whtRate
  if (divisor <= 0) return 0
  return roundSatang(net * whtRate / divisor)
}

export interface PaymentTaxRates {
  whtRate: number
  vatRate: number
}

// The rates "Fill WHT" backs out of a payment: the Deal's latest Accepted
// Quote's WHT rate (when it has WHT on) and VAT (0 when it has VAT off), so
// a 5% or a no-VAT deal isn't filled as 3% at 7% VAT. Without an Accepted
// Quote — or one with WHT off — the WHT rate falls back to 3%, and VAT to 7%.
export const paymentTaxRates = (quotes: Pick<Quote, 'id' | 'status' | 'vat_enabled' | 'wht_enabled' | 'wht_rate'>[]): PaymentTaxRates => {
  const accepted = latestAcceptedQuote(quotes)
  if (!accepted) return { whtRate: DEFAULT_WHT_PERCENT, vatRate: VAT_PERCENT }
  return {
    whtRate: accepted.wht_enabled && accepted.wht_rate > 0 ? accepted.wht_rate : DEFAULT_WHT_PERCENT,
    vatRate: accepted.vat_enabled ? VAT_PERCENT : 0,
  }
}

// WHT was deducted but the 50 ทวิ certificate hasn't arrived yet.
export const isWhtCertificatePending = (payment: Pick<Payment, 'wht_amount' | 'wht_certificate_received'>) =>
  payment.wht_amount > 0 && !payment.wht_certificate_received

// 1-based installment numbers in due-date order — the API's list is already
// ordered that way, and its Task titles ("— installment 2") count the same.
export const installmentNumbers = (statuses: PaymentInstallmentStatus[]): Map<number, number> =>
  new Map(statuses.map((s, index) => [s.installment.id, index + 1]))
