<template>
  <!-- Same card anatomy as the Kanban boards (CrmPipelineBoard + the
  Deals/Leads/Prospects pages' #card slots): title, company, value, then an
  owner footer — plus this board's review chips. Not draggable here. -->
  <button
    type="button"
    class="flex min-h-[104px] w-full cursor-pointer flex-col justify-between rounded-lg border bg-white p-3 text-left transition-opacity focus-visible:ring-2 focus-visible:ring-(--color-focus) focus-visible:outline-none"
    :class="[
      selected ? 'border-(--color-primary) ring-2 ring-(--color-primary)/20' : 'border-(--color-card-border)',
      dimmed ? 'opacity-35 hover:opacity-100' : '',
    ]"
    :aria-label="ariaLabel"
    :data-cy="`overview-card-${zone}-${card.id}`"
    @click="emit('select')"
  >
    <div class="w-full">
      <p class="line-clamp-2 text-sm font-medium">{{ card.name || '—' }}</p>
      <p v-if="card.company_name" class="mt-1 truncate text-xs text-(--color-gray)" :title="card.company_name">{{ card.company_name }}</p>
    </div>

    <p v-if="zone === 'deal'" class="mt-2 text-sm font-medium text-(--color-primary) tabular-nums">
      {{ t('global.currencySymbol') }}{{ priceFormatCompact(card.value) }}
      <span v-if="card.probability !== null && !lane.terminal" class="text-xs font-normal text-(--color-gray)">· {{ card.probability }}%</span>
    </p>
    <p v-if="lostReasonLabel" class="mt-1 text-xs text-(--color-chart-lost)">{{ lostReasonLabel }}</p>

    <div class="mt-2 flex flex-wrap items-center gap-1">
      <!-- Each timing badge's tooltip gives this record's own dates, so a
      reviewer can see why it is (or isn't) stale/moved. -->
      <UTooltip v-if="lane.terminal" :text="t('crm.overviewPipeline.card.closedOn', { stage: lane.name, date: enteredOn })" :ui="MULTILINE_TOOLTIP_UI">
        <UBadge
          size="xs"
          variant="subtle"
          :color="lane.kind === 'lost' ? 'error' : 'success'"
          :icon="lane.kind === 'lost' ? 'material-symbols:close' : 'material-symbols:check'"
          :label="days === 0 ? t('crm.overviewPipeline.card.closedToday', { stage: lane.name }) : t('crm.overviewPipeline.card.closedAgo', { stage: lane.name, days })"
        />
      </UTooltip>
      <template v-else>
        <UBadge
          v-if="isOtherLane(lane)"
          size="xs"
          variant="outline"
          color="neutral"
          icon="material-symbols:help-outline"
          :label="t('crm.overviewPipeline.card.actualStage', { stage: stageName })"
        />
        <UTooltip :text="stageTooltip" :ui="MULTILINE_TOOLTIP_UI">
          <UBadge
            size="xs"
            variant="subtle"
            :color="stale ? 'warning' : 'neutral'"
            :icon="stale ? 'material-symbols:schedule-outline' : undefined"
            :label="stale ? `${t('crm.overviewPipeline.highlight.stale')} · ${t('crm.overviewPipeline.card.daysInStage', { days })}` : t('crm.overviewPipeline.card.daysInStage', { days })"
          />
        </UTooltip>
        <UTooltip v-if="moved" :text="movedTooltip" :ui="MULTILINE_TOOLTIP_UI">
          <UBadge
            size="xs"
            variant="subtle"
            :color="card.direction === 'backward' ? 'error' : 'info'"
            :icon="MOVE_ICONS[card.direction]"
            :label="card.direction === 'backward' ? t('crm.overviewPipeline.highlight.slipped') : t('crm.overviewPipeline.highlight.moved')"
          />
        </UTooltip>
      </template>
      <UTooltip v-if="card.from_prospect" :text="t('crm.overviewPipeline.card.fromProspectHint')">
        <UBadge size="xs" variant="outline" color="neutral" icon="material-symbols:contact-mail-outline" :label="t('crm.overviewPipeline.card.fromProspect')" />
      </UTooltip>
    </div>

    <div class="mt-2 flex w-full items-center gap-1.5 border-t border-(--color-light-gray-2) pt-2">
      <UIcon name="material-symbols:person" class="size-3.5 shrink-0 text-(--color-gray)" />
      <p class="truncate text-xs text-(--color-gray)">{{ ownerName }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MULTILINE_TOOLTIP_UI } from '~/constants/ui'
import { lostReasonLabel as labelForLostReason } from '~/constants/mockData'
import { OVERVIEW_STALE_DAYS, daysInStage, isOtherLane, isStaleCard, movedInPeriod, overviewCardStage, type OverviewDateRange } from '~/composables/utils/usePipelineOverview'

const props = defineProps<{
  card: PipelineOverviewCard
  lane: PipelineOverviewLane
  zone: PipelineOverviewZoneKey
  period: OverviewDateRange
  selected?: boolean
  // Faded out because it doesn't match the board's current highlight mode.
  dimmed?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const { t } = useI18n()
const { priceFormatCompact, dateFormat } = useFormatter()
const teamMembersStore = useTeamMembersStore()

const days = computed(() => daysInStage(props.card))
const stale = computed(() => !props.lane.terminal && isStaleCard(props.card, props.lane.stale_days))
const moved = computed(() => !props.lane.terminal && movedInPeriod(props.card, props.period))
// The date this record entered its current lane (falls back to created_at
// for rows that predate stage_entered_at, same as daysInStage).
const enteredOn = computed(() => dateFormat(props.card.stage_entered_at ?? props.card.created_at))
const stageName = computed(() => overviewCardStage(props.card, props.lane, t))
const stageTooltip = computed(() => t(
  stale.value ? 'crm.overviewPipeline.card.staleSince' : 'crm.overviewPipeline.card.stageSince',
  { stage: stageName.value, date: enteredOn.value, days: days.value, limit: props.lane.stale_days || OVERVIEW_STALE_DAYS },
))
// Forward moves point up, slips point down; a move whose direction can't be
// told (out of Lost, or from a retired stage) gets a neutral icon.
const MOVE_ICONS: Record<PipelineOverviewCard['direction'], string> = {
  forward: 'material-symbols:arrow-upward',
  backward: 'material-symbols:arrow-downward',
  '': 'material-symbols:swap-vert',
}
const movedTooltip = computed(() => {
  const from = props.card.previous_stage
  if (!from) return t('crm.overviewPipeline.card.movedOn', { stage: stageName.value, date: enteredOn.value })
  const key = props.card.direction === 'backward' ? 'slippedFrom' : 'movedFrom'
  return t(`crm.overviewPipeline.card.${key}`, { from, stage: stageName.value, date: enteredOn.value })
})
const lostReasonLabel = computed(() => (props.card.lost_reason ? labelForLostReason(props.card.lost_reason) : ''))
const ownerName = computed(() => props.card.assigned_to ? teamMembersStore.nameById(props.card.assigned_to) : t('crm.overviewPipeline.card.unassigned'))
const ariaLabel = computed(() => [props.card.name, props.card.company_name, stageName.value, ownerName.value].filter(Boolean).join(', '))
</script>
