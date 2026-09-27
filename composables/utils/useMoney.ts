// Shared money primitives. Plain values/functions (no refs), placed under
// composables/utils so they're auto-imported like the other helpers.

// Thai VAT, as a percent. The Quote totals (useQuoteTotals, mirroring the
// API's ComputeQuoteTotals) and the WHT back-calculation (usePaymentTax) both
// read it from here.
export const VAT_PERCENT = 7

// Rounds a baht amount to whole satang (2 decimals), the precision every
// money figure is stored and compared at.
export const roundSatang = (value: number) => Math.round(value * 100) / 100
