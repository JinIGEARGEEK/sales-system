<template>
  <div>
    <!-- Phone width: one zone at a time, picked here; the full three-zone
    board only fits from sm up. -->
    <div class="mb-3 sm:hidden">
      <CrmStatusPill v-model="mobileZone" :options="zoneTabOptions" />
    </div>

    <div class="overflow-x-auto pb-2">
      <div class="flex flex-col gap-3 sm:w-max sm:flex-row sm:items-stretch">
        <section
          v-for="zone in zones"
          :key="zone.key"
          class="flex-col rounded-xl border sm:flex"
          :class="[mobileZone === zone.key ? 'flex' : 'hidden', isCollapsed(zone.key) ? 'sm:w-14' : '']"
          :style="zoneStyle(zone.key)"
          :aria-label="t(`crm.overviewPipeline.zones.${zone.key}`)"
          :data-cy="`overview-zone-${zone.key}`"
        >
          <div
            class="flex items-center gap-2 border-b px-3 py-2"
            :class="isCollapsed(zone.key) ? 'sm:h-full sm:flex-col sm:border-b-0 sm:px-1.5 sm:py-3' : ''"
            :style="{ borderColor: tint(zone.key, 22) }"
          >
            <p
              class="flex items-center gap-1.5 text-sm font-semibold"
              :class="isCollapsed(zone.key) ? 'sm:rotate-180 sm:[writing-mode:vertical-rl]' : ''"
              :style="{ color: `color-mix(in oklab, ${OVERVIEW_ZONE_COLORS[zone.key]} 80%, var(--color-black))` }"
            >
              <UIcon :name="ZONE_ICONS[zone.key]" class="size-4.5" />
              {{ t(`crm.overviewPipeline.zones.${zone.key}`) }}
            </p>
            <span
              class="text-xs text-(--color-dark-gray) tabular-nums"
              :class="isCollapsed(zone.key) ? 'sm:rotate-180 sm:[writing-mode:vertical-rl]' : ''"
            >{{ zoneMeta(zone) }}</span>
            <span v-if="!isCollapsed(zone.key)" class="rounded-full border border-(--color-card-border) px-2 py-px text-[11px] text-(--color-gray)">
              {{ t(`crm.overviewPipeline.zoneOwner.${zone.key}`) }}
            </span>
            <span v-if="!isCollapsed(zone.key)" class="flex-1" />
            <UButton
              v-if="!isCollapsed(zone.key)"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="material-symbols:open-in-new"
              :aria-label="t('crm.overviewPipeline.openBoard', { zone: t(`crm.overviewPipeline.zones.${zone.key}`) })"
              :title="t('crm.overviewPipeline.openBoard', { zone: t(`crm.overviewPipeline.zones.${zone.key}`) })"
              @click="navigateTo(ZONE_PATHS[zone.key])"
            />
            <UButton
              class="hidden sm:inline-flex"
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="isCollapsed(zone.key) ? 'material-symbols:left-panel-open-outline' : 'material-symbols:left-panel-close-outline'"
              :aria-expanded="!isCollapsed(zone.key)"
              :aria-label="t(isCollapsed(zone.key) ? 'crm.overviewPipeline.expand' : 'crm.overviewPipeline.collapse', { zone: t(`crm.overviewPipeline.zones.${zone.key}`) })"
              :title="t(isCollapsed(zone.key) ? 'crm.overviewPipeline.expand' : 'crm.overviewPipeline.collapse', { zone: t(`crm.overviewPipeline.zones.${zone.key}`) })"
              @click="emit('toggleCollapse', zone.key)"
            />
          </div>

          <div v-if="!isCollapsed(zone.key)" class="flex flex-1 flex-col gap-2.5 p-2.5 sm:flex-row">
            <div
              v-for="lane in zone.lanes"
              :key="lane.name"
              class="flex w-full flex-col rounded-lg border sm:w-60"
              :class="lane.terminal ? 'border-dashed border-(--color-card-border) bg-(--color-light-gray-1)/70' : 'border-(--color-card-border) bg-white'"
              :data-cy="`overview-lane-${zone.key}-${lane.name}`"
            >
              <div class="border-b border-(--color-light-gray-2) px-3 pt-2.5 pb-2">
                <p class="flex items-center gap-1.5 text-sm font-medium">
                  <UIcon
                    v-if="lane.terminal"
                    :name="lane.kind === 'lost' ? 'material-symbols:cancel-outline' : 'material-symbols:check-circle-outline'"
                    class="size-4"
                    :class="lane.kind === 'lost' ? 'text-(--color-chart-lost)' : 'text-(--color-accent-green)'"
                  />
                  <span class="truncate" :title="lane.name">{{ lane.name }}</span>
                  <span class="ml-auto rounded-full bg-(--color-light-gray-1) px-2 py-px text-xs text-(--color-dark-gray) tabular-nums">{{ numberFormat(lane.count) }}</span>
                </p>
                <p class="mt-0.5 flex justify-between gap-2 text-xs text-(--color-gray)">
                  <span v-if="zone.key === 'deal'" class="font-semibold text-(--color-black) tabular-nums">{{ t('global.currencySymbol') }}{{ priceFormatCompact(lane.value) }}</span>
                  <span v-else />
                  <span v-if="lane.terminal" class="text-[10.5px] tracking-wide uppercase">{{ t('crm.overviewPipeline.laneInPeriod') }}</span>
                </p>
              </div>
              <div class="flex flex-1 flex-col gap-2 overflow-y-auto p-2 sm:max-h-[56vh]">
                <CrmOverviewPipelineCard
                  v-for="card in lane.cards"
                  :key="card.id"
                  :card="card"
                  :lane="lane"
                  :zone="zone.key"
                  :period="period"
                  :selected="selectedKey === `${zone.key}:${card.id}`"
                  @select="emit('select', { zone: zone.key, lane, card })"
                />
                <p v-if="lane.count === 0" class="rounded-lg border border-dashed border-(--color-light-gray-2) px-2 py-4 text-center text-xs text-(--color-gray)">
                  {{ lane.terminal ? t('crm.overviewPipeline.laneEmptyTerminal') : t('crm.overviewPipeline.laneEmptyOpen') }}
                </p>
                <NuxtLink
                  v-if="lane.count > lane.cards.length"
                  :to="ZONE_PATHS[zone.key]"
                  class="px-1 py-1 text-center text-xs text-(--color-info-toast) hover:underline"
                >
                  {{ t('crm.overviewPipeline.laneMore', { count: numberFormat(lane.count - lane.cards.length), zone: t(`crm.overviewPipeline.zones.${zone.key}`) }) }}
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
import { OVERVIEW_ZONE_COLORS } from '~/constants/ui'

