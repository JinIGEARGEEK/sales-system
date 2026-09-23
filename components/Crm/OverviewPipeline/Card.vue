<template>
  <button
    type="button"
    class="relative flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border bg-white p-2.5 text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-info-toast)"
    :class="selected ? 'border-(--zone-color) ring-2 ring-(--zone-color)/25' : 'border-(--color-card-border)'"
    :style="{ '--zone-color': zoneColor, ...(stale ? { borderLeft: '3px solid var(--color-warning-hover)' } : {}) }"
    :data-cy="`overview-card-${zone}-${card.id}`"
    @click="emit('select')"
  >
    <p class="line-clamp-2 text-sm leading-snug font-medium">{{ card.name || '—' }}</p>
    <p v-if="card.company_name" class="flex items-center gap-1 truncate text-xs text-(--color-dark-gray)" :title="card.company_name">
      <UIcon name="material-symbols:apartment-outline" class="size-3.5 shrink-0 text-(--color-gray)" />
      <span class="truncate">{{ card.company_name }}</span>
    </p>
    <p v-if="lostReasonLabel" class="text-xs text-(--color-dark-gray) italic">{{ lostReasonLabel }}</p>
    <div class="flex flex-wrap items-center gap-1.5">
      <span v-if="zone === 'deal'" class="text-sm font-semibold tabular-nums">{{ t('global.currencySymbol') }}{{ priceFormatCompact(card.value) }}</span>
      <template v-if="lane.terminal">
        <span class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px]" :class="lane.kind === 'lost' ? 'bg-(--color-error-bg) text-(--color-chart-lost)' : 'bg-(--color-success-bg) text-(--color-accent-green)'">
          <UIcon :name="lane.kind === 'lost' ? 'material-symbols:close' : 'material-symbols:check'" class="size-3" />
          {{ days === 0 ? t('crm.overviewPipeline.card.closedToday', { stage: lane.name }) : t('crm.overviewPipeline.card.closedAgo', { stage: lane.name, days }) }}
        </span>
      </template>
      <template v-else>
        <span
          class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] tabular-nums"
          :class="stale ? 'bg-(--color-warning-bg) text-(--color-warning-hover)' : 'bg-(--color-light-gray-1) text-(--color-dark-gray)'"
        >
          <UIcon v-if="stale" name="material-symbols:schedule-outline" class="size-3" />
          {{ t('crm.overviewPipeline.card.daysInStage', { days }) }}
        </span>
        <span v-if="moved" class="inline-flex items-center gap-0.5 rounded-full bg-(--color-info-toast)/12 px-1.5 py-px text-[11px] text-(--color-info-toast)">
          <UIcon name="material-symbols:arrow-upward" class="size-3" />
          {{ t('crm.overviewPipeline.legend.moved') }}
        </span>
      </template>
      <span
        v-if="card.from_prospect"
        class="rounded-full bg-(--color-chart-violet)/10 px-1.5 py-px text-[11px] text-(--color-chart-violet)"
        :title="t('crm.overviewPipeline.card.fromProspectHint')"
      >{{ t('crm.overviewPipeline.card.fromProspect') }}</span>
      <span
        class="ml-auto grid size-5.5 shrink-0 place-items-center rounded-full bg-(--color-dark-gray) text-[9.5px] font-semibold text-white"
        :title="ownerName"
      >{{ ownerInitials }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LOST_REASON_OPTIONS } from '~/constants/mockData'
import { OVERVIEW_ZONE_COLORS } from '~/constants/ui'
import { daysInStage, isStaleCard, movedInPeriod } from '~/composables/utils/usePipelineOverview'

const props = defineProps<{
  card: PipelineOverviewCard
  lane: PipelineOverviewLane
  zone: PipelineOverviewZoneKey
  period: { date_from: string, date_to: string }
  selected?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const { t } = useI18n()
const { priceFormatCompact } = useFormatter()
const teamMembersStore = useTeamMembersStore()

const zoneColor = computed(() => OVERVIEW_ZONE_COLORS[props.zone])
const days = computed(() => daysInStage(props.card))
const stale = computed(() => !props.lane.terminal && isStaleCard(props.card))
const moved = computed(() => !props.lane.terminal && movedInPeriod(props.card, props.period))
const lostReasonLabel = computed(() => {
  if (!props.card.lost_reason) return ''
  return String(LOST_REASON_OPTIONS.find(o => o.value === props.card.lost_reason)?.label ?? props.card.lost_reason)
})
const ownerName = computed(() => props.card.assigned_to ? teamMembersStore.nameById(props.card.assigned_to) : t('crm.overviewPipeline.card.unassigned'))
const ownerInitials = computed(() => {
  if (!props.card.assigned_to) return '–'
  return ownerName.value.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('')
})
</script>
