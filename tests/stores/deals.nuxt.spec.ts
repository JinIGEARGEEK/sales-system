import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { makeDeal, apiResponse } from '../factories'

// stores/deals.ts calls useNuxtApp().$api directly (no useFetchApi/useMutateApi
// wrapper) — mock the auto-imported useNuxtApp composable so every $api.get/
// post/put/patch/delete call in the store resolves against these spies
// instead of hitting a real backend. mockNuxtImport patches the same
// auto-import the store itself resolves to, not just this test file's own
// reference to it.
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

describe('stores/deals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDealsStore().$reset()
  })

  it('fetchAll loads deals from GET /deals and populates items/total/page', async () => {
    const deal = makeDeal({ id: 1 })
    mockApi.get.mockResolvedValueOnce(apiResponse([deal], { total: 1, page: 1 }))

    const store = useDealsStore()
    const result = await store.fetchAll()

    expect(mockApi.get).toHaveBeenCalledWith('/deals', { params: { per_page: 200 } })
    expect(result).toHaveLength(1)
    expect(store.items[0].id).toBe(1)
    expect(store.total).toBe(1)
    expect(store.page).toBe(1)
  })

  it('fetchAll parses date fields on every returned deal', async () => {
    const deal = makeDeal({ expected_close_date: '2026-03-01T00:00:00.000Z' as unknown as Date })
    mockApi.get.mockResolvedValueOnce(apiResponse([deal]))

    const store = useDealsStore()
    await store.fetchAll()

    expect(store.items[0].created_at).toBeInstanceOf(Date)
    expect(store.items[0].expected_close_date).toBeInstanceOf(Date)
  })

  it('add posts the new deal to POST /deals and pushes the created record into items', async () => {
    const created = makeDeal({ id: 2, title: 'New Deal' })
    mockApi.post.mockResolvedValueOnce(apiResponse(created))

    const store = useDealsStore()
    const payload = { title: 'New Deal', value: 100 } as Omit<Deal, 'id'>
    const result = await store.add(payload)

    expect(mockApi.post).toHaveBeenCalledWith('/deals', payload)
    expect(result.id).toBe(2)
    expect(store.items).toContainEqual(result)
  })

  it('update PUTs changes to /deals/:id and replaces the matching item in place', async () => {
    const store = useDealsStore()
    store.items = [makeDeal({ id: 1, title: 'Old title' })]
    const updated = makeDeal({ id: 1, title: 'New title' })
    mockApi.put.mockResolvedValueOnce(apiResponse(updated))

    const result = await store.update(1, { title: 'New title' })

    expect(mockApi.put).toHaveBeenCalledWith('/deals/1', { title: 'New title' })
    expect(result.title).toBe('New title')
    expect(store.items).toHaveLength(1)
    expect(store.items[0].title).toBe('New title')
  })

  it('update leaves items untouched when the deal being updated is not already loaded', async () => {
    const store = useDealsStore()
    store.items = [makeDeal({ id: 1 })]
    const updated = makeDeal({ id: 99, title: 'Untracked' })
    mockApi.put.mockResolvedValueOnce(apiResponse(updated))

    await store.update(99, { title: 'Untracked' })

    expect(store.items).toHaveLength(1)
    expect(store.items[0].id).toBe(1)
  })

  it('updateStage PATCHes /deals/:id/stage with the new stage and replaces the item in place', async () => {
    const store = useDealsStore()
    store.items = [makeDeal({ id: 1, stage: 'Lead' })]
    const updated = makeDeal({ id: 1, stage: 'Qualified' })
    mockApi.patch.mockResolvedValueOnce(apiResponse(updated))

    const result = await store.updateStage(1, 'Qualified')

    expect(mockApi.patch).toHaveBeenCalledWith('/deals/1/stage', { stage: 'Qualified' })
    expect(result.stage).toBe('Qualified')
    expect(store.items[0].stage).toBe('Qualified')
  })

  it('remove deletes the deal via DELETE /deals/:id and drops it from items', async () => {
    const store = useDealsStore()
    store.items = [makeDeal({ id: 1 }), makeDeal({ id: 2 })]
    mockApi.delete.mockResolvedValueOnce({})

    await store.remove(1)

    expect(mockApi.delete).toHaveBeenCalledWith('/deals/1')
    expect(store.items.map(d => d.id)).toEqual([2])
  })

  it('receiveConverted parses dates and pushes a Deal from lead conversion into items without an API call', () => {
    const store = useDealsStore()
    const converted = makeDeal({ id: 3, expected_close_date: '2026-05-01T00:00:00.000Z' as unknown as Date })

    const result = store.receiveConverted(converted)

    expect(mockApi.post).not.toHaveBeenCalled()
    expect(result.expected_close_date).toBeInstanceOf(Date)
    expect(store.items.map(d => d.id)).toContain(3)
  })
})
