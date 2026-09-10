<template>
  <div class="mb-8">
    <h3 class="mb-3 border-b border-[var(--color-light-gray-2)] pb-2 text-sm font-semibold text-[var(--color-black)]">
      {{ t('crm.dashboard.sectionForecastBreakdown') }}
    </h3>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <CrmStatCard
        reserve-hint-space
        :label="t('crm.dashboard.forecastCommit')"
        :tooltip="t('crm.dashboard.forecastCommitTooltip')"
        icon="material-symbols:verified-outline"
        icon-class="text-[var(--color-success-toast)]"
        icon-bg-class="bg-[var(--color-success-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(commit) }}
      </CrmStatCard>
      <CrmStatCard
        reserve-hint-space
        :label="t('crm.dashboard.forecastBestCase')"
        :tooltip="t('crm.dashboard.forecastBestCaseTooltip')"
        icon="material-symbols:trending-up"
        icon-class="text-[var(--color-warning-hover)]"
        icon-bg-class="bg-[var(--color-warning-hover)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-warning-hover)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(bestCase) }}
      </CrmStatCard>
      <CrmStatCard
        reserve-hint-space
        :label="t('crm.dashboard.forecastPipeline')"
        :tooltip="t('crm.dashboard.forecastPipelineTooltip')"
        icon="material-symbols:filter-alt-outline"
        icon-class="text-[var(--color-gray)]"
        icon-bg-class="bg-[var(--color-gray)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-gray)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(pipeline) }}
      </CrmStatCard>
      <CrmStatCard
        reserve-hint-space
        :label="t('crm.dashboard.forecastTotal')"
        :tooltip="t('crm.dashboard.forecastTotalTooltip')"
        icon="material-symbols:query-stats"
        icon-class="text-[var(--color-info-toast)]"
        icon-bg-class="bg-[var(--color-info-toast)]/25"
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
