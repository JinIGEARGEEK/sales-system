import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// stores/users.ts has no toast/notify usage, so mocking useNuxtApp wholesale
// is fine here (CLAUDE.md test-mocking guidance; see tests/stores/deals.nuxt.spec.ts).
const mockApi = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

const counts = (over: Partial<OpenRecordCounts> = {}): OpenRecordCounts => ({ deals: 0, leads: 0, prospects: 0, tasks: 0, total: 0, ...over })

const makeUser = (over: Partial<AdminUser> = {}) => ({
  id: 2, first_name: 'Somchai', last_name: 'D', email: 's@igeargeek.com', tel: '', notes: '', role: 'Sales Rep',
  is_active: true, must_change_password: false, accepted_consent_id: null, latest_login: null,
  created_at: null, updated_at: null, deleted_at: null, created_by: 0, updated_by: 0, deleted_by: 0, ...over,
}) as unknown as AdminUser

describe('stores/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUsersStore().$reset()
  })

  it('remove sends reassign_to as a query param and returns the 200 body', async () => {
    const store = useUsersStore()
    store.items = [makeUser()]
    const body = { id: 2, open_records: counts(), reassigned: { ...counts({ deals: 3, total: 3 }), user_id: 2, reassign_to: 5 } }
    mockApi.delete.mockResolvedValueOnce({ data: { data: body } })

    const result = await store.remove(2, 5)

    expect(mockApi.delete).toHaveBeenCalledWith('/users/2', { params: { reassign_to: 5 } })
    expect(result).toEqual(body)
    expect(store.items[0]?.is_active).toBe(false)
  })

  it('update splits open_records/reassigned off the user it stores', async () => {
    const store = useUsersStore()
    store.items = [makeUser()]
    mockApi.put.mockResolvedValueOnce({ data: { data: { ...makeUser({ role: 'Production' }), open_records: counts({ tasks: 1, total: 1 }) } } })

    const result = await store.update(2, { first_name: 'Somchai', last_name: 'D', email: 's@igeargeek.com', tel: '', role: 'Production', status: 'active', notes: '' })

    expect(result.open_records).toEqual(counts({ tasks: 1, total: 1 }))
    expect(result.reassigned).toBeNull()
    expect(store.items[0]).not.toHaveProperty('open_records')
    expect(store.items[0]?.role).toBe('Production')
  })

  it('bulk deactivate sends reassign_to and reads the arrays; bulk activate (204) returns empty ones', async () => {
    const store = useUsersStore()
    mockApi.patch.mockResolvedValueOnce({ data: { data: { open_records: [{ ...counts(), user_id: 2 }], reassigned: [] } } })

    const deactivated = await store.bulkDeactivate([2], 5)

    expect(mockApi.patch).toHaveBeenCalledWith('/users/bulk-deactivate', { ids: [2], reassign_to: 5 })
    expect(deactivated.open_records).toHaveLength(1)

    mockApi.patch.mockResolvedValueOnce({ data: '' })
    expect(await store.bulkActivate([2])).toEqual({ open_records: [], reassigned: [] })
    expect(mockApi.patch).toHaveBeenLastCalledWith('/users/bulk-activate', { ids: [2] })
  })
})
