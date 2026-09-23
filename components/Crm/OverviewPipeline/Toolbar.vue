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
          <UIcon :name="option.icon" class="size-3.5" />
          {{ option.label }}
          <UBadge v-if="option.count !== null" size="xs" variant="subtle" :color="option.badgeColor" :label="numberFormat(option.count)" />
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
        <ul class="flex max-w-xs flex-col gap-2.5 p-3 text-xs text-(--color-dark-gray)">
          <li class="flex gap-2">
            <UBadge class="h-fit shrink-0" size="xs" variant="subtle" color="info" icon="material-symbols:arrow-upward" :label="t('crm.overviewPipeline.legend.moved')" />
            {{ t('crm.overviewPipeline.legend.movedHint') }}
          </li>
          <li class="flex gap-2">
            <UBadge class="h-fit shrink-0" size="xs" variant="subtle" color="warning" icon="material-symbols:schedule-outline" :label="t('crm.overviewPipeline.highlight.stale')" />
            {{ t('crm.overviewPipeline.legend.stale', { days: OVERVIEW_STALE_DAYS }) }}
          </li>
          <li class="flex gap-2">
            <UIcon name="material-symbols:event-available-outline" class="mt-0.5 size-4 shrink-0" />
            {{ t('crm.overviewPipeline.legend.terminal') }}
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
import { OVERVIEW_ZONES } from '~/constants/ui'
import { OVERVIEW_STALE_DAYS, zoneOpenTotals, type OverviewHighlight } from '~/composables/utils/usePipelineOverview'

const props = defineProps<{
  zones: PipelineOverviewZone[]
  highlight: OverviewHighlight
  counts: { stale: number, moved: number }
}>()

const emit = defineEmits<{
  'update:highlight': [value: OverviewHighlight]
  jump: [zone: PipelineOverviewZoneKey]
}>()

const { t } = useI18n()
const { numberFormat } = useFormatter()

const highlightOptions = computed(() => [
  { value: 'all', label: t('crm.overviewPipeline.highlight.all'), icon: 'material-symbols:view-kanban-outline', count: null, badgeColor: 'neutral' as const },
  { value: 'stale', label: t('crm.overviewPipeline.highlight.stale'), icon: 'material-symbols:schedule-outline', count: props.counts.stale, badgeColor: 'warning' as const },
  { value: 'moved', label: t('crm.overviewPipeline.highlight.moved'), icon: 'material-symbols:arrow-upward', count: props.counts.moved, badgeColor: 'info' as const },
])
</script>
