// Withholding-tax helpers for the Deal's Payments tab — plain functions (no
// refs), unit-tested apart from CrmAddPaymentModal.

// Thai WHT is charged on the pre-VAT amount, while the rep records the cash
// that actually arrived. With a pre-VAT base B, the customer pays
// B × (1 + VAT) − B × WHT, so B = net ÷ (1 + VAT − WHT) and the WHT is
// B × WHT. At 7% VAT and 3% WHT that's net × 3 / 104.
export const whtFromNetReceived = (net: number, whtRate = 3, vatRate = VAT_PERCENT): number => {
  if (!Number.isFinite(net) || net <= 0 || whtRate <= 0) return 0
  const divisor = 100 + vatRate - whtRate
  if (divisor <= 0) return 0
  return roundSatang(net * whtRate / divisor)
}

// WHT was deducted but the 50 ทวิ certificate hasn't arrived yet.
export const isWhtCertificatePending = (payment: Pick<Payment, 'wht_amount' | 'wht_certificate_received'>) =>
  payment.wht_amount > 0 && !payment.wht_certificate_received

// 1-based installment numbers in due-date order — the API's list is already
// ordered that way, and its Task titles ("— installment 2") count the same.
export const installmentNumbers = (statuses: PaymentInstallmentStatus[]): Map<number, number> =>
  new Map(statuses.map((s, index) => [s.installment.id, index + 1]))
