import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { makeContract, apiResponse } from '../factories'

// stores/contracts.ts calls useNuxtApp().$api directly — same mocking approach
// as tests/stores/deals.nuxt.spec.ts.
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

describe('stores/contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useContractsStore().$reset()
  })

  it('fetchForDeal loads a deal\'s contracts and merges them into items, keeping other deals\' contracts', async () => {
    const store = useContractsStore()
    store.items = [makeContract({ id: 99, deal_id: 2 })]
    const contract = makeContract({ id: 1, deal_id: 1 })
    mockApi.get.mockResolvedValueOnce(apiResponse([contract]))

    const result = await store.fetchForDeal(1)

    expect(mockApi.get).toHaveBeenCalledWith('/deals/1/contracts')
    expect(result).toHaveLength(1)
    expect(store.items.map(c => c.id).sort()).toEqual([1, 99])
  })

  it('forDeal getter filters items down to the given deal_id', () => {
    const store = useContractsStore()
    store.items = [makeContract({ id: 1, deal_id: 1 }), makeContract({ id: 2, deal_id: 2 })]

    expect(store.forDeal(1).map(c => c.id)).toEqual([1])
  })

  it('add POSTs to /deals/:dealId/contracts and pushes the created contract', async () => {
    const created = makeContract({ id: 5 })
    mockApi.post.mockResolvedValueOnce(apiResponse(created))
    const store = useContractsStore()

    const result = await store.add(1, { status: 'draft' })

    expect(mockApi.post).toHaveBeenCalledWith('/deals/1/contracts', { status: 'draft' })
    expect(result.id).toBe(5)
    expect(store.items).toContainEqual(result)
  })

  it('update PUTs status/quote_id changes to /contracts/:id and replaces the item in place', async () => {
    const store = useContractsStore()
    store.items = [makeContract({ id: 1, status: 'draft' })]
    const updated = makeContract({ id: 1, status: 'signed', signed_date: new Date('2026-02-01T00:00:00.000Z') })
    mockApi.put.mockResolvedValueOnce(apiResponse(updated))

    const result = await store.update(1, { status: 'signed' })

    expect(mockApi.put).toHaveBeenCalledWith('/contracts/1', { status: 'signed' })
    expect(result.status).toBe('signed')
    expect(store.items[0].status).toBe('signed')
  })

  it('update leaves items untouched when the contract being updated is not already loaded', async () => {
    const store = useContractsStore()
    store.items = [makeContract({ id: 1 })]
    const updated = makeContract({ id: 99, status: 'signed' })
    mockApi.put.mockResolvedValueOnce(apiResponse(updated))

    await store.update(99, { status: 'signed' })

    expect(store.items).toHaveLength(1)
    expect(store.items[0].id).toBe(1)
  })

  it('upload POSTs a multipart file to /contracts/:id/upload and replaces the item in place', async () => {
    const store = useContractsStore()
    store.items = [makeContract({ id: 1, signed_file_url: null })]
    const updated = makeContract({ id: 1, signed_file_url: '/files/contract.pdf' })
    mockApi.post.mockResolvedValueOnce(apiResponse(updated))

    const file = new File(['content'], 'contract.pdf')
    const result = await store.upload(1, file)

    expect(mockApi.post).toHaveBeenCalledWith(
      '/contracts/1/upload',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    expect(result.signed_file_url).toBe('/files/contract.pdf')
    expect(store.items[0].signed_file_url).toBe('/files/contract.pdf')
  })
})
