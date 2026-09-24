import { describe, it, expect, beforeEach } from 'vitest'

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
})
