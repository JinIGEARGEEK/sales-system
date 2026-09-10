<template>
  <div class="mb-8">
    <h3 class="mb-3 border-b border-[var(--color-light-gray-2)] pb-2 text-sm font-semibold text-[var(--color-black)]">
      {{ t('crm.dashboard.sectionPipelineOpportunities') }}
    </h3>

    <div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
      <div class="lg:col-span-3">
        <!-- Pipeline by Stage / Sales Funnel / Outcome Split used to be 3
        separate stacked cards (2 of them in their own full-width row below
        this one) — merged into one card with tabs since all three are just
        different views of the same stage_breakdown data, and a rep only
        ever looks at one view at a time. Cuts this section from 4 cards
        across 2 rows down to 2 cards in 1 row. -->
        <UCard class="h-full ring-[var(--color-card-border)]" :ui="{ root: 'flex h-full flex-col', body: 'flex-1' }">
          <template #header>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2">
                <div :class="['flex size-7 shrink-0 items-center justify-center rounded-full', activeTabMeta.iconBg]">
                  <UIcon :name="activeTabMeta.icon" :class="['size-4', activeTabMeta.iconColor]" />
                </div>
                <h3 class="text-lg font-medium">{{ t('crm.dashboard.pipelineAnalytics') }}</h3>
              </div>
              <UTabs v-model="activeTab" :items="tabItems" size="xs" />
            </div>
            <p v-if="activeTabMeta.hint" class="mt-1 text-xs text-[var(--color-gray)]">{{ activeTabMeta.hint }}</p>
          </template>

          <div v-if="activeTab === 'byStage'">
            <div v-if="stageBreakdown.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
              {{ t('crm.dashboard.noPipelineStages') }}
            </div>
            <div v-else class="flex flex-col gap-3">
              <CrmMetricBar
                v-for="row in stageBreakdown"
                :key="row.stage"
                :label="row.stage"
                :percent="row.percent"
                :bar-class="row.barClass"
                :tooltip="`${row.stage}: ${t('global.currencySymbol')}${priceFormatCompact(row.value)} · ${row.count} ${t('crm.dashboard.dealsUnit')}`"
                :to="`/crm/deals?stage=${encodeURIComponent(row.stage)}`"
              >
                <span class="min-w-24 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ t('global.currencySymbol') }}{{ priceFormatCompact(row.value) }}</span>
                <span class="min-w-20 shrink-0 whitespace-nowrap text-right text-xs text-[var(--color-gray)]">{{ row.count }} {{ t('crm.dashboard.dealsUnit') }}</span>
              </CrmMetricBar>
            </div>
          </div>

          <div v-else-if="activeTab === 'funnel'">
            <div v-if="funnelStages.every(stage => stage.value === 0)" class="relative">
              <UBadge color="neutral" variant="subtle" class="absolute inset-e-0 top-0 z-10">{{ t('crm.dashboard.previewBadge') }}</UBadge>
              <div class="opacity-50 grayscale-50">
                <CrmFunnelChart :stages="funnelStagesPreview" />
              </div>
              <p class="mt-2 text-center text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.noDataPreviewHint') }}</p>
            </div>
            <CrmFunnelChart v-else :stages="funnelStages" />
          </div>

          <div v-else>
            <div v-if="outcomeDonutSegments.every(seg => seg.value === 0)" class="relative">
              <UBadge color="neutral" variant="subtle" class="absolute inset-e-0 top-0 z-10">{{ t('crm.dashboard.previewBadge') }}</UBadge>
              <div class="opacity-50 grayscale-50">
                <CrmDonutChart
                  :segments="outcomeDonutSegmentsPreview"
                  :total-label="outcomeTotalPreviewLabel"
                  :total-sub-label="t('crm.dashboard.outcomeSplitTotal')"
                />
              </div>
              <p class="mt-2 text-center text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.noDataPreviewHint') }}</p>
            </div>
            <CrmDonutChart
              v-else
              :segments="outcomeDonutSegments"
              :total-label="`${t('global.currencySymbol')}${priceFormatCompact(outcomeTotal)}`"
              :total-sub-label="t('crm.dashboard.outcomeSplitTotal')"
            />
          </div>
        </UCard>
      </div>

      <div class="lg:col-span-2">
        <UCard class="h-full ring-[var(--color-card-border)]" :ui="{ root: 'flex h-full flex-col', body: 'flex-1' }">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-chart-violet)]/15">
                  <UIcon name="material-symbols:sell-outline" class="size-4 text-[var(--color-chart-violet)]" />
                </div>
                <h3 class="text-lg font-medium">{{ t('crm.dashboard.upsellOpportunities') }}</h3>
              </div>
              <InputSelect
                v-model="upsellMinStaleDays"
                :options="upsellStaleDaysOptions"
                small
                class="w-36"
                name="upsellMinStaleDays"
              />
            </div>
            <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.upsellOpportunitiesHint') }}</p>
          </template>
          <div v-if="upsellCandidates.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.dashboard.noUpsellCandidates') }}
          </div>
          <!-- Capped + scrollable rather than left to grow unbounded — this
          card sits next to the tabbed card above, whose height now varies by
          tab (a long stage list vs. a fixed-size chart), so this list must
          not force the row taller than whichever tab happens to be active. -->
          <div v-else class="flex max-h-96 flex-col gap-2 overflow-y-auto">
            <NuxtLink
              v-for="candidate in upsellCandidates"
              :key="candidate.company.id"
              :to="`/crm/companies/${candidate.company.id}`"
              class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
            >
              <div>
                <p class="text-sm font-medium">{{ candidate.company.name }}</p>
                <p class="text-xs text-[var(--color-gray)]">{{ candidate.company.industry }}</p>
              </div>
              <UBadge :color="candidate.contact.color" variant="subtle">{{ candidate.contact.label }}</UBadge>
            </NuxtLink>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { priceFormatCompact } = useFormatter()

