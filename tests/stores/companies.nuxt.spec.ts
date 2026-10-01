import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { apiResponse } from '../factories'

// Swap only useNuxtApp().$api for these spies, keeping the real nuxtApp
// (see tests/stores/deals.nuxt.spec.ts and CLAUDE.md).
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}
mockNuxtImport('useNuxtApp', original => (...args: unknown[]) => new Proxy(original(...args), {
  get: (nuxtApp, key) => (key === '$api' ? mockApi : Reflect.get(nuxtApp, key)),
}))

const makeCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 1,
  name: 'Acme',
  industry: 'Retail',
  size: '11-50',
  revenue_size: '10-50M',
  website: 'https://acme.co.th',
  tags: ['vip'],
  notes: 'Key account',
  status: 'active',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-02T00:00:00.000Z'),
  last_activity_at: null,
  ...overrides,
})

describe('stores/companies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCompaniesStore().$reset()
  })

  it('fullCompanyUpdatePayload carries every PUT field, nulling the optional ones the record lacks', () => {
    expect(fullCompanyUpdatePayload(makeCompany(), { address: '1 Silom Rd' })).toEqual({
      name: 'Acme',
      industry: 'Retail',
      size: '11-50',
      revenue_size: '10-50M',
      website: 'https://acme.co.th',
      tags: ['vip'],
      notes: 'Key account',
      status: 'active',
      legal_name: null,
      address: '1 Silom Rd',
      tax_id: null,
      branch_code: null,
      postal_code: null,
    })
  })

  it('update PUTs /companies/:id and replaces the item in place with dates parsed', async () => {
    const store = useCompaniesStore()
    store.items = [makeCompany({ id: 1 })]
    const payload = fullCompanyUpdatePayload(makeCompany({ id: 1 }), { name: 'Acme Co' })
    mockApi.put.mockResolvedValueOnce(apiResponse({
      ...makeCompany({ id: 1, name: 'Acme Co' }),
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-03T00:00:00.000Z',
    }))

    await store.update(1, payload)

    expect(mockApi.put).toHaveBeenCalledWith('/companies/1', payload)
    expect(store.items[0]?.name).toBe('Acme Co')
    expect(store.items[0]?.updated_at).toBeInstanceOf(Date)
  })
})
