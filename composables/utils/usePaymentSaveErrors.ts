import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'

// Reads a failed POST /deals/:dealId/payments or PUT /payments/:id onto
// CrmAddPaymentModal's form:
//   - 422 amount ["exceeds_receivable"]: cash + WHT would pass what the
//     customer owes — shown on Amount, and `overpaymentPending` turns Save
//     into "Record anyway", which resends with allow_overpayment: true;
//   - 422 paid_at: a date after today;
//   - 422 deal_id: the Deal is Lost (no input for it, so a toast);
//   - 409: the document_number is already on another payment;
//   - any other 422 field the form renders, translated generically.
// `report(err)` returns true when it showed the error, so the caller skips
// its own toast. Editing the amount or WHT clears the overpayment state
// (call `reset()` when the dialog opens).
export type PaymentErrorReporter = (err: unknown) => boolean

export const PAYMENT_FORM_FIELDS = ['amount', 'paid_at', 'wht_amount', 'method', 'document_number', 'installment_id', 'note']

export const usePaymentSaveErrors = (setErrors: () => ((errors: Record<string, string>) => void) | undefined) => {
  const { t, te } = useI18n()
  const { error } = useNotify()
  const overpaymentPending = ref(false)

  const report: PaymentErrorReporter = (err) => {
    const set = setErrors()
    if (isAxiosError(err) && err.response?.status === 409) {
      if (!set) return false
      set({ document_number: t('crm.components.addPaymentModal.errors.documentNumberTaken') })
      return true
    }
    const fields = getApiErrorFields(err)
    if (!fields) return false
    if (fields.deal_id) {
      error(t('crm.components.addPaymentModal.errors.lostDeal'))
      return true
    }
    if (fields.amount?.includes('exceeds_receivable')) overpaymentPending.value = true
    if (!set) return overpaymentPending.value
    return applyFormApiFieldErrors(err, set, t, te, {
      fields: PAYMENT_FORM_FIELDS,
      messages: { paid_at: t('crm.components.addPaymentModal.errors.paidAtFuture') },
    }) || overpaymentPending.value
  }

  // The payload as it should be sent: with allow_overpayment once the user
  // has seen the warning and chose "Record anyway".
  const withOverpayment = <P extends PaymentPayload>(payload: P): P =>
    (overpaymentPending.value ? { ...payload, allow_overpayment: true } : payload)

  const reset = () => {
    overpaymentPending.value = false
  }

  return { overpaymentPending, report, withOverpayment, reset }
}
