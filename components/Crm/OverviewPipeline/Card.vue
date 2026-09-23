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
      <UBadge
        v-if="lane.terminal"
        size="xs"
        variant="subtle"
        :color="lane.kind === 'lost' ? 'error' : 'success'"
        :icon="lane.kind === 'lost' ? 'material-symbols:close' : 'material-symbols:check'"
        :label="days === 0 ? t('crm.overviewPipeline.card.closedToday', { stage: lane.name }) : t('crm.overviewPipeline.card.closedAgo', { stage: lane.name, days })"
      />
      <template v-else>
        <UBadge
          size="xs"
          variant="subtle"
          :color="stale ? 'warning' : 'neutral'"
          :icon="stale ? 'material-symbols:schedule-outline' : undefined"
          :label="t('crm.overviewPipeline.card.daysInStage', { days })"
        />
        <UBadge
          v-if="moved"
          size="xs"
          variant="subtle"
          color="info"
          icon="material-symbols:arrow-upward"
          :label="t('crm.overviewPipeline.legend.moved')"
        />
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
import { lostReasonLabel as labelForLostReason } from '~/constants/mockData'
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

const days = computed(() => daysInStage(props.card))
const stale = computed(() => !props.lane.terminal && isStaleCard(props.card))
const moved = computed(() => !props.lane.terminal && movedInPeriod(props.card, props.period))
const lostReasonLabel = computed(() => (props.card.lost_reason ? labelForLostReason(props.card.lost_reason) : ''))
const ownerName = computed(() => props.card.assigned_to ? teamMembersStore.nameById(props.card.assigned_to) : t('crm.overviewPipeline.card.unassigned'))
const ariaLabel = computed(() => [props.card.name, props.card.company_name, props.lane.name, ownerName.value].filter(Boolean).join(', '))
</script>
