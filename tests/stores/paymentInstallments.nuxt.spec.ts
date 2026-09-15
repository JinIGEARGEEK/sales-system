import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { apiResponse } from '../factories'

// stores/paymentInstallments.ts calls useNuxtApp().$api directly — same
// mocking approach as tests/stores/payments.nuxt.spec.ts.
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

const makeStatus = (overrides: Partial<PaymentInstallment> = {}, statusOverrides: Partial<PaymentInstallmentStatus> = {}): PaymentInstallmentStatus => ({
  installment: {
    id: 1,
    deal_id: 1,
    amount: 30000,
    due_date: new Date('2026-10-01T00:00:00.000Z'),
    note: '',
    ...overrides,
  },
  covered: 0,
  status: 'upcoming',
  ...statusOverrides,
})

describe('stores/paymentInstallments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePaymentInstallmentsStore().$reset()
  })

  it('fetchForDeal loads a deal\'s installments, merging into items while keeping other deals\'', async () => {
    const store = usePaymentInstallmentsStore()
    store.items = [makeStatus({ id: 99, deal_id: 2 })]
    const status = makeStatus({ id: 1, deal_id: 1 })
    mockApi.get.mockResolvedValueOnce(apiResponse([status]))

    const result = await store.fetchForDeal(1)

    expect(mockApi.get).toHaveBeenCalledWith('/deals/1/payment-installments')
    expect(result).toEqual([status])
    expect(store.items.map(s => s.installment.id).sort()).toEqual([1, 99])
  })

  it('forDeal getter filters items down to the given deal_id', () => {
    const store = usePaymentInstallmentsStore()
    store.items = [makeStatus({ id: 1, deal_id: 1 }), makeStatus({ id: 2, deal_id: 2 })]

    expect(store.forDeal(1).map(s => s.installment.id)).toEqual([1])
  })

  it('add POSTs a new installment then refetches the deal\'s full list (waterfall reallocation can change sibling rows\' status)', async () => {
    const store = usePaymentInstallmentsStore()
    const created = { id: 2, deal_id: 1, amount: 20000, due_date: new Date('2026-11-01T00:00:00.000Z'), note: '' }
    mockApi.post.mockResolvedValueOnce(apiResponse(created))
    mockApi.get.mockResolvedValueOnce(apiResponse([makeStatus({ id: 2, deal_id: 1, amount: 20000 })]))

    const payload = { amount: 20000, due_date: created.due_date, note: '' }
    const result = await store.add(1, payload)

    expect(mockApi.post).toHaveBeenCalledWith('/deals/1/payment-installments', payload)
    expect(mockApi.get).toHaveBeenCalledWith('/deals/1/payment-installments')
    expect(result.id).toBe(2)
    expect(store.items.map(s => s.installment.id)).toEqual([2])
  })

  it('remove DELETEs the installment then refetches the deal\'s full list', async () => {
    const store = usePaymentInstallmentsStore()
    mockApi.delete.mockResolvedValueOnce({})
    mockApi.get.mockResolvedValueOnce(apiResponse([]))

    await store.remove(1, 1)

    expect(mockApi.delete).toHaveBeenCalledWith('/payment-installments/1')
    expect(mockApi.get).toHaveBeenCalledWith('/deals/1/payment-installments')
    expect(store.items).toEqual([])
  })

  it('bulkAdd POSTs the whole schedule in one call then refetches the deal\'s full list', async () => {
    const store = usePaymentInstallmentsStore()
    const created = [
      { id: 2, deal_id: 1, amount: 10000, due_date: new Date('2026-11-01T00:00:00.000Z'), note: '' },
      { id: 3, deal_id: 1, amount: 10000, due_date: new Date('2026-12-01T00:00:00.000Z'), note: '' },
    ]
    mockApi.post.mockResolvedValueOnce(apiResponse(created))
    mockApi.get.mockResolvedValueOnce(apiResponse([
      makeStatus({ id: 2, deal_id: 1, amount: 10000 }),
      makeStatus({ id: 3, deal_id: 1, amount: 10000 }),
    ]))

    const payload = created.map(({ amount, due_date, note }) => ({ amount, due_date, note }))
    const result = await store.bulkAdd(1, payload)

    expect(mockApi.post).toHaveBeenCalledWith('/deals/1/payment-installments/bulk', { installments: payload })
    expect(mockApi.get).toHaveBeenCalledWith('/deals/1/payment-installments')
    expect(result).toHaveLength(2)
    expect(store.items.map(s => s.installment.id)).toEqual([2, 3])
  })
})
