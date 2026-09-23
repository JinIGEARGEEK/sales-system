<template>
  <!-- Print-only: the page's own print stylesheet hides everything else and
  shows just this, so "Export PDF" (window.print → Save as PDF) produces a
  one-document summary instead of a screenshot of a horizontally-scrolling
  board. Browser printing also renders Thai names correctly, which the
  backend's PDF export fonts can't. -->
  <div class="overview-print hidden text-[11px] text-black">
    <h1 class="text-lg font-semibold">{{ t('crm.overviewPipeline.heading') }} · {{ periodLabel }}</h1>
    <p class="text-(--color-dark-gray)">
      {{ t('crm.overviewPipeline.print.generated', { date: dateTimeFormat(new Date()) }) }} ·
      {{ filtersLabel ? t('crm.overviewPipeline.print.filters', { filters: filtersLabel }) : t('crm.overviewPipeline.print.noFilters') }}
    </p>

    <table class="mt-3 w-full border-collapse">
      <tbody>
        <tr>
          <td v-for="item in summaryItems" :key="item.label" class="border border-(--color-light-gray-2) px-2 py-1.5 align-top">
            <div class="text-(--color-dark-gray)">{{ item.label }}</div>
            <div class="text-base font-semibold">{{ item.value }}</div>
            <div v-if="item.sub" class="text-(--color-dark-gray)">{{ item.sub }}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <section v-for="zone in data.zones" :key="zone.key" class="mt-4 break-inside-avoid-page">
      <h2 class="mb-1 text-sm font-semibold">{{ t(`crm.overviewPipeline.zones.${zone.key}`) }}</h2>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-(--color-light-gray-1) text-left">
            <th class="w-40 border border-(--color-light-gray-2) px-2 py-1">{{ t('crm.overviewPipeline.print.lane') }}</th>
            <th class="w-16 border border-(--color-light-gray-2) px-2 py-1 text-right">{{ t('crm.overviewPipeline.print.count') }}</th>
            <th v-if="zone.key === 'deal'" class="w-24 border border-(--color-light-gray-2) px-2 py-1 text-right">{{ t('crm.overviewPipeline.print.value') }}</th>
            <th class="border border-(--color-light-gray-2) px-2 py-1">{{ t('crm.overviewPipeline.print.top') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lane in zone.lanes" :key="lane.name" class="break-inside-avoid">
            <td class="border border-(--color-light-gray-2) px-2 py-1">
              {{ lane.name }}<span v-if="lane.terminal" class="text-(--color-dark-gray)"> ({{ t('crm.overviewPipeline.laneInPeriod') }})</span>
            </td>
            <td class="border border-(--color-light-gray-2) px-2 py-1 text-right tabular-nums">{{ numberFormat(lane.count) }}</td>
            <td v-if="zone.key === 'deal'" class="border border-(--color-light-gray-2) px-2 py-1 text-right tabular-nums">{{ money(lane.value) }}</td>
            <td class="border border-(--color-light-gray-2) px-2 py-1">
              <span v-for="(card, index) in lane.cards.slice(0, 5)" :key="card.id">
                {{ index > 0 ? ' · ' : '' }}{{ card.name || '—' }}<template v-if="zone.key === 'deal'"> ({{ money(card.value) }})</template>, {{ daysInStage(card) }}d
              </span>
              <span v-if="lane.count > 5" class="text-(--color-dark-gray)"> · +{{ numberFormat(lane.count - 5) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { conversionPercent, daysInStage } from '~/composables/utils/usePipelineOverview'

const props = defineProps<{
  data: PipelineOverview
  periodLabel: string
  filtersLabel: string
}>()

const { t } = useI18n()
const { numberFormat, priceFormatCompact, dateTimeFormat } = useFormatter()
const money = (value: number) => `${t('global.currencySymbol')}${priceFormatCompact(value)}`

const summaryItems = computed(() => {
  const s = props.data.summary
  const withDelta = (c: PipelineOverviewCompare) => {
    const d = c.current - c.previous
    return `${d > 0 ? '+' : ''}${numberFormat(d)}`
  }
  const rate = (from: number, to: number) => {
    const pct = conversionPercent(from, to)
    return pct === null ? '' : ` · ${pct}% →`
  }
  return [
    { label: t('crm.overviewPipeline.summary.newProspects'), value: numberFormat(s.new_prospects.current), sub: withDelta(s.new_prospects) + rate(s.new_prospects.current, s.new_leads.current) },
    { label: t('crm.overviewPipeline.summary.newLeads'), value: numberFormat(s.new_leads.current), sub: withDelta(s.new_leads) + rate(s.new_leads.current, s.new_deals.current) },
    { label: t('crm.overviewPipeline.summary.newDeals'), value: numberFormat(s.new_deals.current), sub: withDelta(s.new_deals) + rate(s.new_deals.current, s.won.current) },
    { label: t('crm.overviewPipeline.summary.won'), value: `${numberFormat(s.won.current)} · ${money(s.won.value)}`, sub: withDelta(s.won) },
    { label: t('crm.overviewPipeline.summary.openPipeline'), value: money(s.open_pipeline.value), sub: t('crm.overviewPipeline.summary.openDeals', { count: numberFormat(s.open_pipeline.count), value: money(s.open_pipeline.weighted_value) }) },
  ]
})
</script>
