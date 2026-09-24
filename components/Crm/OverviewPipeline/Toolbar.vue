<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2" data-cy="overview-toolbar">
    <div class="flex flex-wrap items-center gap-2" role="group" :aria-label="t('crm.overviewPipeline.highlight.label')">
      <span class="text-xs font-medium text-(--color-dark-gray)">{{ t('crm.overviewPipeline.highlight.label') }}</span>
      <CrmStatusPill
        :model-value="highlight"
        :options="highlightOptions"
        class="flex-wrap [&>button]:whitespace-nowrap"
        @update:model-value="emit('update:highlight', $event as OverviewHighlight)"
      >
        <template #option="{ option }">
          <!-- The tooltip spells out each mode's timing rule (e.g. what
          "stale" is counted from), the question a reviewer asks first. -->
          <UTooltip :text="option.hint" :content="{ side: 'bottom' }" :ui="MULTILINE_TOOLTIP_UI">
            <span class="inline-flex items-center gap-1.5">
              <UIcon :name="option.icon" class="size-3.5" />
              {{ option.label }}
              <UBadge v-if="option.count !== null" size="xs" variant="subtle" :color="option.badgeColor" :label="numberFormat(option.count)" />
            </span>
          </UTooltip>
        </template>
      </CrmStatusPill>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-medium text-(--color-dark-gray)">{{ t('crm.overviewPipeline.jumpTo') }}</span>
      <!-- Actions, not a selection, so plain buttons in CrmStatusPill's
      inactive style rather than the pill group itself. -->
      <button
        v-for="zone in zones"
        :key="zone.key"
        type="button"
        class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-(--ui-radius) border border-(--color-light-gray-2) bg-white px-3 text-sm whitespace-nowrap transition-colors hover:bg-(--color-light-gray-1)"
        @click="emit('jump', zone.key)"
      >
        <span class="size-2 rounded-full" :style="{ background: OVERVIEW_ZONES[zone.key].color }" />
        {{ t(`crm.overviewPipeline.zones.${zone.key}`) }}
        <span class="text-(--color-gray) tabular-nums">{{ numberFormat(zoneOpenTotals(zone).count) }}</span>
      </button>
    </div>

    <UPopover class="ml-auto">
      <UButton color="neutral" variant="link" size="sm" icon="material-symbols:help-outline" :label="t('crm.overviewPipeline.howToRead')" />
      <template #content>
        <ul class="flex max-w-sm flex-col gap-2.5 p-3 text-xs text-(--color-dark-gray)">
          <li class="flex gap-2">
            <UBadge class="h-fit shrink-0" size="xs" variant="subtle" color="info" icon="material-symbols:swap-vert" :label="t('crm.overviewPipeline.highlight.moved')" />
            {{ movedHint }}
          </li>
          <li class="flex gap-2">
            <UBadge class="h-fit shrink-0" size="xs" variant="subtle" color="error" icon="material-symbols:arrow-downward" :label="t('crm.overviewPipeline.highlight.slipped')" />
            {{ slippedHint }}
          </li>
          <li class="flex gap-2">
            <UBadge class="h-fit shrink-0" size="xs" variant="subtle" color="warning" icon="material-symbols:schedule-outline" :label="t('crm.overviewPipeline.highlight.stale')" />
            {{ staleHint }}
          </li>
          <li class="flex gap-2">
            <UIcon name="material-symbols:event-available-outline" class="mt-0.5 size-4 shrink-0" />
            {{ t('crm.overviewPipeline.legend.terminal') }}
          </li>
          <li class="flex gap-2">
            <UIcon name="material-symbols:help-outline" class="mt-0.5 size-4 shrink-0" />
            {{ t('crm.overviewPipeline.legend.other') }}
          </li>
          <li class="flex gap-2">
            <UIcon name="material-symbols:drag-pan" class="mt-0.5 size-4 shrink-0" />
            {{ t('crm.overviewPipeline.legend.boards') }}
          </li>
        </ul>
      </template>
    </UPopover>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MULTILINE_TOOLTIP_UI, OVERVIEW_ZONES } from '~/constants/ui'
import { OVERVIEW_STALE_DAYS, zoneOpenTotals, type OverviewDateRange, type OverviewHighlight } from '~/composables/utils/usePipelineOverview'

const props = defineProps<{
  zones: PipelineOverviewZone[]
  highlight: OverviewHighlight
  // Exact board-wide counts from the API (PipelineOverview.highlight).
  counts: { stale: number, moved: number, slipped: number }
  // The selected period, quoted in the "Moved" explanation.
  period: OverviewDateRange
}>()

const emit = defineEmits<{
  'update:highlight': [value: OverviewHighlight]
  jump: [zone: PipelineOverviewZoneKey]
}>()

const { t } = useI18n()
const { numberFormat, dateFormat } = useFormatter()

// One wording for each rule, shared by the button tooltips and the legend.
const staleHint = computed(() => t('crm.overviewPipeline.highlight.staleHint', { days: OVERVIEW_STALE_DAYS }))
const periodDates = computed(() => ({ from: dateFormat(props.period.date_from), to: dateFormat(props.period.date_to) }))
const movedHint = computed(() => t('crm.overviewPipeline.highlight.movedHint', periodDates.value))
const slippedHint = computed(() => t('crm.overviewPipeline.highlight.slippedHint', periodDates.value))

const highlightOptions = computed(() => [
  { value: 'all', label: t('crm.overviewPipeline.highlight.all'), hint: t('crm.overviewPipeline.highlight.allHint'), icon: 'material-symbols:view-kanban-outline', count: null, badgeColor: 'neutral' as const },
  { value: 'stale', label: t('crm.overviewPipeline.highlight.stale'), hint: staleHint.value, icon: 'material-symbols:schedule-outline', count: props.counts.stale, badgeColor: 'warning' as const },
  { value: 'moved', label: t('crm.overviewPipeline.highlight.moved'), hint: movedHint.value, icon: 'material-symbols:swap-vert', count: props.counts.moved, badgeColor: 'info' as const },
  { value: 'slipped', label: t('crm.overviewPipeline.highlight.slipped'), hint: slippedHint.value, icon: 'material-symbols:arrow-downward', count: props.counts.slipped, badgeColor: 'error' as const },
])
</script>
