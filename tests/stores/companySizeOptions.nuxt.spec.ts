import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { apiResponse } from '../factories'
import { compareCompanySizes } from '~/stores/companySizeOptions'

// No toast/notify usage in this store, so mocking useNuxtApp wholesale is safe.
const mockApi = { get: vi.fn() }
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

const size = (id: number, name: string, is_active = true): CompanySizeOption => ({ id, name, is_active, created_at: new Date() })

describe('stores/companySizeOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCompanySizeOptionsStore().$reset()
  })

  it('orders sizes by headcount, not alphabetically, with custom labels last', async () => {
    // The API's own order: name ASC as text.
    mockApi.get.mockResolvedValueOnce(apiResponse(['1-10 คน', '1000+ คน', '11-50 คน', '201-500 คน', '501-1000 คน', '51-200 คน', '> 100 คน', 'Startup'].map((n, i) => size(i + 1, n))))
    const store = useCompanySizeOptionsStore()
    await store.fetchAll()
    expect(store.activeOptions.map(o => o.label)).toEqual(['1-10 คน', '11-50 คน', '51-200 คน', '> 100 คน', '201-500 คน', '501-1000 คน', '1000+ คน', 'Startup'])
  })

  it('still leaves inactive sizes out of the dropdown options', async () => {
    mockApi.get.mockResolvedValueOnce(apiResponse([size(1, '11-50 คน'), size(2, '> 100 คน', false)]))
    const store = useCompanySizeOptionsStore()
    await store.fetchAll()
    expect(store.activeOptions.map(o => o.label)).toEqual(['11-50 คน'])
  })

  it('compareCompanySizes handles thousands separators', () => {
    expect(['1,001-5,000 คน', '501-1000 คน'].sort(compareCompanySizes)).toEqual(['501-1000 คน', '1,001-5,000 คน'])
  })
})
