<template>
  <div class="mb-8">
    <h3 class="mb-3 flex items-center justify-between border-b border-[var(--color-light-gray-2)] pb-2">
      <span class="text-sm font-semibold text-[var(--color-black)]">{{ t('crm.dashboard.sectionProspectFunnel') }}</span>
      <NuxtLink to="/crm/reports/prospect-source" class="text-xs font-medium text-[var(--color-primary)] hover:underline">
        {{ t('crm.dashboard.viewFullReport') }}
      </NuxtLink>
    </h3>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <CrmStatCard
        :label="t('crm.dashboard.totalProspects')"
        icon="material-symbols:contact-mail-outline"
        icon-class="text-[var(--color-info-toast)]"
        icon-bg-class="bg-[var(--color-info-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-info-toast)]/20 to-transparent"
        to="/crm/prospects"
      >
        {{ summary?.total_prospects ?? 0 }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.openProspects')"
        icon="material-symbols:person-search-outline"
        icon-class="text-[var(--color-warning-hover)]"
        icon-bg-class="bg-[var(--color-warning-hover)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-warning-hover)]/20 to-transparent"
        to="/crm/prospects"
      >
        {{ summary?.open_prospects ?? 0 }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.prospectConversionRate')"
        :tooltip="t('crm.dashboard.prospectConversionRateTooltip')"
        icon="material-symbols:trending-up"
        icon-class="text-[var(--color-success-toast)]"
        icon-bg-class="bg-[var(--color-success-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent"
        to="/crm/reports/prospect-source"
      >
        {{ (summary?.conversion_rate ?? 0).toFixed(1) }}%
      </CrmStatCard>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <h3 class="text-lg font-medium">{{ t('crm.dashboard.prospectsByStatus') }}</h3>
        </template>
        <div v-if="!statusRows.length" class="py-6 text-center text-sm text-[var(--color-gray)]">
          {{ t('crm.dashboard.noProspectData') }}
        </div>
        <div v-else class="flex flex-col gap-3">
          <CrmMetricBar
            v-for="(row, index) in statusRows"
            :key="row.status"
            :label="row.status"
            :percent="row.percent"
            :bar-class="(CHART_CATEGORICAL_COLORS[index] ?? CHART_FALLBACK_COLOR).bar"
            :to="`/crm/prospects?status=${encodeURIComponent(row.status)}`"
          >
            <span class="min-w-10 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ row.count }}</span>
          </CrmMetricBar>
        </div>
      </UCard>

      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <h3 class="text-lg font-medium">{{ t('crm.dashboard.prospectsBySource') }}</h3>
        </template>
        <div v-if="!(summary?.source_breakdown?.length)" class="py-6 text-center text-sm text-[var(--color-gray)]">
          {{ t('crm.dashboard.noProspectData') }}
        </div>
        <div v-else class="flex flex-col gap-3">
          <CrmMetricBar
            v-for="row in summary!.source_breakdown"
            :key="row.source"
            :label="row.source"
            :percent="Math.round(row.conversion_rate)"
            :to="`/crm/prospects?source=${encodeURIComponent(row.source)}`"
          >
            <span class="min-w-24 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ row.converted }} / {{ row.total }}</span>
            <span class="min-w-14 shrink-0 whitespace-nowrap text-right text-xs text-[var(--color-gray)]">{{ row.conversion_rate.toFixed(1) }}%</span>
          </CrmMetricBar>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CHART_CATEGORICAL_COLORS, CHART_FALLBACK_COLOR } from '~/constants/ui'

const { t } = useI18n()

const props = defineProps<{
  summary: ProspectDashboardSummary | null
}>()

// Bars scale against the largest status bucket, same convention as the
// Sales dashboard's own stage-breakdown bars (DashboardPipelineOpportunities).
const statusRows = computed(() => {
  const rows = props.summary?.status_breakdown ?? []
  const maxCount = Math.max(...rows.map(r => r.count), 1)
  return rows.map(row => ({ ...row, percent: Math.round((row.count / maxCount) * 100) }))
})
</script>
