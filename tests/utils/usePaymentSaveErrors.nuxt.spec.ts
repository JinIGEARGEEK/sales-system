import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiResponse, apiError } from '../factories'

// Echo i18n keys back for the composable's own messages. The field-code
// text comes from useApiFieldErrors, which reads the real $i18n table. The
// real useToast stays intact.
vi.mock('vue-i18n', async importOriginal => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key, te: (key: string) => key === 'global.apiFieldError.exceeds_receivable' }),
}))

const basePayload = (): PaymentPayload => ({
  amount: 60000,
  paid_at: new Date('2026-09-30T10:00:00'),
  method: 'transfer',
  note: '',
  wht_amount: 0,
  wht_certificate_received: false,
  document_number: null,
  installment_id: null,
})

const exceedsReceivable = () => apiError(422, {
  code: 'VALIDATION_ERROR',
  message: 'payments would total 60000.00 (cash + WHT), more than the deal\'s receivable of 53500.00; send allow_overpayment: true to record it anyway',
  fields: { amount: ['exceeds_receivable'] },
})

describe('usePaymentSaveErrors', () => {
  beforeEach(() => {
    usePaymentsStore().$reset()
    useToast().clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('turns a 422 exceeds_receivable into "Record anyway", which resends with allow_overpayment: true', async () => {
    const api = useNuxtApp().$api
    const created = { id: 3, deal_id: 7, ...basePayload(), paid_at: '2026-09-30T03:00:00Z' }
    const postSpy = vi.spyOn(api, 'post')
      .mockRejectedValueOnce(exceedsReceivable())
      .mockResolvedValueOnce(apiResponse(created) as never)
    const setErrors = vi.fn()
    const { overpaymentPending, report, withOverpayment } = usePaymentSaveErrors(() => setErrors)
    const store = usePaymentsStore()

    // First save: refused, shown on the Amount field, dialog stays (handled).
    const refused = await store.add(7, withOverpayment(basePayload())).catch((err: unknown) => err)
    expect(report(refused)).toBe(true)
    expect(overpaymentPending.value).toBe(true)
    expect(setErrors).toHaveBeenCalledWith({ amount: useNuxtApp().$i18n.t('global.apiFieldError.exceeds_receivable') })
    expect(postSpy.mock.calls[0]![1]).not.toHaveProperty('allow_overpayment')

    // "Record anyway": the same payment, now with allow_overpayment.
    await store.add(7, withOverpayment(basePayload()))
    expect(postSpy.mock.calls[1]![1]).toEqual({ ...basePayload(), allow_overpayment: true })
    expect(store.items.map(p => p.id)).toEqual([3])
  })

  it('stops forcing the overpayment once reset (amount edited or dialog reopened)', () => {
    const { overpaymentPending, report, withOverpayment, reset } = usePaymentSaveErrors(() => vi.fn())

    report(exceedsReceivable())
    reset()

    expect(overpaymentPending.value).toBe(false)
    expect(withOverpayment(basePayload())).not.toHaveProperty('allow_overpayment')
  })

  it('shows a future paid_at on the date field', () => {
    const setErrors = vi.fn()
    const { report, overpaymentPending } = usePaymentSaveErrors(() => setErrors)

    const handled = report(apiError(422, { fields: { paid_at: ['must not be in the future'] } }))

    expect(handled).toBe(true)
    expect(overpaymentPending.value).toBe(false)
    expect(setErrors).toHaveBeenCalledWith({ paid_at: 'crm.components.addPaymentModal.errors.paidAtFuture' })
  })

  it('shows a 409 as the document number already being used', () => {
    const setErrors = vi.fn()
    const { report } = usePaymentSaveErrors(() => setErrors)

    expect(report(apiError(409, { code: 'CONFLICT', message: 'Another payment already has this document_number' }))).toBe(true)
    expect(setErrors).toHaveBeenCalledWith({ document_number: 'crm.components.addPaymentModal.errors.documentNumberTaken' })
  })

  it('toasts a payment on a Lost deal (no input to put it on)', async () => {
    const setErrors = vi.fn()
    const { report } = usePaymentSaveErrors(() => setErrors)

    expect(report(apiError(422, { fields: { deal_id: ['deal is lost'] } }))).toBe(true)
    expect(setErrors).not.toHaveBeenCalled()
    // useToast queues additions to the next tick.
    await nextTick()
    expect(useToast().toasts.value.map(toast => toast.title)).toEqual(['crm.components.addPaymentModal.errors.lostDeal'])
  })

  it('leaves errors it has no input for to the caller', () => {
    const setErrors = vi.fn()
    const { report } = usePaymentSaveErrors(() => setErrors)

    expect(report(apiError(422, { fields: { deal: ['invalid'] } }))).toBe(false)
    expect(report(apiError(500, { message: 'boom' }))).toBe(false)
    expect(setErrors).not.toHaveBeenCalled()
  })
})
