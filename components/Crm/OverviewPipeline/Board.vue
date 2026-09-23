<template>
  <div>
    <!-- Phone width: one zone at a time, picked here; the full three-zone
    board only fits from sm up. -->
    <div class="mb-3 sm:hidden">
      <CrmStatusPill v-model="mobileZone" :options="zoneTabOptions" class="flex-wrap" />
    </div>

    <div ref="scroller" class="overflow-x-auto scroll-smooth pb-2 motion-reduce:scroll-auto">
      <div class="flex flex-col gap-3 sm:w-max sm:flex-row sm:items-stretch">
        <section
          v-for="zone in zones"
          :id="`overview-zone-${zone.key}`"
          :key="zone.key"
          class="scroll-ml-1 flex-col rounded-xl border sm:flex"
          :class="[mobileZone === zone.key ? 'flex' : 'hidden', isCollapsed(zone.key) ? 'sm:w-14' : '']"
          :style="zoneStyle(zone.key)"
          :aria-label="t(`crm.overviewPipeline.zones.${zone.key}`)"
          :data-cy="`overview-zone-${zone.key}`"
        >
          <header
            class="flex items-center gap-2 rounded-t-xl border-b px-3 py-2.5"
            :class="isCollapsed(zone.key) ? 'sm:h-full sm:flex-col sm:rounded-xl sm:border-b-0 sm:px-1.5 sm:py-3' : ''"
            :style="{ borderColor: tint(zone.key, 22), background: tint(zone.key, 10) }"
          >
            <span
              class="grid size-7 shrink-0 place-items-center rounded-lg text-white"
              :style="{ background: OVERVIEW_ZONES[zone.key].color }"
            >
              <UIcon :name="OVERVIEW_ZONES[zone.key].icon" class="size-4" />
            </span>
            <div class="flex min-w-0 items-baseline gap-2" :class="isCollapsed(zone.key) ? 'sm:rotate-180 sm:flex-row-reverse sm:[writing-mode:vertical-rl]' : ''">
              <p class="text-sm font-semibold" :style="{ color: `color-mix(in oklab, ${OVERVIEW_ZONES[zone.key].color} 75%, var(--color-black))` }">
                {{ t(`crm.overviewPipeline.zones.${zone.key}`) }}
              </p>
              <span class="text-xs text-(--color-dark-gray) tabular-nums">{{ zoneMeta(zone) }}</span>
            </div>
            <span v-if="!isCollapsed(zone.key)" class="rounded-full bg-white/70 px-2 py-px text-[11px] text-(--color-dark-gray)">
              {{ t(`crm.overviewPipeline.zoneOwner.${zone.key}`) }}
            </span>
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
                class="hidden sm:inline-flex"
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

          <!-- items-start: each lane is as tall as its cards, so an empty
          Won/Lost column doesn't stretch into a tall blank block. -->
          <div v-if="!isCollapsed(zone.key)" class="flex flex-1 flex-col gap-2.5 p-2.5 sm:flex-row sm:items-start">
            <div
              v-for="lane in zone.lanes"
              :key="lane.name"
              class="flex w-full flex-col overflow-hidden rounded-lg border sm:w-60"
              :class="lane.terminal ? 'border-dashed border-(--color-card-border) bg-(--color-light-gray-1)/70' : 'border-(--color-card-border) bg-white'"
              :data-cy="`overview-lane-${zone.key}-${lane.name}`"
            >
              <div class="h-1" :style="{ background: laneAccent(zone.key, lane) }" />
              <div class="border-b border-(--color-light-gray-2) px-3 pt-2 pb-2">
                <p class="flex items-center gap-1.5 text-sm font-medium">
                  <UIcon
                    v-if="lane.terminal"
                    :name="LANE_KIND_ICONS[lane.kind]"
                    class="size-4 shrink-0"
                    :style="{ color: laneAccent(zone.key, lane) }"
                  />
                  <span class="truncate" :title="lane.name">{{ lane.name }}</span>
                  <span class="ml-auto rounded-full bg-(--color-light-gray-1) px-2 py-px text-xs text-(--color-dark-gray) tabular-nums">{{ numberFormat(lane.count) }}</span>
                </p>
                <div class="mt-1 flex items-center justify-between gap-2 text-xs text-(--color-gray)">
                  <span v-if="zone.key === 'deal'" class="font-semibold text-(--color-black) tabular-nums">{{ t('global.currencySymbol') }}{{ priceFormatCompact(lane.value) }}</span>
                  <span v-else />
                  <span v-if="lane.terminal" class="text-[10.5px] tracking-wide uppercase">{{ t('crm.overviewPipeline.laneInPeriod') }}</span>
                </div>
                <!-- A Deal lane's share of open pipeline value, so the biggest
                money columns stand out without reading every figure. -->
                <UTooltip v-if="zone.key === 'deal' && !lane.terminal" :text="t('crm.overviewPipeline.laneShare', { pct: lanePct(zone, lane) })">
                  <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-(--color-light-gray-2)">
                    <div class="h-full rounded-full" :style="{ width: `${lanePct(zone, lane)}%`, background: OVERVIEW_ZONES.deal.color }" />
                  </div>
                </UTooltip>
              </div>
              <div class="flex flex-col gap-2 overflow-y-auto p-2 sm:max-h-[60vh]">
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
                <p v-if="lane.count === 0" class="flex flex-col items-center gap-1 px-2 py-4 text-center text-xs text-(--color-gray)">
                  <UIcon :name="lane.terminal ? 'material-symbols:event-available-outline' : 'material-symbols:inbox-outline'" class="size-5 opacity-60" />
                  {{ lane.terminal ? t('crm.overviewPipeline.laneEmptyTerminal') : t('crm.overviewPipeline.laneEmptyOpen') }}
                </p>
                <NuxtLink
                  v-if="lane.count > lane.cards.length"
                  :to="OVERVIEW_ZONES[zone.key].path"
                  class="flex items-center justify-center gap-1 rounded-md px-1 py-1.5 text-xs text-(--color-info-toast) hover:bg-(--color-info-toast)/8"
                >
                  {{ t('crm.overviewPipeline.laneMore', { count: numberFormat(lane.count - lane.cards.length), zone: zoneLabel(zone.key) }) }}
                  <UIcon name="material-symbols:arrow-forward" class="size-3.5" />
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

