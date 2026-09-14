import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// useDealStageHistory calls useNuxtApp().$api directly (both for the
// audit-log fetch and, via teamMembersStore, the team-members fetch) — same
// mocking approach as tests/stores/deals.nuxt.spec.ts.
const mockApi = { get: vi.fn() }
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

const auditResponse = (entries: AuditLogEntry[]) => ({
  data: { data: entries, page: 1, per_page: 200, total: entries.length, total_page: 1, next: 0, prev: 0 },
})

const teamMembersResponse = (members: TeamMember[]) => ({
  data: { data: members, page: 1, per_page: 200, total: members.length, total_page: 1, next: 0, prev: 0 },
})

const makeEntry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
  id: 1,
  entity_type: 'deal',
  entity_id: 1,
  action: 'stage_changed',
  before: { stage: 'Lead' },
  after: { stage: 'Qualified' },
  actor_id: 1,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
} as AuditLogEntry)

describe('useDealStageHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTeamMembersStore().$reset()
  })

  it('fetches deal stage-change audit entries scoped to the given deal id', async () => {
    useTeamMembersStore().items = [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
    mockApi.get.mockResolvedValueOnce(auditResponse([makeEntry()]))

    const { fetchDealStageHistory } = useDealStageHistory()
    const result = await fetchDealStageHistory(5)

    expect(mockApi.get).toHaveBeenCalledWith('/audit-log', {
      params: {
        entity_type: 'deal',
        action: 'stage_changed',
        entity_id: 5,
        per_page: 200,
        sort: '-created_at',
      },
    })
    expect(result).toHaveLength(1)
  })

  it('omits entity_id from the request params when no deal id is given', async () => {
    useTeamMembersStore().items = [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
    mockApi.get.mockResolvedValueOnce(auditResponse([]))

    const { fetchDealStageHistory } = useDealStageHistory()
    await fetchDealStageHistory()

    expect(mockApi.get).toHaveBeenCalledWith('/audit-log', {
      params: {
        entity_type: 'deal',
        action: 'stage_changed',
        per_page: 200,
        sort: '-created_at',
      },
    })
  })

  it('maps each raw audit entry into a DealStageChangeEntry with resolved actor name and parsed date', async () => {
    useTeamMembersStore().items = [{ id: 9, name: 'Bob', email: 'bob@example.com' }]
    mockApi.get.mockResolvedValueOnce(auditResponse([makeEntry({
      id: 3,
      entity_id: 12,
      before: { stage: 'Lead' },
      after: { stage: 'Qualified' },
      actor_id: 9,
      created_at: '2026-03-01T00:00:00.000Z' as unknown as Date,
    })]))

    const { fetchDealStageHistory } = useDealStageHistory()
    const [entry] = await fetchDealStageHistory(12)

    expect(entry).toEqual({
      id: 3,
      dealId: 12,
      fromStage: 'Lead',
      toStage: 'Qualified',
      actorName: 'Bob',
      created_at: new Date('2026-03-01T00:00:00.000Z'),
    })
  })

  it('defaults fromStage to null when the "before" state has no stage (e.g. a deal\'s first stage change)', async () => {
    useTeamMembersStore().items = [{ id: 1, name: 'Alice', email: 'a@example.com' }]
    mockApi.get.mockResolvedValueOnce(auditResponse([makeEntry({ before: {}, after: { stage: 'Lead' } })]))

    const { fetchDealStageHistory } = useDealStageHistory()
    const [entry] = await fetchDealStageHistory(1)

    expect(entry.fromStage).toBeNull()
  })

  it('resolves an unknown actor to "Unassigned" via teamMembersStore.nameById', async () => {
    useTeamMembersStore().items = [{ id: 1, name: 'Alice', email: 'a@example.com' }]
    mockApi.get.mockResolvedValueOnce(auditResponse([makeEntry({ actor_id: 999 })]))

    const { fetchDealStageHistory } = useDealStageHistory()
    const [entry] = await fetchDealStageHistory(1)

    expect(entry.actorName).toBe('Unassigned')
  })

  it('fetches team members first when they are not already loaded', async () => {
    mockApi.get.mockResolvedValueOnce(teamMembersResponse([{ id: 1, name: 'Alice', email: 'a@example.com' }]))
    mockApi.get.mockResolvedValueOnce(auditResponse([]))

    const { fetchDealStageHistory } = useDealStageHistory()
    await fetchDealStageHistory(1)

    expect(mockApi.get).toHaveBeenNthCalledWith(1, '/team-members')
    expect(mockApi.get).toHaveBeenNthCalledWith(2, '/audit-log', expect.anything())
  })

  it('does not re-fetch team members when they are already loaded', async () => {
    useTeamMembersStore().items = [{ id: 1, name: 'Alice', email: 'a@example.com' }]
    mockApi.get.mockResolvedValueOnce(auditResponse([]))

    const { fetchDealStageHistory } = useDealStageHistory()
    await fetchDealStageHistory(1)

    expect(mockApi.get).toHaveBeenCalledTimes(1)
    expect(mockApi.get).toHaveBeenCalledWith('/audit-log', expect.anything())
  })
})
