<template>
  <div class="mb-8">
    <DashboardSectionHeader :title="t('crm.dashboard.sectionPipelineOpportunities')" />

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
            <p v-if="activeTabMeta.hint" class="mt-1 text-xs text-(--color-gray)">{{ activeTabMeta.hint }}</p>
          </template>

          <!-- The "Pipeline by Stage" bar chart that used to be this card's
          first tab was dropped 2026-09-25: it duplicated the Overview
          Pipeline page (/crm/overview-pipeline), which the dashboard now
          links to instead (DashboardOverviewPipelineLink). -->
          <div v-if="activeTab === 'funnel'">
            <div v-if="funnelStages.every(stage => stage.value === 0)" class="relative">
              <UBadge color="neutral" variant="subtle" class="absolute inset-e-0 top-0 z-10">{{ t('crm.dashboard.previewBadge') }}</UBadge>
              <div class="opacity-50 grayscale-50">
                <CrmFunnelChart :stages="funnelStagesPreview" />
              </div>
              <p class="mt-2 text-center text-xs text-(--color-gray)">{{ t('crm.dashboard.noDataPreviewHint') }}</p>
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
              <p class="mt-2 text-center text-xs text-(--color-gray)">{{ t('crm.dashboard.noDataPreviewHint') }}</p>
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
                <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--color-chart-violet)/15">
                  <UIcon name="material-symbols:sell-outline" class="size-4 text-(--color-chart-violet)" />
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
            <p class="mt-1 text-xs text-(--color-gray)">{{ t('crm.dashboard.upsellOpportunitiesHint') }}</p>
          </template>
          <div v-if="upsellCandidates.length === 0" class="py-6 text-center text-sm text-(--color-gray)">
            {{ t('crm.dashboard.noUpsellCandidates') }}
          </div>
          <!-- Capped + scrollable rather than left to grow unbounded — this
          card sits next to the tabbed card above, whose height now varies by
          tab (a long stage list vs. a fixed-size chart), so this list must
          not force the row taller than whichever tab happens to be active. -->
          <div v-else class="flex max-h-96 flex-col gap-2 overflow-y-auto scrollbar-hide">
            <NuxtLink
              v-for="candidate in upsellCandidates"
              :key="candidate.company.id"
              :to="`/crm/companies/${candidate.company.id}`"
              class="flex items-center justify-between gap-2 rounded-lg border border-(--color-light-gray-2) px-4 py-3 hover:bg-(--color-light-gray-1)"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ candidate.company.name }}</p>
                <p class="truncate text-xs text-(--color-gray)">{{ candidate.company.industry }}</p>
              </div>
              <UBadge :color="candidate.contact.color" variant="subtle" class="w-28 shrink-0 justify-center truncate whitespace-nowrap">{{ candidate.contact.label }}</UBadge>
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

type AnalyticsTab = 'funnel' | 'outcome'
const activeTab = ref<AnalyticsTab>('funnel')

const tabItems = computed(() => [
  { label: t('crm.dashboard.salesFunnel'), value: 'funnel' },
  { label: t('crm.dashboard.outcomeSplit'), value: 'outcome' },
])

// Per-tab icon/color/hint in one lookup rather than 3 separate parallel
// computeds — keeps each tab's presentation together instead of spread
// across the file.
const TAB_META: Record<AnalyticsTab, { icon: string, iconBg: string, iconColor: string, hint: string }> = {
  funnel: { icon: 'material-symbols:filter-alt-outline', iconBg: 'bg-(--color-info-toast)/15', iconColor: 'text-(--color-info-toast)', hint: '' },
  outcome: { icon: 'material-symbols:donut-large-outline', iconBg: 'bg-(--color-success-toast)/15', iconColor: 'text-(--color-success-toast)', hint: '' },
}
const activeTabMeta = computed(() => ({
  ...TAB_META[activeTab.value],
  hint: activeTab.value === 'funnel' ? t('crm.dashboard.salesFunnelHint') : t('crm.dashboard.outcomeSplitHint'),
}))
</script>
