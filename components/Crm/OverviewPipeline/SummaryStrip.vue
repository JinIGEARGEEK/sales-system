<template>
  <section
    class="grid grid-cols-2 overflow-hidden rounded-xl border border-(--color-card-border) bg-white lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.25fr)]"
    :aria-label="t('crm.overviewPipeline.heading')"
    data-cy="overview-summary"
  >
    <div
      v-for="(step, index) in steps"
      :key="step.key"
      class="flex min-w-0 flex-col gap-1 border-(--color-light-gray-2) px-4 py-3.5"
      :class="[index % 2 === 0 ? 'border-r' : 'lg:border-r', 'border-b lg:border-b-0']"
    >
      <p class="flex items-center gap-2 text-xs font-medium text-(--color-dark-gray)">
        <span class="grid size-6 shrink-0 place-items-center rounded-md" :style="{ background: `color-mix(in srgb, ${step.color} 16%, transparent)`, color: step.color }">
          <UIcon :name="step.icon" class="size-3.5" />
        </span>
        <span class="truncate">{{ step.label }}</span>
      </p>
      <p class="flex items-baseline gap-2">
        <span class="text-2xl leading-tight font-semibold tabular-nums">{{ numberFormat(step.current) }}</span>
        <span v-if="step.extra" class="truncate text-sm font-semibold tabular-nums" :style="{ color: step.color }">{{ step.extra }}</span>
        <span class="ml-auto shrink-0 rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums" :class="deltaClass(step.current - step.previous)">
          {{ deltaLabel(step.current - step.previous) }}
        </span>
      </p>
      <UTooltip v-if="step.cohort" :text="t('crm.overviewPipeline.summary.cohortHint')" :ui="MULTILINE_TOOLTIP_UI">
        <p class="flex w-fit cursor-help items-center gap-1 text-xs text-(--color-gray) tabular-nums">
          <UIcon name="material-symbols:subdirectory-arrow-right" class="size-3.5 shrink-0" />
          {{ cohortLabel(step.cohort) }}
        </p>
      </UTooltip>
      <p v-else class="text-xs text-(--color-gray)">&nbsp;</p>
    </div>

    <div class="col-span-2 flex min-w-0 flex-col gap-1 bg-(--color-light-gray-1) px-4 py-3.5 lg:col-span-1">
      <p class="flex items-center gap-2 text-xs font-medium text-(--color-dark-gray)">
        <span class="grid size-6 shrink-0 place-items-center rounded-md bg-(--color-primary)/10 text-(--color-primary)">
          <UIcon name="material-symbols:account-balance-wallet-outline" class="size-3.5" />
        </span>
        {{ t('crm.overviewPipeline.summary.openPipeline') }}
      </p>
      <p class="flex flex-wrap items-baseline gap-x-2">
        <span class="text-2xl leading-tight font-semibold tabular-nums">{{ money(summary.open_pipeline.value) }}</span>
        <span class="text-xs text-(--color-gray) tabular-nums">{{ t('crm.overviewPipeline.summary.openDeals', { count: numberFormat(summary.open_pipeline.count), value: money(summary.open_pipeline.weighted_value) }) }}</span>
      </p>
      <UTooltip :text="t('crm.overviewPipeline.summary.weightedShare')">
        <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-(--color-light-gray-2)" role="presentation">
          <div class="h-full rounded-full bg-(--color-accent-green)" :style="{ width: `${weightedPct}%` }" />
        </div>
      </UTooltip>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { conversionPercent } from '~/composables/utils/usePipelineOverview'
import { MULTILINE_TOOLTIP_UI, OVERVIEW_ZONES } from '~/constants/ui'

const props = defineProps<{
  summary: PipelineOverview['summary']
}>()

const { t } = useI18n()
const { numberFormat, priceFormatCompact } = useFormatter()
const money = (value: number) => `${t('global.currencySymbol')}${priceFormatCompact(value)}`

// Each step after the first says how the previous step's new records
// converted into it — a cohort figure, so it can't exceed 100%.
type Cohort = PipelineOverviewCohort & { key: string }
type Step = { key: string, label: string, color: string, icon: string, current: number, previous: number, extra: string, cohort?: Cohort }

const steps = computed<Step[]>(() => {
  const { conversion } = props.summary
  return [
    { key: 'prospect', label: t('crm.overviewPipeline.summary.newProspects'), color: OVERVIEW_ZONES.prospect.color, icon: OVERVIEW_ZONES.prospect.icon, ...props.summary.new_prospects, extra: '' },
    { key: 'lead', label: t('crm.overviewPipeline.summary.newLeads'), color: OVERVIEW_ZONES.lead.color, icon: OVERVIEW_ZONES.lead.icon, ...props.summary.new_leads, extra: '', cohort: { key: 'cohortProspectToLead', ...conversion.prospect_to_lead } },
    { key: 'deal', label: t('crm.overviewPipeline.summary.newDeals'), color: OVERVIEW_ZONES.deal.color, icon: OVERVIEW_ZONES.deal.icon, ...props.summary.new_deals, extra: '', cohort: { key: 'cohortLeadToDeal', ...conversion.lead_to_deal } },
    { key: 'won', label: t('crm.overviewPipeline.summary.won'), color: 'var(--color-success-toast)', icon: 'material-symbols:trophy-outline', current: props.summary.won.current, previous: props.summary.won.previous, extra: money(props.summary.won.value), cohort: { key: 'cohortDealToWon', ...conversion.deal_to_won } },
  ]
})

const weightedPct = computed(() => {
  const { value, weighted_value: weighted } = props.summary.open_pipeline
  return value > 0 ? Math.min(100, Math.round((weighted / value) * 100)) : 0
})

const cohortLabel = (cohort: Cohort) => {
  const text = t(`crm.overviewPipeline.summary.${cohort.key}`, { converted: numberFormat(cohort.converted), cohort: numberFormat(cohort.cohort) })
  const pct = conversionPercent(cohort.cohort, cohort.converted)
  return pct === null ? text : `${text} · ${pct}%`
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
