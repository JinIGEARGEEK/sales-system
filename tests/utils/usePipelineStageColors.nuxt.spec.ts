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

  describe('with an entity', () => {
    it('keeps same-named stages of different entities apart', () => {
      const { getColumnColor, getStageDescription } = usePipelineStageColors()
      // "New" is both a Prospect and a Lead status; "Qualified" both a Lead
      // status and a Deal stage.
      expect(getStageDescription('New', 'lead')).toBe('crm.components.pipelineBoard.stageDescriptions.leadNew')
      expect(getStageDescription('New', 'prospect')).toBe('crm.components.pipelineBoard.stageDescriptions.prospectNew')
      expect(getStageDescription('Qualified', 'lead')).toBe('crm.components.pipelineBoard.stageDescriptions.leadQualified')
      expect(getStageDescription('Qualified', 'deal')).toBe('crm.components.pipelineBoard.stageDescriptions.qualified')
      // Contacted fell through to the flat fallback before.
      expect(getColumnColor('Contacted', 'lead')).not.toBe(getColumnColor('Contacted'))
      expect(getColumnColor('Converted', 'lead')).toBe(getColumnColor('Won', 'deal'))
    })

    it("doesn't let another entity's custom stage color leak in", () => {
      useProspectStagesStore().items = [
        { id: 2, name: 'Follow Up', sort_order: 3, is_active: true, is_disqualified_stage: true, created_at: new Date() },
      ]
      usePipelineStagesStore().items = [
        { id: 11, name: 'Follow Up', sort_order: 3, is_active: true, is_won_stage: false, is_lost_stage: false, created_at: new Date() },
      ]
      const { getColumnColor } = usePipelineStageColors()
      // Name-only lookup checks Prospect first, so a Deal lane would turn red.
      expect(getColumnColor('Follow Up')).toBe(getColumnColor('Lost', 'deal'))
      expect(getColumnColor('Follow Up', 'deal')).toBe(CHART_CATEGORICAL_COLOR_VARS[11 % CHART_CATEGORICAL_COLOR_VARS.length])
      expect(getColumnColor('Follow Up', 'prospect')).toBe(getColumnColor('Lost', 'deal'))
    })

    it('keeps the default stages\' existing colors on the Kanbans', () => {
      const { getColumnColor } = usePipelineStageColors()
      for (const stage of ['Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']) {
        expect(getColumnColor(stage, 'deal')).toBe(getColumnColor(stage))
      }
      for (const status of ['New', 'Engaging', 'Nurturing', 'Disqualified', 'Converted']) {
        expect(getColumnColor(status, 'prospect')).toBe(getColumnColor(status))
      }
    })
  })
})
