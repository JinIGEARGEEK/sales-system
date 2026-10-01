import { useI18n } from 'vue-i18n'

// The filters a payments-export form renders (deal_id/company_id come from
// the page, never typed).
export const PAYMENTS_EXPORT_FIELDS = ['date_from', 'date_to', 'method'] as const

// Only the filters actually set — no empty `date_from=` on the query.
export const paymentsExportQuery = (params: PaymentsExportParams): PaymentsExportParams =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')) as PaymentsExportParams

export const paymentsExportFilename = (params: PaymentsExportParams) => {
  const parts = ['payments']
  if (params.deal_id) parts.push(`deal-${params.deal_id}`)
  if (params.company_id) parts.push(`company-${params.company_id}`)
  if (params.date_from || params.date_to) parts.push(`${params.date_from ?? 'start'}_${params.date_to ?? 'today'}`)
  return `${parts.join('-')}.csv`
}

// Downloads GET /payments/export with the shared CSV helper. A date range
// that ends before it starts is caught here before the request; the API's 422
// (date_from/date_to/method) goes onto the form's inputs when `setErrors` is
// given and every field has an input, else one translated toast — never the
// API's English text. Resolves true once the file was downloaded.
export const usePaymentsExport = () => {
  const { t } = useI18n()
  const { error } = useNotify()
  const download = useDownloadCsvBlob()
  const showFieldErrors = useApiFieldErrors()

  return async (params: PaymentsExportParams, setErrors?: (errors: Record<string, string>) => void): Promise<boolean> => {
    const query = paymentsExportQuery(params)
    const invalidRange = t('crm.components.paymentsExportModal.invalidRange')
    if (query.date_from && query.date_to && query.date_to < query.date_from) {
      if (setErrors) setErrors({ date_to: invalidRange })
      else error(invalidRange)
      return false
    }
    return download('/payments/export', paymentsExportFilename(query), { ...query }, {
      onError: (err) => {
        const fields = getApiErrorFields(err)
        if (!fields) return false
        if (setErrors && showFieldErrors(err, setErrors, PAYMENTS_EXPORT_FIELDS, { messages: { date_to: invalidRange } })) return true
        error(fields.date_from || fields.date_to ? invalidRange : t('crm.components.paymentsExportModal.invalidFilters'))
        return true
      },
    })
  }
}
