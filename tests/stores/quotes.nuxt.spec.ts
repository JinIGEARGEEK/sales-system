import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { apiResponse } from '../factories'

// stores/quotes.ts calls useNuxtApp().$api directly — same mocking approach as
// tests/stores/deals.nuxt.spec.ts.
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

const makeQuote = (overrides: Partial<Quote> = {}): Quote => ({
  id: 1,
  deal_id: 1,
  items: [{ description: 'Item', qty: 1, price: 100 }],
  scope_of_work: '',
  validity_date: null,
  status: 'draft',
  reference_number: null,
  issue_date: null,
  credit_days: 0,
  price_type: 'excl_tax',
  vat_enabled: false,
  wht_enabled: false,
  wht_rate: 0,
  discount_total: 0,
  notes: null,
  internal_notes: null,
  ...overrides,
} as Quote)

describe('stores/quotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQuotesStore().$reset()
  })

  it('fetchForDeal loads a deal\'s quotes and merges them into items, keeping other deals\' quotes', async () => {
    const store = useQuotesStore()
    store.items = [makeQuote({ id: 99, deal_id: 2 })]
    const quote = makeQuote({ id: 1, deal_id: 1 })
    mockApi.get.mockResolvedValueOnce(apiResponse([quote]))

    const result = await store.fetchForDeal(1)

    expect(mockApi.get).toHaveBeenCalledWith('/deals/1/quotes')
    expect(result).toHaveLength(1)
    expect(store.items.map(q => q.id).sort()).toEqual([1, 99])
  })

  it('forDeal getter filters items down to the given deal_id', () => {
    const store = useQuotesStore()
    store.items = [makeQuote({ id: 1, deal_id: 1 }), makeQuote({ id: 2, deal_id: 2 })]

    expect(store.forDeal(1).map(q => q.id)).toEqual([1])
  })

  it('add POSTs to /deals/:dealId/quotes and pushes the created quote', async () => {
    const created = makeQuote({ id: 5 })
    mockApi.post.mockResolvedValueOnce(apiResponse(created))
    const store = useQuotesStore()

    const payload = { items: created.items, scope_of_work: '', validity_date: null, status: 'draft' as QuoteStatus }
    const result = await store.add(1, payload)

    expect(mockApi.post).toHaveBeenCalledWith('/deals/1/quotes', payload)
    expect(result.id).toBe(5)
    expect(store.items).toContainEqual(result)
  })

  it('remove DELETEs /quotes/:id and drops it from items', async () => {
    const store = useQuotesStore()
    store.items = [makeQuote({ id: 1 }), makeQuote({ id: 2 })]
    mockApi.delete.mockResolvedValueOnce({})

    await store.remove(1)

    expect(mockApi.delete).toHaveBeenCalledWith('/quotes/1')
    expect(store.items.map(q => q.id)).toEqual([2])
  })

  it('update PUTs the full payload to /quotes/:id and merges the response into items', async () => {
    const store = useQuotesStore()
    store.items = [makeQuote({ id: 1, status: 'draft' })]
    const updated = makeQuote({ id: 1, status: 'sent' })
    mockApi.put.mockResolvedValueOnce(apiResponse(updated))

    const payload = {
      items: updated.items,
      scope_of_work: '',
      validity_date: null,
      status: 'sent' as QuoteStatus,
      reference_number: null,
      issue_date: null,
      credit_days: 0,
      price_type: 'excl_tax' as QuotePriceType,
      vat_enabled: false,
      wht_enabled: false,
      wht_rate: 0,
      discount_total: 0,
      notes: null,
      internal_notes: null,
    }
    const result = await store.update(1, payload)

    expect(mockApi.put).toHaveBeenCalledWith('/quotes/1', payload)
    expect(result.status).toBe('sent')
    expect(store.items[0].status).toBe('sent')
  })

  it('updateStatus rebuilds the full PUT payload from the already-loaded quote and only changes status', async () => {
    const store = useQuotesStore()
    const existing = makeQuote({ id: 1, status: 'draft', reference_number: 'REF-1', notes: 'hi' })
    store.items = [existing]
    const updated = { ...existing, status: 'accepted' as QuoteStatus }
    mockApi.put.mockResolvedValueOnce(apiResponse(updated))

    const result = await store.updateStatus(1, 'accepted')

    expect(mockApi.put).toHaveBeenCalledWith('/quotes/1', expect.objectContaining({
      status: 'accepted',
      reference_number: 'REF-1',
      notes: 'hi',
      items: existing.items,
    }))
    expect(result.status).toBe('accepted')
  })

  it('updateStatus throws when the quote is not already loaded in items', async () => {
    const store = useQuotesStore()

    await expect(store.updateStatus(404, 'accepted')).rejects.toThrow('Quote 404 not loaded')
    expect(mockApi.put).not.toHaveBeenCalled()
  })

  it('fetchOne loads a single quote by id and merges it into items', async () => {
    const store = useQuotesStore()
    store.items = [makeQuote({ id: 2 })]
    const fetched = makeQuote({ id: 7 })
    mockApi.get.mockResolvedValueOnce(apiResponse(fetched))

    const result = await store.fetchOne(7)

    expect(mockApi.get).toHaveBeenCalledWith('/quotes/7')
    expect(result.id).toBe(7)
    expect(store.items.map(q => q.id).sort()).toEqual([2, 7])
  })
})
