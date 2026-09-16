<template>
  <div class="mb-8">
    <DashboardSectionHeader :title="t('crm.dashboard.sectionForecastBreakdown')" />

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <CrmStatCard
        reserve-hint-space
        :label="t('crm.dashboard.forecastCommit')"
        :tooltip="t('crm.dashboard.forecastCommitTooltip')"
        icon="material-symbols:verified-outline"
        icon-class="text-(--color-success-toast)"
        icon-bg-class="bg-(--color-success-toast)/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(commit) }}
      </CrmStatCard>
      <CrmStatCard
        reserve-hint-space
        :label="t('crm.dashboard.forecastBestCase')"
        :tooltip="t('crm.dashboard.forecastBestCaseTooltip')"
        icon="material-symbols:trending-up"
        icon-class="text-(--color-warning-hover)"
        icon-bg-class="bg-(--color-warning-hover)/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-warning-hover)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(bestCase) }}
      </CrmStatCard>
      <CrmStatCard
        reserve-hint-space
        :label="t('crm.dashboard.forecastPipeline')"
        :tooltip="t('crm.dashboard.forecastPipelineTooltip')"
        icon="material-symbols:filter-alt-outline"
        icon-class="text-(--color-gray)"
        icon-bg-class="bg-(--color-gray)/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-gray)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(pipeline) }}
      </CrmStatCard>
      <CrmStatCard
        reserve-hint-space
        :label="t('crm.dashboard.forecastTotal')"
        :tooltip="t('crm.dashboard.forecastTotalTooltip')"
        icon="material-symbols:query-stats"
        icon-class="text-(--color-info-toast)"
        icon-bg-class="bg-(--color-info-toast)/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-info-toast)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(commit + bestCase + pipeline) }}
      </CrmStatCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { priceFormatCompact } = useFormatter()

defineProps<{
  commit: number
  bestCase: number
  pipeline: number
}>()
</script>
