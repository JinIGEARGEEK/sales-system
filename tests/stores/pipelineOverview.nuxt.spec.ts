import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { apiResponse } from '../factories'

// No toast/notify usage in this store, so mocking useNuxtApp wholesale is
// safe here (see CLAUDE.md's note on when it isn't).
const mockApi = { get: vi.fn() }
mockNuxtImport('useNuxtApp', () => () => ({ $api: mockApi }))

const makeOverview = (won: number): PipelineOverview => ({
  period: { date_from: '2026-09-21', date_to: '2026-09-23', prev_date_from: '2026-09-18', prev_date_to: '2026-09-20' },
  summary: {
    new_prospects: { current: 1, previous: 0 },
    new_leads: { current: 1, previous: 0 },
    new_deals: { current: 1, previous: 0 },
    won: { current: won, previous: 0, value: 0, previous_value: 0 },
    open_pipeline: { count: 0, value: 0, weighted_value: 0 },
    conversion: {
      prospect_to_lead: { cohort: 1, converted: 0 },
      lead_to_deal: { cohort: 1, converted: 0 },
      deal_to_won: { cohort: 1, converted: 0 },
    },
  },
  highlight: { stale: 0, moved: 0, slipped: 0, stale_deals: 0, stale_deal_value: 0 },
  zones: [],
})

describe('stores/pipelineOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePipelineOverviewStore().$reset()
  })

  it('fetch loads GET /pipeline/overview with the given params', async () => {
    mockApi.get.mockResolvedValueOnce(apiResponse(makeOverview(2)))
    const store = usePipelineOverviewStore()
    await store.fetch({ date_from: '2026-09-21', date_to: '2026-09-23', assigned_to: '4' })
    expect(mockApi.get).toHaveBeenCalledWith('/pipeline/overview', { params: { date_from: '2026-09-21', date_to: '2026-09-23', assigned_to: '4' } })
    expect(store.data?.summary.won.current).toBe(2)
    expect(store.loading).toBe(false)
  })

  it('ignores a slower, older response that lands after a newer one', async () => {
    let resolveOld!: (v: unknown) => void
    mockApi.get
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
      .mockResolvedValueOnce(apiResponse(makeOverview(5)))
    const store = usePipelineOverviewStore()
    const older = store.fetch({ search: 'a' })
    await store.fetch({ search: 'ab' })
    resolveOld(apiResponse(makeOverview(1)))
    await older
    expect(store.data?.summary.won.current).toBe(5)
    expect(store.loading).toBe(false)
  })
})
