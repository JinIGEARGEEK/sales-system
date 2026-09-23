<template>
  <button
    type="button"
    class="group relative flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border bg-white p-2.5 text-left shadow-xs transition duration-150 hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-info-toast) motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    :class="[
      selected ? 'border-(--zone-color) ring-2 ring-(--zone-color)/25' : 'border-(--color-card-border)',
      dimmed ? 'opacity-35 saturate-50 hover:opacity-100 hover:saturate-100' : '',
    ]"
    :style="{ '--zone-color': zoneColor, ...(stale ? { borderLeft: '3px solid var(--color-warning-hover)' } : {}) }"
    :aria-label="ariaLabel"
    :data-cy="`overview-card-${zone}-${card.id}`"
    @click="emit('select')"
  >
    <div class="flex items-start gap-2">
      <p class="line-clamp-2 flex-1 text-sm leading-snug font-medium">{{ card.name || '—' }}</p>
      <UTooltip :text="ownerName">
        <span
          class="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
          :style="{ background: ownerColor }"
        >{{ ownerInitials }}</span>
      </UTooltip>
    </div>
    <p v-if="card.company_name" class="flex items-center gap-1 truncate text-xs text-(--color-dark-gray)" :title="card.company_name">
      <UIcon name="material-symbols:apartment" class="size-3.5 shrink-0 text-(--color-gray)" />
      <span class="truncate">{{ card.company_name }}</span>
    </p>
    <p v-if="zone === 'deal'" class="flex items-baseline gap-1.5">
      <span class="text-sm font-semibold tabular-nums">{{ t('global.currencySymbol') }}{{ priceFormatCompact(card.value) }}</span>
      <span v-if="card.probability !== null && !lane.terminal" class="text-[11px] text-(--color-gray) tabular-nums">· {{ card.probability }}%</span>
    </p>
    <p v-if="lostReasonLabel" class="flex items-center gap-1 text-xs text-(--color-chart-lost)">
      <UIcon name="material-symbols:info-outline" class="size-3.5 shrink-0" />
      {{ lostReasonLabel }}
    </p>
    <div class="flex flex-wrap items-center gap-1.5">
      <span
        v-if="lane.terminal"
        class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px]"
        :class="lane.kind === 'lost' ? 'bg-(--color-error-bg) text-(--color-chart-lost)' : 'bg-(--color-success-bg) text-(--color-accent-green)'"
      >
        <UIcon :name="lane.kind === 'lost' ? 'material-symbols:close' : 'material-symbols:check'" class="size-3" />
        {{ days === 0 ? t('crm.overviewPipeline.card.closedToday', { stage: lane.name }) : t('crm.overviewPipeline.card.closedAgo', { stage: lane.name, days }) }}
      </span>
      <template v-else>
        <span
          class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] tabular-nums"
          :class="stale ? 'bg-(--color-warning-bg) font-medium text-(--color-warning-hover)' : 'bg-(--color-light-gray-1) text-(--color-dark-gray)'"
        >
          <UIcon :name="stale ? 'material-symbols:schedule-outline' : 'material-symbols:hourglass-empty'" class="size-3" />
          {{ t('crm.overviewPipeline.card.daysInStage', { days }) }}
        </span>
        <span v-if="moved" class="inline-flex items-center gap-0.5 rounded-full bg-(--color-info-toast)/12 px-1.5 py-px text-[11px] text-(--color-info-toast)">
          <UIcon name="material-symbols:arrow-upward" class="size-3" />
          {{ t('crm.overviewPipeline.legend.moved') }}
        </span>
      </template>
      <UTooltip v-if="card.from_prospect" :text="t('crm.overviewPipeline.card.fromProspectHint')">
        <span class="inline-flex items-center gap-0.5 rounded-full bg-(--color-chart-violet)/10 px-1.5 py-px text-[11px] text-(--color-chart-violet)">
          <UIcon name="material-symbols:contact-mail-outline" class="size-3" />
          {{ t('crm.overviewPipeline.card.fromProspect') }}
        </span>
      </UTooltip>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { lostReasonLabel as labelForLostReason } from '~/constants/mockData'
import { CHART_CATEGORICAL_COLOR_VARS, OVERVIEW_ZONES } from '~/constants/ui'
import { daysInStage, isStaleCard, movedInPeriod, type OverviewDateRange } from '~/composables/utils/usePipelineOverview'

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
const { priceFormatCompact } = useFormatter()
const teamMembersStore = useTeamMembersStore()

const zoneColor = computed(() => OVERVIEW_ZONES[props.zone].color)
const days = computed(() => daysInStage(props.card))
const stale = computed(() => !props.lane.terminal && isStaleCard(props.card))
const moved = computed(() => !props.lane.terminal && movedInPeriod(props.card, props.period))
const lostReasonLabel = computed(() => (props.card.lost_reason ? labelForLostReason(props.card.lost_reason) : ''))
const ownerName = computed(() => props.card.assigned_to ? teamMembersStore.nameById(props.card.assigned_to) : t('crm.overviewPipeline.card.unassigned'))
const ownerInitials = computed(() => {
  if (!props.card.assigned_to) return '–'
  return ownerName.value.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('')
})
// A stable color per owner (by user id) so a reviewer can spot one person's
// cards across the board at a glance; unassigned stays neutral gray.
const ownerColor = computed(() => props.card.assigned_to
  ? CHART_CATEGORICAL_COLOR_VARS[props.card.assigned_to % CHART_CATEGORICAL_COLOR_VARS.length]
  : 'var(--color-gray)')
const ariaLabel = computed(() => [props.card.name, props.card.company_name, props.lane.name, ownerName.value].filter(Boolean).join(', '))
</script>
