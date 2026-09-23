import { useI18n } from 'vue-i18n'
import { DEAL_STAGE_COLORS, PROSPECT_CONVERTED_STATUS } from '~/constants/mockData'
import { CHART_CATEGORICAL_COLOR_VARS } from '~/constants/ui'

// Stage column colors and short descriptions shared by every stage-lane
// board — CrmPipelineBoard (the Deals/Leads/Prospects Kanbans) and the
// Overview Pipeline (FR-CRM-123) — so a stage looks the same wherever it
// appears. Moved here verbatim from PipelineBoard.vue.
export const usePipelineStageColors = () => {
  const { t } = useI18n()
  const pipelineStagesStore = usePipelineStagesStore()
  const prospectStagesStore = useProspectStagesStore()

  const FALLBACK_COLOR = 'var(--color-primary)'

  // Column titles (column.label) stay in English regardless of locale — they're the
  // DealStage display names. Only this short description underneath is translated.
  const STAGE_DESCRIPTION_KEYS: Record<DealStage, string> = {
    Lead: 'lead',
    Qualified: 'qualified',
    'Proposal Sent': 'proposalSent',
    Negotiation: 'negotiation',
    Won: 'won',
    Lost: 'lost',
  }

  // Legacy default-name descriptions, kept as a fallback for Prospect's four
  // seeded stage names + the reserved "Converted" status — same accepted
  // limitation Deal's STAGE_DESCRIPTION_KEYS already has: a custom Admin-added
  // stage (Deal or Prospect) simply gets no subtitle, since stage config has no
  // description field of its own.
  const PROSPECT_STATUS_DESCRIPTION_KEYS: Record<string, string> = {
    New: 'prospectNew',
    Engaging: 'prospectEngaging',
    Nurturing: 'prospectNurturing',
    Disqualified: 'prospectDisqualified',
    Converted: 'prospectConverted',
  }

  const getStageDescription = (value: string) => {
    const key = STAGE_DESCRIPTION_KEYS[value as DealStage] || PROSPECT_STATUS_DESCRIPTION_KEYS[value]
    return key ? t(`crm.components.pipelineBoard.stageDescriptions.${key}`) : ''
  }

  const WON_COLOR = '#00C875'
  const LOST_COLOR = '#E2445C'
  // Legacy default colors, kept as a fallback for Prospect's four seeded stage
  // names + the reserved "Converted" status (not a droppable column — see
  // pages/crm/prospects/index.vue — but still needs a color in case a
  // converted Prospect briefly renders before its card is removed from the
  // board). A custom Admin-added Prospect stage has no per-stage color field
  // (ProspectStage, unlike PipelineStage, has no won/lost-style flag to key
  // off either — Prospect stages are a straight funnel sequence), so it falls
  // through to FALLBACK_COLOR, same as an in-between (non-Won/Lost) custom
  // Deal stage already does below.
  const DEFAULT_PROSPECT_STAGE_COLORS: Record<string, string> = {
    New: '#5B5FE9',
    Engaging: '#4A9FE8',
    Nurturing: '#F5A623',
    Disqualified: '#E2445C',
    Converted: '#00C875',
  }

  // Admin-added custom stages have no color field of their own (neither
  // PipelineStage nor ProspectStage stores one — see stores/pipelineStages.ts/
  // prospectStages.ts), so without this every non-won/lost/disqualified custom
  // stage rendered as one flat FALLBACK_COLOR, indistinguishable from any other
  // custom stage on the same board. Hashing the stage's own `id` into the same
  // validated categorical palette used for chart bars/stat-icon chips
  // (`CHART_CATEGORICAL_COLOR_VARS`, `constants/ui.ts`) gives each one a
  // distinct, stable color (stable across reorders/renames, since `id` never
  // changes) without needing a backend schema change, an admin-facing color
  // picker, or a second hand-picked palette to keep in sync with the chart one.
  // Unlike that palette's own "never cycle past 4, 5th+ collapses to fallback"
  // rule (meant for a simultaneously-visible legend/chart), cycling here is
  // harmless — two custom stages sharing a color is a soft, rare degradation
  // (most pipelines have only a couple of custom stages), not a legend
  // ambiguity, so this indexes with modulo instead of falling back past 4.
  const colorForStageId = (id: number) => CHART_CATEGORICAL_COLOR_VARS[id % CHART_CATEGORICAL_COLOR_VARS.length]

  // Prefers the hardcoded DEAL_STAGE_COLORS/DEFAULT_PROSPECT_STAGE_COLORS maps
  // (kept for each board's default columns' exact existing look), then checks
  // prospectStagesStore *before* pipelineStagesStore — a Prospect lane's value
  // is never a Deal stage, but the two admin-configurable tables have no
  // shared namespace, so if a custom Prospect stage happened to share a name
  // with a custom Deal stage (e.g. both renamed to "Follow Up"), checking
  // prospectStagesStore first stops that collision from leaking a Deal's Won/
  // Lost color onto an unrelated Prospect column. Falls back to
  // pipelineStagesStore's is_won_stage/is_lost_stage flags so a custom
  // Admin-added Deal stage still renders won/lost sensibly, and any other
  // custom (in-between) stage gets its own distinct palette color instead of
  // the flat FALLBACK_COLOR.
  const getColumnColor = (value: string) => {
    if (DEAL_STAGE_COLORS[value as DealStage]) return DEAL_STAGE_COLORS[value as DealStage]
    if (DEFAULT_PROSPECT_STAGE_COLORS[value]) return DEFAULT_PROSPECT_STAGE_COLORS[value]
    if (value === PROSPECT_CONVERTED_STATUS) return WON_COLOR
    const prospectStage = prospectStagesStore.byName(value)
    if (prospectStage) return prospectStage.is_disqualified_stage ? LOST_COLOR : colorForStageId(prospectStage.id)
    const dealStage = pipelineStagesStore.byName(value)
    if (dealStage?.is_won_stage) return WON_COLOR
    if (dealStage?.is_lost_stage) return LOST_COLOR
    if (dealStage) return colorForStageId(dealStage.id)
    return FALLBACK_COLOR
  }

  const getColumnHeaderTint = (value: string) => `color-mix(in srgb, ${getColumnColor(value)} 80%, transparent)`

  // A strong, saturated glass tint (not the old barely-there 14% wash) — each
  // lane should read as its own colored panel at a glance, not a near-white
  // card with a faint hint of hue. Kept slightly translucent (88%) so the
  // backdrop-blur still shows some glass-through effect against the page.
  const getColumnTint = (value: string) => {
    const solidTint = `color-mix(in srgb, ${getColumnColor(value)} 32%, white)`
    return `color-mix(in srgb, ${solidTint} 88%, transparent)`
  }

  const getColumnBorderTint = (value: string) => `color-mix(in srgb, ${getColumnColor(value)} 45%, transparent)`

  return { getColumnColor, getColumnHeaderTint, getColumnTint, getColumnBorderTint, getStageDescription }
}
