<template>
  <section
    class="grid overflow-hidden rounded-xl border border-(--color-card-border) bg-white sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
    :aria-label="t('crm.overviewPipeline.heading')"
    data-cy="overview-summary"
  >
    <div
      v-for="(step, index) in steps"
      :key="step.key"
      class="relative flex flex-col gap-0.5 border-b border-(--color-light-gray-2) px-4 py-3 xl:border-r xl:border-b-0"
    >
      <p class="flex items-center gap-1.5 text-xs font-medium tracking-wide text-(--color-dark-gray) uppercase">
        <span class="size-2 rounded-sm" :style="{ background: step.color }" />
        {{ step.label }}
      </p>
      <p class="text-2xl leading-tight font-semibold tabular-nums">
        {{ numberFormat(step.current) }}
        <span v-if="step.extra" class="ml-1 text-sm font-medium text-(--color-dark-gray)">{{ step.extra }}</span>
      </p>
      <div class="flex flex-wrap items-center gap-2 text-xs text-(--color-gray)">
        <span class="rounded-full px-1.5 py-px font-medium" :class="deltaClass(step.current - step.previous)">
          {{ deltaLabel(step.current - step.previous) }}
        </span>
        <span>{{ t('crm.overviewPipeline.vsPrevious', { days: periodDays }) }}</span>
      </div>
      <span
        v-if="index < steps.length - 1"
        class="absolute top-1/2 -right-3.5 z-10 hidden -translate-y-1/2 rounded-full border border-(--color-light-gray-2) bg-white px-1.5 py-px text-[11px] whitespace-nowrap text-(--color-dark-gray) tabular-nums xl:inline"
        :title="t('crm.overviewPipeline.summary.conversionTitle', { from: step.label, to: steps[index + 1]!.label })"
      >
        {{ conversionLabel(step.current, steps[index + 1]!.current) }} →
      </span>
    </div>
    <div class="flex flex-col justify-center gap-0.5 bg-(--color-light-gray-1) px-4 py-3 sm:col-span-2 xl:col-span-1 xl:min-w-52">
      <p class="text-xs font-medium tracking-wide text-(--color-dark-gray) uppercase">{{ t('crm.overviewPipeline.summary.openPipeline') }}</p>
      <p class="text-xl font-semibold tabular-nums">{{ money(summary.open_pipeline.value) }}</p>
      <p class="text-xs text-(--color-gray) tabular-nums">
        {{ t('crm.overviewPipeline.summary.openDeals', { count: numberFormat(summary.open_pipeline.count), value: money(summary.open_pipeline.weighted_value) }) }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { conversionPercent } from '~/composables/utils/usePipelineOverview'
import { OVERVIEW_ZONE_COLORS } from '~/constants/ui'

const props = defineProps<{
  summary: PipelineOverview['summary']
  periodDays: number
}>()

const { t } = useI18n()
const { numberFormat, priceFormatCompact } = useFormatter()
const money = (value: number) => `${t('global.currencySymbol')}${priceFormatCompact(value)}`

const steps = computed(() => [
  { key: 'prospect', label: t('crm.overviewPipeline.summary.newProspects'), color: OVERVIEW_ZONE_COLORS.prospect, ...props.summary.new_prospects, extra: '' },
  { key: 'lead', label: t('crm.overviewPipeline.summary.newLeads'), color: OVERVIEW_ZONE_COLORS.lead, ...props.summary.new_leads, extra: '' },
  { key: 'deal', label: t('crm.overviewPipeline.summary.newDeals'), color: OVERVIEW_ZONE_COLORS.deal, ...props.summary.new_deals, extra: '' },
  { key: 'won', label: t('crm.overviewPipeline.summary.won'), color: 'var(--color-success-toast)', current: props.summary.won.current, previous: props.summary.won.previous, extra: money(props.summary.won.value) },
])

const conversionLabel = (from: number, to: number) => {
  const pct = conversionPercent(from, to)
  return pct === null ? '–' : `${pct}%`
}

const deltaLabel = (delta: number) => {
  if (delta === 0) return t('crm.overviewPipeline.summary.noChange')
  return delta > 0 ? `▲ +${numberFormat(delta)}` : `▼ ${numberFormat(delta)}`
}

const deltaClass = (delta: number) => {
  if (delta > 0) return 'bg-(--color-success-bg) text-(--color-accent-green)'
  if (delta < 0) return 'bg-(--color-error-bg) text-(--color-chart-lost)'
  return 'bg-(--color-light-gray-1) text-(--color-dark-gray)'
}
</script>
