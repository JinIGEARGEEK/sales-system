import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'

// Echo i18n keys back; useApiFieldErrors itself reads the real $i18n table.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// A failed blob request: the JSON error envelope arrives as a Blob.
const blobError = (status: number, error: Record<string, unknown>) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {} as AxiosResponse['config'],
    data: new Blob([JSON.stringify({ error })], { type: 'application/json' }),
  } as AxiosResponse)

const toastTitles = async () => {
  await nextTick()
  return useToast().toasts.value.map(toast => toast.title)
}

describe('usePaymentsExport', () => {
  beforeEach(() => {
    useToast().clear()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:payments')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends only the filters that are set, as YYYY-MM-DD, without the error redirect', async () => {
    const getSpy = vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue({ data: 'id,amount\n' } as never)
    const exportPayments = usePaymentsExport()

    expect(await exportPayments({ date_from: '2026-09-01', date_to: '2026-09-30', method: 'transfer', deal_id: undefined })).toBe(true)

    expect(getSpy).toHaveBeenCalledWith('/payments/export', {
      responseType: 'blob',
      params: { date_from: '2026-09-01', date_to: '2026-09-30', method: 'transfer' },
      skipErrorRedirect: true,
    })
  })

  it('exports one deal\'s payments by deal_id', async () => {
    const getSpy = vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue({ data: '' } as never)
    await usePaymentsExport()({ deal_id: 7 })
    expect(getSpy.mock.calls[0]![1]).toMatchObject({ params: { deal_id: 7 } })
    expect(paymentsExportFilename({ deal_id: 7 })).toBe('payments-deal-7.csv')
    expect(paymentsExportFilename({ date_from: '2026-09-01', date_to: '2026-09-30' })).toBe('payments-2026-09-01_2026-09-30.csv')
  })

  it('catches a range that ends before it starts without calling the API', async () => {
    const getSpy = vi.spyOn(useNuxtApp().$api, 'get')
    const setErrors = vi.fn()

    expect(await usePaymentsExport()({ date_from: '2026-09-30', date_to: '2026-09-01' }, setErrors)).toBe(false)

    expect(getSpy).not.toHaveBeenCalled()
    expect(setErrors).toHaveBeenCalledWith({ date_to: 'crm.components.paymentsExportModal.invalidRange' })
  })

  it('puts the API\'s 422 bad range (a JSON body inside the Blob) on the date inputs, with no toast', async () => {
    vi.spyOn(useNuxtApp().$api, 'get').mockRejectedValue(blobError(422, { code: 'VALIDATION_ERROR', message: 'date_to must not be before date_from', fields: { date_to: ['invalid'] } }))
    const setErrors = vi.fn()

    expect(await usePaymentsExport()({ date_from: '2026-09-01', date_to: '2026-09-02' }, setErrors)).toBe(false)

    expect(setErrors).toHaveBeenCalledWith({ date_to: 'crm.components.paymentsExportModal.invalidRange' })
    expect(await toastTitles()).toEqual([])
  })

  it('toasts the translated range message when there is no form to mark', async () => {
    vi.spyOn(useNuxtApp().$api, 'get').mockRejectedValue(blobError(422, { message: 'bad date', fields: { date_from: ['invalid'] } }))
    await usePaymentsExport()({ date_from: 'x' })
    expect(await toastTitles()).toEqual(['crm.components.paymentsExportModal.invalidRange'])
  })

  it('toasts the API\'s message for a 403', async () => {
    vi.spyOn(useNuxtApp().$api, 'get').mockRejectedValue(blobError(403, { code: 'FORBIDDEN', message: 'Admin or Sales Manager only' }))
    await usePaymentsExport()({ deal_id: 7 })
    expect(await toastTitles()).toEqual(['Admin or Sales Manager only'])
  })
})
