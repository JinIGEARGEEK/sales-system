import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const stage = (id: number, name: string, sortOrder: number, over: Partial<PipelineStage> = {}): PipelineStage => ({
  id, name, sort_order: sortOrder, is_active: true, is_won_stage: false, is_lost_stage: false, created_at: new Date(), ...over,
})

describe('stores/pipelineStages', () => {
  beforeEach(() => usePipelineStagesStore().$reset())

  it('firstOpenStageName is the first active, non-won/lost stage by sort order', () => {
    const store = usePipelineStagesStore()
    store.items = [
      stage(3, 'Won', 0, { is_won_stage: true }),
      stage(2, 'Qualified', 2),
      stage(1, 'Discovery', 1), // the renamed seed "Lead"
      stage(4, 'Retired', 0, { is_active: false }),
    ]
    expect(store.firstOpenStageName).toBe('Discovery')
  })

  it('falls back to the seeded "Lead" name before stages load', () => {
    expect(usePipelineStagesStore().firstOpenStageName).toBe('Lead')
  })

  it('resolves Won/Lost and the implied status by flag, so a renamed stage still counts', () => {
    const store = usePipelineStagesStore()
    store.items = [
      stage(1, 'Discovery', 1),
      stage(2, 'Closed Won', 2, { is_won_stage: true }),
      stage(3, 'Closed Lost', 3, { is_lost_stage: true }),
    ]
    expect(store.isWonStage('Closed Won')).toBe(true)
    expect(store.isLostStage('Closed Lost')).toBe(true)
    expect(store.statusForStage('Closed Won')).toBe('won')
    expect(store.statusForStage('Closed Lost')).toBe('lost')
    expect(store.statusForStage('Discovery')).toBe('open')
  })

  it('falls back to the seeded Won/Lost names before stages load', () => {
    const store = usePipelineStagesStore()
    expect(store.statusForStage('Won')).toBe('won')
    expect(store.statusForStage('Lost')).toBe('lost')
    expect(store.statusForStage('Qualified')).toBe('open')
  })

  it('defaultProbability is the server\'s per-stage default, null when unknown', () => {
    const store = usePipelineStagesStore()
    store.items = [
      stage(1, 'Lead', 1, { default_probability: 10 }),
      stage(2, 'Proposal Sent', 2, { default_probability: 63 }),
      stage(3, 'Won', 3, { is_won_stage: true, default_probability: 100 }),
    ]
    expect(store.defaultProbability('Proposal Sent')).toBe(63)
    expect(store.defaultProbability('Won')).toBe(100)
    expect(store.defaultProbability('Retired')).toBeNull()
  })

  describe('writes', () => {
    afterEach(() => vi.restoreAllMocks())

    it('refetches the list after an update, since every open stage\'s default can shift', async () => {
      const { $api } = useNuxtApp()
      const store = usePipelineStagesStore()
      store.items = [stage(1, 'Lead', 1, { default_probability: 10 }), stage(2, 'Qualified', 2, { default_probability: 90 })]
      vi.spyOn($api, 'patch').mockResolvedValueOnce({ data: { data: stage(2, 'Qualified', 3, { default_probability: 50 }) } })
      const get = vi.spyOn($api, 'get').mockResolvedValueOnce({ data: { data: [
        stage(1, 'Lead', 1, { default_probability: 10 }),
        stage(4, 'Demo', 2, { default_probability: 50 }),
        stage(2, 'Qualified', 3, { default_probability: 90 }),
      ] } })

      await store.update(2, { name: 'Qualified', sort_order: 3, is_active: true, is_won_stage: false, is_lost_stage: false, stale_days: null })

      expect(get).toHaveBeenCalledWith('/admin/pipeline-stages')
      expect(store.defaultProbability('Qualified')).toBe(90)
      expect(store.defaultProbability('Demo')).toBe(50)
    })

    it('keeps the saved stage when the follow-up refetch fails', async () => {
      const { $api } = useNuxtApp()
      const store = usePipelineStagesStore()
      store.items = [stage(1, 'Lead', 1)]
      vi.spyOn($api, 'patch').mockResolvedValueOnce({ data: { data: stage(1, 'Discovery', 1, { default_probability: 10 }) } })
      vi.spyOn($api, 'get').mockRejectedValueOnce(new Error('offline'))

      const updated = await store.update(1, { name: 'Discovery', sort_order: 1, is_active: true, is_won_stage: false, is_lost_stage: false, stale_days: null })

      expect(updated.name).toBe('Discovery')
      expect(store.items[0]?.name).toBe('Discovery')
    })
  })
})
