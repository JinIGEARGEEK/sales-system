<template>
  <div class="mb-8">
    <h3 class="mb-3 border-b border-[var(--color-light-gray-2)] pb-2 text-sm font-semibold text-[var(--color-black)]">
      {{ t('crm.dashboard.sectionPipelineOpportunities') }}
    </h3>

    <div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
      <div class="lg:col-span-3">
        <UCard class="h-full ring-[var(--color-card-border)]" :ui="{ root: 'flex h-full flex-col', body: 'flex-1' }">
          <template #header>
            <div class="flex items-center gap-2">
              <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-green)]/15">
                <UIcon name="material-symbols:stacked-bar-chart-outline" class="size-4 text-[var(--color-accent-green)]" />
              </div>
              <h3 class="text-lg font-medium">{{ t('crm.dashboard.pipelineByStage') }}</h3>
            </div>
          </template>
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
            >
              <span class="min-w-24 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ t('global.currencySymbol') }}{{ priceFormatCompact(row.value) }}</span>
              <span class="min-w-20 shrink-0 whitespace-nowrap text-right text-xs text-[var(--color-gray)]">{{ row.count }} {{ t('crm.dashboard.dealsUnit') }}</span>
            </CrmMetricBar>
          </div>
        </UCard>
      </div>

      <div class="lg:col-span-2">
        <UCard class="h-full ring-[var(--color-card-border)]" :ui="{ root: 'flex h-full flex-col', body: 'flex-1' }">
          <template #header>
            <div class="flex items-center gap-2">
              <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-chart-violet)]/15">
                <UIcon name="material-symbols:sell-outline" class="size-4 text-[var(--color-chart-violet)]" />
              </div>
              <h3 class="text-lg font-medium">{{ t('crm.dashboard.upsellOpportunities') }}</h3>
            </div>
            <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.upsellOpportunitiesHint') }}</p>
          </template>
          <div v-if="upsellGroups.every(group => group.candidates.length === 0)" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.dashboard.noUpsellCandidates') }}
          </div>
          <div v-else class="flex flex-col gap-4">
            <div v-for="group in upsellGroups" v-show="group.candidates.length > 0" :key="group.tier">
              <p class="mb-2 text-xs font-medium text-[var(--color-gray)]">{{ group.label }}</p>
              <div class="flex flex-col gap-2">
                <NuxtLink
                  v-for="candidate in group.candidates"
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
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-info-toast)]/15">
              <UIcon name="material-symbols:filter-alt-outline" class="size-4 text-[var(--color-info-toast)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.salesFunnel') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.salesFunnelHint') }}</p>
        </template>
        <div v-if="funnelStages.every(stage => stage.value === 0)" class="relative">
          <UBadge color="neutral" variant="subtle" class="absolute inset-e-0 top-0 z-10">{{ t('crm.dashboard.previewBadge') }}</UBadge>
          <div class="opacity-50 grayscale-50">
            <CrmFunnelChart :stages="funnelStagesPreview" />
          </div>
          <p class="mt-2 text-center text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.noDataPreviewHint') }}</p>
        </div>
        <CrmFunnelChart v-else :stages="funnelStages" />
      </UCard>

      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-toast)]/15">
              <UIcon name="material-symbols:donut-large-outline" class="size-4 text-[var(--color-success-toast)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.outcomeSplit') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.outcomeSplitHint') }}</p>
        </template>
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
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { priceFormatCompact } = useFormatter()

defineProps<{
  stageBreakdown: { stage: string, value: number, count: number, percent: number, barClass: string }[]
  upsellGroups: { tier: string, label: string, candidates: { company: Company, contact: { color: string, label: string } }[] }[]
  funnelStages: { label: string, value: number, barClass?: string }[]
  funnelStagesPreview: { label: string, value: number, barClass?: string }[]
  outcomeDonutSegments: { label: string, value: number, valueLabel: string, colorVar: string, icon: string }[]
  outcomeDonutSegmentsPreview: { label: string, value: number, valueLabel: string, colorVar: string, icon: string }[]
  outcomeTotal: number
  outcomeTotalPreviewLabel: string
}>()
</script>
