import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { apiResponse } from '../factories'

// stores/payments.ts calls useNuxtApp().$api directly — same mocking approach
// as tests/stores/deals.nuxt.spec.ts.
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

const makePayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 1,
  deal_id: 1,
  amount: 100,
  paid_at: new Date('2026-01-01T00:00:00.000Z'),
  method: 'cash',
  note: '',
  ...overrides,
} as Payment)

describe('stores/payments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePaymentsStore().$reset()
  })

  it('fetchForDeal loads a deal\'s payments/total, merging payments into items while keeping other deals\'', async () => {
    const store = usePaymentsStore()
    store.items = [makePayment({ id: 99, deal_id: 2 })]
    const payment = makePayment({ id: 1, deal_id: 1, amount: 250 })
    mockApi.get.mockResolvedValueOnce(apiResponse({ payments: [payment], total_paid: 250 }))

    const result = await store.fetchForDeal(1)

    expect(mockApi.get).toHaveBeenCalledWith('/deals/1/payments')
    expect(result).toEqual([payment])
    expect(store.items.map(p => p.id).sort()).toEqual([1, 99])
    expect(store.totalForDeal(1)).toBe(250)
  })

  it('forDeal getter filters items down to the given deal_id', () => {
    const store = usePaymentsStore()
    store.items = [makePayment({ id: 1, deal_id: 1 }), makePayment({ id: 2, deal_id: 2 })]

    expect(store.forDeal(1).map(p => p.id)).toEqual([1])
  })

  it('totalForDeal getter returns 0 for a deal with no fetched total', () => {
    const store = usePaymentsStore()

    expect(store.totalForDeal(42)).toBe(0)
  })

  it('add POSTs a new payment and bumps totalPaidByDeal by its amount', async () => {
    const store = usePaymentsStore()
    store.totalPaidByDeal[1] = 100
    const created = makePayment({ id: 2, deal_id: 1, amount: 50 })
    mockApi.post.mockResolvedValueOnce(apiResponse(created))

    const payload = { amount: 50, paid_at: new Date(), method: 'cash' as PaymentMethod, note: '' }
    const result = await store.add(1, payload)

    expect(mockApi.post).toHaveBeenCalledWith('/deals/1/payments', payload)
    expect(result.id).toBe(2)
    expect(store.items).toContainEqual(result)
    expect(store.totalPaidByDeal[1]).toBe(150)
  })

  it('add initializes totalPaidByDeal from 0 when no total was tracked yet for the deal', async () => {
    const store = usePaymentsStore()
    const created = makePayment({ id: 1, deal_id: 5, amount: 75 })
    mockApi.post.mockResolvedValueOnce(apiResponse(created))

    await store.add(5, { amount: 75, paid_at: new Date(), method: 'cash', note: '' })

    expect(store.totalPaidByDeal[5]).toBe(75)
  })

  it('remove DELETEs the payment, drops it from items, and decrements totalPaidByDeal', async () => {
    const store = usePaymentsStore()
    store.items = [makePayment({ id: 1, deal_id: 1, amount: 100 }), makePayment({ id: 2, deal_id: 1, amount: 50 })]
    store.totalPaidByDeal[1] = 150
    mockApi.delete.mockResolvedValueOnce({})

    await store.remove(1)

    expect(mockApi.delete).toHaveBeenCalledWith('/payments/1')
    expect(store.items.map(p => p.id)).toEqual([2])
    expect(store.totalPaidByDeal[1]).toBe(50)
  })

  it('remove is a no-op on totalPaidByDeal when the payment id is not found in items', async () => {
    const store = usePaymentsStore()
    store.items = [makePayment({ id: 1, deal_id: 1, amount: 100 })]
    store.totalPaidByDeal[1] = 100
    mockApi.delete.mockResolvedValueOnce({})

    await store.remove(999)

    expect(store.totalPaidByDeal[1]).toBe(100)
    expect(store.items).toHaveLength(1)
  })
})
