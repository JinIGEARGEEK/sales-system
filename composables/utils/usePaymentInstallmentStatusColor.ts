// Badge coloring for a payment installment's derived status (the API's
// waterfall: paid / partial / overdue / upcoming).
const INSTALLMENT_STATUS_COLOR: Partial<Record<PaymentInstallmentStatusValue, BadgeColor>> = {
  paid: 'success',
  partial: 'warning',
  overdue: 'error',
}

export const usePaymentInstallmentStatusColor = () => ({
  installmentStatusColor: (status: PaymentInstallmentStatusValue) => badgeColorFromMap(status, INSTALLMENT_STATUS_COLOR),
})
