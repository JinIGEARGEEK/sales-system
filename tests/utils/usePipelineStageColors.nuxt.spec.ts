import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEAL_STAGE_COLORS } from '~/constants/mockData'
import { CHART_CATEGORICAL_COLOR_VARS } from '~/constants/ui'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// Shared by CrmPipelineBoard (the Kanbans) and the Overview Pipeline board,
// so a stage must resolve to the same color through every path below.
describe('usePipelineStageColors', () => {
  beforeEach(() => {
    usePipelineStagesStore().$reset()
    useProspectStagesStore().$reset()
  })

  it('uses the hand-picked color for a default Deal stage', () => {
    const { getColumnColor } = usePipelineStageColors()
    expect(getColumnColor('Negotiation')).toBe(DEAL_STAGE_COLORS.Negotiation)
  })

  it('colors the reserved Prospect "Converted" status as won', () => {
    const { getColumnColor } = usePipelineStageColors()
    expect(getColumnColor('Converted')).toBe(getColumnColor('Won'))
  })

  it('resolves custom Admin stages by their flags, else a stable id-based palette color', () => {
    usePipelineStagesStore().items = [
      { id: 7, name: 'Closed – Signed', sort_order: 9, is_active: true, is_won_stage: true, is_lost_stage: false, created_at: new Date() },
      { id: 9, name: 'Legal Review', sort_order: 4, is_active: true, is_won_stage: false, is_lost_stage: false, created_at: new Date() },
    ]
    useProspectStagesStore().items = [
      { id: 3, name: 'Parked', sort_order: 5, is_active: true, is_disqualified_stage: true, created_at: new Date() },
    ]
    const { getColumnColor } = usePipelineStageColors()
    expect(getColumnColor('Closed – Signed')).toBe(getColumnColor('Won'))
    expect(getColumnColor('Parked')).toBe(getColumnColor('Lost'))
    expect(getColumnColor('Legal Review')).toBe(CHART_CATEGORICAL_COLOR_VARS[9 % CHART_CATEGORICAL_COLOR_VARS.length])
  })

  it('gives a known stage a translated description and an unknown one none', () => {
    const { getStageDescription } = usePipelineStageColors()
    expect(getStageDescription('Won')).toBe('crm.components.pipelineBoard.stageDescriptions.won')
    expect(getStageDescription('Legal Review')).toBe('')
  })
})
