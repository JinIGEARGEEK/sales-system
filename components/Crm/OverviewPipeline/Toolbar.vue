<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2" data-cy="overview-toolbar">
    <div class="flex flex-wrap items-center gap-2" role="group" :aria-label="t('crm.overviewPipeline.highlight.label')">
      <span class="text-xs font-medium text-(--color-dark-gray)">{{ t('crm.overviewPipeline.highlight.label') }}</span>
      <button
        v-for="option in highlightOptions"
        :key="option.value"
        type="button"
        class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--ui-radius)] border px-3 text-sm whitespace-nowrap transition-colors"
        :class="highlight === option.value
          ? 'border-(--color-primary) bg-(--color-primary-bg) text-(--color-primary)'
          : 'border-(--color-light-gray-2) bg-white text-(--color-black) hover:bg-(--color-light-gray-1)'"
        :aria-pressed="highlight === option.value"
        @click="emit('update:highlight', option.value)"
      >
        <UIcon :name="option.icon" class="size-3.5" />
        {{ option.label }}
        <UBadge v-if="option.count !== null" size="xs" variant="subtle" :color="option.badgeColor" :label="String(option.count)" />
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-medium text-(--color-dark-gray)">{{ t('crm.overviewPipeline.jumpTo') }}</span>
      <button
        v-for="zone in zones"
        :key="zone.key"
        type="button"
        class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--ui-radius)] border border-(--color-light-gray-2) bg-white px-3 text-sm whitespace-nowrap transition-colors hover:bg-(--color-light-gray-1)"
        @click="emit('jump', zone.key)"
      >
        <span class="size-2 rounded-full" :style="{ background: OVERVIEW_ZONES[zone.key].color }" />
        {{ t(`crm.overviewPipeline.zones.${zone.key}`) }}
        <span class="text-(--color-gray) tabular-nums">{{ openCount(zone) }}</span>
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
            <UBadge class="h-fit shrink-0" size="xs" variant="subtle" color="warning" icon="material-symbols:schedule-outline" :label="t('crm.overviewPipeline.card.daysInStage', { days: OVERVIEW_STALE_DAYS + 1 })" />
            {{ t('crm.overviewPipeline.legend.stale', { days: OVERVIEW_STALE_DAYS }) }}
          </li>
          <li class="flex gap-2">
            <span class="mt-0.5 h-4 w-5 shrink-0 rounded-sm border border-dashed border-(--color-gray)" />
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
import { OVERVIEW_STALE_DAYS, type OverviewHighlight } from '~/composables/utils/usePipelineOverview'

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
  { value: 'all' as const, label: t('crm.overviewPipeline.highlight.all'), icon: 'material-symbols:view-kanban-outline', count: null, badgeColor: 'neutral' as const },
  { value: 'stale' as const, label: t('crm.overviewPipeline.highlight.stale'), icon: 'material-symbols:schedule-outline', count: props.counts.stale, badgeColor: 'warning' as const },
  { value: 'moved' as const, label: t('crm.overviewPipeline.highlight.moved'), icon: 'material-symbols:arrow-upward', count: props.counts.moved, badgeColor: 'info' as const },
])

const openCount = (zone: PipelineOverviewZone) => numberFormat(zone.lanes.filter(l => !l.terminal).reduce((sum, l) => sum + l.count, 0))
</script>
