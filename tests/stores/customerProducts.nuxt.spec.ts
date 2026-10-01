import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { apiResponse } from '../factories'

// stores/customerProducts.ts calls useNuxtApp().$api directly and never
// toasts — same mocking approach as tests/stores/deals.nuxt.spec.ts.
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}
mockNuxtImport('useNuxtApp', original => (...args: unknown[]) => new Proxy(original(...args), {
  get: (nuxtApp, key) => (key === '$api' ? mockApi : Reflect.get(nuxtApp, key)),
}))

const product: Product = { id: 5, name: 'CRM Cloud', category: 'SaaS', description: '', price: 1000, is_active: true }

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  company_id: 9,
  product_id: 5,
  status: 'Active',
  start_date: '2026-01-01T00:00:00Z',
  end_date: null,
  source_deal_id: null,
  renewal_date: null,
  billing_cycle: null,
  price: null,
  product,
  ...overrides,
})

describe('stores/customerProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCustomerProductsStore().$reset()
  })

  it('keeps renewal_date as the date-only YYYY-MM-DD prefix and carries billing cycle / price', async () => {
    const store = useCustomerProductsStore()
    mockApi.get.mockResolvedValueOnce(apiResponse([makeRecord({ renewal_date: '2027-01-15T00:00:00Z', billing_cycle: 'yearly', price: 12000 })]))

    const [record] = await store.fetchForCompany(9)

    expect(record).toMatchObject({ renewal_date: '2027-01-15', billing_cycle: 'yearly', price: 12000 })
  })

  it('defaults the renewal fields to null on an older row', async () => {
    const store = useCustomerProductsStore()
    const { renewal_date: _r, billing_cycle: _b, price: _p, ...legacy } = makeRecord()
    mockApi.get.mockResolvedValueOnce(apiResponse([legacy]))

    const [record] = await store.fetchForCompany(9)

    expect(record).toMatchObject({ renewal_date: null, billing_cycle: null, price: null })
  })

  it('add sends the renewal date as YYYY-MM-DD and leaves unset renewal fields out', async () => {
    const store = useCustomerProductsStore()
    const { product: _product, ...created } = makeRecord({ renewal_date: '2027-01-15T00:00:00Z' })
    mockApi.post.mockResolvedValueOnce(apiResponse(created))

    await store.add(9, { product_id: 5, status: 'Active', renewal_date: '2027-01-15', billing_cycle: null, price: null }, product)

    const body = mockApi.post.mock.calls[0]![1]
    expect(body.renewal_date).toBe('2027-01-15')
    expect(body.billing_cycle).toBeUndefined()
    expect(body.price).toBeUndefined()
  })

  it('update PATCHes the renewal fields, sending null to clear them', async () => {
    const store = useCustomerProductsStore()
    store.items = [{ ...makeRecord(), start_date: new Date('2026-01-01T00:00:00Z') } as unknown as CustomerProduct]
    const { product: _product, ...updated } = makeRecord({ billing_cycle: 'monthly' })
    mockApi.patch.mockResolvedValueOnce(apiResponse(updated))

    const result = await store.update(1, { status: 'Active', end_date: null, renewal_date: null, billing_cycle: 'monthly', price: null })

    expect(mockApi.patch).toHaveBeenCalledWith('/customer-products/1', { status: 'Active', end_date: null, renewal_date: null, billing_cycle: 'monthly', price: null })
    expect(result.product).toEqual(product)
    expect(result.billing_cycle).toBe('monthly')
  })
})