defineProps<{
  stageBreakdown: { stage: string, value: number, count: number, percent: number, barClass: string }[]
  upsellCandidates: { company: Company, contact: { color: string, label: string } }[]
  upsellStaleDaysOptions: Select[]
  funnelStages: { label: string, value: number, barClass?: string }[]
  funnelStagesPreview: { label: string, value: number, barClass?: string }[]
  outcomeDonutSegments: { label: string, value: number, valueLabel: string, colorVar: string, icon: string }[]
  outcomeDonutSegmentsPreview: { label: string, value: number, valueLabel: string, colorVar: string, icon: string }[]
  outcomeTotal: number
  outcomeTotalPreviewLabel: string
}>()

const upsellMinStaleDays = defineModel<number>('upsellMinStaleDays', { required: true })

type AnalyticsTab = 'byStage' | 'funnel' | 'outcome'
const activeTab = ref<AnalyticsTab>('byStage')

const tabItems = computed(() => [
  { label: t('crm.dashboard.pipelineByStage'), value: 'byStage' },
  { label: t('crm.dashboard.salesFunnel'), value: 'funnel' },
  { label: t('crm.dashboard.outcomeSplit'), value: 'outcome' },
])

// Per-tab icon/color/hint in one lookup rather than 3 separate parallel
// computeds — keeps each tab's presentation together instead of spread
// across the file.
const TAB_META: Record<AnalyticsTab, { icon: string, iconBg: string, iconColor: string, hint: string }> = {
  byStage: { icon: 'material-symbols:stacked-bar-chart-outline', iconBg: 'bg-[var(--color-accent-green)]/15', iconColor: 'text-[var(--color-accent-green)]', hint: '' },
  funnel: { icon: 'material-symbols:filter-alt-outline', iconBg: 'bg-[var(--color-info-toast)]/15', iconColor: 'text-[var(--color-info-toast)]', hint: '' },
  outcome: { icon: 'material-symbols:donut-large-outline', iconBg: 'bg-[var(--color-success-toast)]/15', iconColor: 'text-[var(--color-success-toast)]', hint: '' },
}
const activeTabMeta = computed(() => ({
  ...TAB_META[activeTab.value],
  hint: activeTab.value === 'funnel'
    ? t('crm.dashboard.salesFunnelHint')
    : activeTab.value === 'outcome'
      ? t('crm.dashboard.outcomeSplitHint')
      : '',
}))
</script>
