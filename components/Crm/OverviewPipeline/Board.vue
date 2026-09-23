<template>
  <div>
    <!-- Below md (same breakpoint as the Kanban boards): one zone at a time,
    picked here; the three-zone board only fits side by side from md up. -->
    <div class="mb-3 md:hidden">
      <CrmStatusPill v-model="mobileZone" :options="zoneTabOptions" class="flex-wrap" />
    </div>

    <div ref="scroller" class="overflow-x-auto scroll-smooth pb-2 motion-reduce:scroll-auto">
      <div class="flex flex-col gap-4 md:w-max md:flex-row md:items-stretch">
        <section
          v-for="zone in zones"
          :id="`overview-zone-${zone.key}`"
          :key="zone.key"
          class="flex-col rounded-xl border bg-white/45 backdrop-blur-xl md:flex"
          :class="[mobileZone === zone.key ? 'flex' : 'hidden', isCollapsed(zone.key) ? 'md:w-14' : '']"
          :style="{ borderColor: `color-mix(in srgb, ${OVERVIEW_ZONES[zone.key].color} 35%, transparent)` }"
          :aria-label="zoneLabel(zone.key)"
          :data-cy="`overview-zone-${zone.key}`"
        >
          <header
            class="flex items-center gap-2 px-3 py-2.5"
            :class="isCollapsed(zone.key) ? 'md:h-full md:flex-col md:px-1.5 md:py-3' : ''"
          >
            <span class="grid size-7 shrink-0 place-items-center rounded-lg text-white" :style="{ background: OVERVIEW_ZONES[zone.key].color }">
              <UIcon :name="OVERVIEW_ZONES[zone.key].icon" class="size-4" />
            </span>
            <div class="flex min-w-0 items-baseline gap-2" :class="isCollapsed(zone.key) ? 'md:rotate-180 md:flex-row-reverse md:[writing-mode:vertical-rl]' : ''">
              <h3 class="text-base font-black">{{ zoneLabel(zone.key) }}</h3>
              <span class="text-xs text-(--color-gray) tabular-nums">{{ zoneMeta(zone) }}</span>
            </div>
            <UBadge v-if="!isCollapsed(zone.key)" size="sm" variant="subtle" color="neutral" :label="t(`crm.overviewPipeline.zoneOwner.${zone.key}`)" />
            <span v-if="!isCollapsed(zone.key)" class="flex-1" />
            <UTooltip v-if="!isCollapsed(zone.key)" :text="t('crm.overviewPipeline.openBoard', { zone: zoneLabel(zone.key) })">
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="material-symbols:open-in-new"
                :aria-label="t('crm.overviewPipeline.openBoard', { zone: zoneLabel(zone.key) })"
                :to="OVERVIEW_ZONES[zone.key].path"
              />
            </UTooltip>
            <UTooltip :text="t(isCollapsed(zone.key) ? 'crm.overviewPipeline.expand' : 'crm.overviewPipeline.collapse', { zone: zoneLabel(zone.key) })">
              <UButton
                class="hidden md:inline-flex"
                color="neutral"
                variant="ghost"
                size="sm"
                :icon="isCollapsed(zone.key) ? 'material-symbols:left-panel-open-outline' : 'material-symbols:left-panel-close-outline'"
                :aria-expanded="!isCollapsed(zone.key)"
                :aria-label="t(isCollapsed(zone.key) ? 'crm.overviewPipeline.expand' : 'crm.overviewPipeline.collapse', { zone: zoneLabel(zone.key) })"
                @click="emit('toggleCollapse', zone.key)"
              />
            </UTooltip>
          </header>

          <!-- Lanes use the Kanban boards' exact column look (colored header
          with white text + description, stage-tinted glass body), via the
          same usePipelineStageColors(), so a stage reads identically here
          and on its own board. Terminal lanes add an "In period" tag. -->
          <div v-if="!isCollapsed(zone.key)" class="flex flex-1 flex-col gap-4 px-3 pb-3 md:flex-row md:items-stretch">
            <div
              v-for="lane in zone.lanes"
              :key="lane.name"
              class="flex w-full shrink-0 flex-col overflow-hidden rounded-lg border shadow-xl md:w-64"
              :style="{ borderColor: getColumnBorderTint(lane.name) }"
              :data-cy="`overview-lane-${zone.key}-${lane.name}`"
            >
              <div
                class="flex flex-col gap-1 border-b border-white/40 px-3 py-2 backdrop-blur-2xl"
                :style="{ backgroundColor: getColumnHeaderTint(lane.name) }"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex min-w-0 flex-col">
                    <span class="truncate text-sm font-medium text-white" :title="lane.name">{{ lane.name }}</span>
                    <span class="text-[11px] text-white/70">{{ lane.terminal ? t('crm.overviewPipeline.laneInPeriod') : getStageDescription(lane.name) }}</span>
                  </div>
                  <span class="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium text-white tabular-nums">{{ numberFormat(lane.count) }}</span>
                </div>
                <template v-if="zone.key === 'deal'">
                  <span class="text-xs font-semibold text-white tabular-nums">{{ t('global.currencySymbol') }}{{ priceFormatCompact(lane.value) }}</span>
                  <!-- An open Deal lane's share of open pipeline value, so the
                  biggest money columns stand out without reading each figure. -->
                  <UTooltip v-if="!lane.terminal" :text="t('crm.overviewPipeline.laneShare', { pct: lanePct(zone, lane) })">
                    <div class="h-1 overflow-hidden rounded-full bg-white/30">
                      <div class="h-full rounded-full bg-white" :style="{ width: `${lanePct(zone, lane)}%` }" />
                    </div>
                  </UTooltip>
                </template>
              </div>

              <div
                class="flex flex-1 flex-col gap-2 overflow-y-auto p-3 backdrop-blur-xl md:max-h-[62vh]"
                :style="{ backgroundColor: getColumnTint(lane.name) }"
              >
                <CrmOverviewPipelineCard
                  v-for="card in lane.cards"
                  :key="card.id"
                  :card="card"
                  :lane="lane"
                  :zone="zone.key"
                  :period="period"
                  :selected="selectedKey === `${zone.key}:${card.id}`"
                  :dimmed="!cardMatchesHighlight(card, lane, highlight, period)"
                  @select="emit('select', { zone: zone.key, lane, card })"
                />
                <div v-if="lane.count === 0" class="py-4 text-center text-xs text-(--color-gray)">
                  {{ lane.terminal ? t('crm.overviewPipeline.laneEmptyTerminal') : t('crm.overviewPipeline.laneEmptyOpen') }}
                </div>
                <!-- Same dashed "load more" look as the Deals board's
                column-footer button; here it links to the entity's board. -->
                <NuxtLink
                  v-if="lane.count > lane.cards.length"
                  :to="OVERVIEW_ZONES[zone.key].path"
                  class="mt-1 shrink-0 rounded-md border border-dashed border-(--color-light-gray-2) py-1.5 text-center text-xs text-(--color-gray) transition-colors hover:text-(--color-black)"
                >
                  {{ t('crm.overviewPipeline.laneMore', { count: numberFormat(lane.count - lane.cards.length), zone: zoneLabel(zone.key) }) }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { OVERVIEW_ZONES } from '~/constants/ui'
import { cardMatchesHighlight, type OverviewDateRange, type OverviewHighlight } from '~/composables/utils/usePipelineOverview'

const props = defineProps<{
  zones: PipelineOverviewZone[]
  period: OverviewDateRange
  collapsed: Partial<Record<PipelineOverviewZoneKey, boolean>>
  selectedKey?: string | null
  highlight: OverviewHighlight
}>()

const emit = defineEmits<{
  select: [payload: { zone: PipelineOverviewZoneKey, lane: PipelineOverviewLane, card: PipelineOverviewCard }]
  toggleCollapse: [zone: PipelineOverviewZoneKey]
}>()

const { t } = useI18n()
const { numberFormat, priceFormatCompact } = useFormatter()
const { getColumnHeaderTint, getColumnTint, getColumnBorderTint, getStageDescription } = usePipelineStageColors()

// Deals is where a reviewer usually starts, so it's the default on phones.
const mobileZone = ref<string>('deal')
const zoneLabel = (key: PipelineOverviewZoneKey) => t(`crm.overviewPipeline.zones.${key}`)
const zoneTabOptions = computed(() => props.zones.map(z => ({ label: zoneLabel(z.key), value: z.key })))

const isCollapsed = (key: PipelineOverviewZoneKey) => !!props.collapsed[key]

const openDealValue = (zone: PipelineOverviewZone) => zone.lanes.filter(l => !l.terminal).reduce((sum, l) => sum + l.value, 0)
const lanePct = (zone: PipelineOverviewZone, lane: PipelineOverviewLane) => {
  const total = openDealValue(zone)
  return total > 0 ? Math.round((lane.value / total) * 100) : 0
}

const zoneMeta = (zone: PipelineOverviewZone) => {
  const count = zone.lanes.filter(l => !l.terminal).reduce((sum, l) => sum + l.count, 0)
  const label = t('crm.overviewPipeline.zoneOpenCount', { count: numberFormat(count) })
  if (zone.key !== 'deal') return label
  return `${label} · ${t('global.currencySymbol')}${priceFormatCompact(openDealValue(zone))}`
}

// Jump-to from the page's toolbar: on phones switch the visible zone, on
// wider screens scroll the board sideways to it.
const scroller = useTemplateRef<HTMLElement>('scroller')
const jumpTo = (key: PipelineOverviewZoneKey) => {
  mobileZone.value = key
  const target = document.getElementById(`overview-zone-${key}`)
  if (!scroller.value || !target) return
  const offset = target.getBoundingClientRect().left - scroller.value.getBoundingClientRect().left
  scroller.value.scrollTo({ left: scroller.value.scrollLeft + offset - 4 })
}
defineExpose({ jumpTo })
</script>