const props = defineProps<{
  zones: PipelineOverviewZone[]
  period: { date_from: string, date_to: string }
  collapsed: Partial<Record<PipelineOverviewZoneKey, boolean>>
  selectedKey?: string | null
}>()

const emit = defineEmits<{
  select: [payload: { zone: PipelineOverviewZoneKey, lane: PipelineOverviewLane, card: PipelineOverviewCard }]
  toggleCollapse: [zone: PipelineOverviewZoneKey]
}>()

const { t } = useI18n()
const { numberFormat, priceFormatCompact } = useFormatter()

const ZONE_ICONS: Record<PipelineOverviewZoneKey, string> = {
  prospect: 'material-symbols:contact-mail-outline',
  lead: 'material-symbols:person-search-outline',
  deal: 'material-symbols:handshake-outline',
}
const ZONE_PATHS: Record<PipelineOverviewZoneKey, string> = {
  prospect: '/crm/prospects',
  lead: '/crm/leads',
  deal: '/crm/deals',
}

// Deals is where a reviewer usually starts, so it's the default on phones.
const mobileZone = ref<string>('deal')
const zoneTabOptions = computed(() => props.zones.map(z => ({ label: t(`crm.overviewPipeline.zones.${z.key}`), value: z.key })))

const isCollapsed = (key: PipelineOverviewZoneKey) => !!props.collapsed[key]
const tint = (key: PipelineOverviewZoneKey, pct: number) => `color-mix(in srgb, ${OVERVIEW_ZONE_COLORS[key]} ${pct}%, transparent)`
const zoneStyle = (key: PipelineOverviewZoneKey) => ({
  background: `color-mix(in srgb, ${OVERVIEW_ZONE_COLORS[key]} 6%, white)`,
  borderColor: tint(key, 28),
})

const zoneMeta = (zone: PipelineOverviewZone) => {
  const open = zone.lanes.filter(l => !l.terminal)
  const count = open.reduce((sum, l) => sum + l.count, 0)
  const label = t('crm.overviewPipeline.zoneOpenCount', { count: numberFormat(count) })
  if (zone.key !== 'deal') return label
  const value = open.reduce((sum, l) => sum + l.value, 0)
  return `${label} · ${t('global.currencySymbol')}${priceFormatCompact(value)}`
}
</script>