const LANE_KIND_ICONS: Record<PipelineOverviewLaneKind, string> = {
  open: '',
  won: 'material-symbols:trophy-outline',
  converted: 'material-symbols:check-circle-outline',
  lost: 'material-symbols:cancel-outline',
}

// Deals is where a reviewer usually starts, so it's the default on phones.
const mobileZone = ref<string>('deal')
const zoneLabel = (key: PipelineOverviewZoneKey) => t(`crm.overviewPipeline.zones.${key}`)
const zoneTabOptions = computed(() => props.zones.map(z => ({ label: zoneLabel(z.key), value: z.key })))

const isCollapsed = (key: PipelineOverviewZoneKey) => !!props.collapsed[key]
const tint = (key: PipelineOverviewZoneKey, pct: number) => `color-mix(in srgb, ${OVERVIEW_ZONES[key].color} ${pct}%, transparent)`
const zoneStyle = (key: PipelineOverviewZoneKey) => ({
  background: `color-mix(in srgb, ${OVERVIEW_ZONES[key].color} 5%, white)`,
  borderColor: tint(key, 28),
})
const laneAccent = (key: PipelineOverviewZoneKey, lane: PipelineOverviewLane) => {
  if (lane.kind === 'won' || lane.kind === 'converted') return 'var(--color-accent-green)'
  if (lane.kind === 'lost') return 'var(--color-chart-lost)'
  return tint(key, 55)
}

const openDealValue = (zone: PipelineOverviewZone) => zone.lanes.filter(l => !l.terminal).reduce((sum, l) => sum + l.value, 0)
const lanePct = (zone: PipelineOverviewZone, lane: PipelineOverviewLane) => {
  const total = openDealValue(zone)
  return total > 0 ? Math.round((lane.value / total) * 100) : 0
}

const zoneMeta = (zone: PipelineOverviewZone) => {
  const open = zone.lanes.filter(l => !l.terminal)
  const count = open.reduce((sum, l) => sum + l.count, 0)
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
