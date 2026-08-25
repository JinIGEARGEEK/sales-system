<template>
  <div class="mb-8">
    <h3 class="mb-3 border-b border-[var(--color-light-gray-2)] pb-2 text-sm font-semibold text-[var(--color-black)]">
      {{ t('crm.dashboard.sectionPipelineOverview') }}
    </h3>

    <!-- All 9 KPI cards in one grid: lg:grid-cols-3 divides evenly into 3
         full rows. (Previously split into two 4-col grids — 4 + 5 cards —
         which always left 3 empty trailing cells in the second row.) -->
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <CrmStatCard
        :label="t('crm.dashboard.openPipelineValue')"
        :tooltip="t('crm.dashboard.openPipelineValueTooltip')"
        icon="material-symbols:account-balance-wallet-outline"
        icon-class="text-[var(--color-accent-green)]"
        icon-bg-class="bg-[var(--color-accent-green)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-accent-green)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(openPipelineValue) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.forecastedRevenue')"
        :tooltip="t('crm.dashboard.forecastedRevenueHint')"
        icon="material-symbols:query-stats"
        icon-class="text-[var(--color-info-toast)]"
        icon-bg-class="bg-[var(--color-info-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-info-toast)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(forecastedRevenue) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.winRate')"
        :tooltip="t('crm.dashboard.winRateTooltip')"
        :icon="winRate >= 50 ? 'material-symbols:trending-up' : 'material-symbols:trending-down'"
        :icon-bg-class="winRate >= 50 ? 'bg-[var(--color-success-toast)]/25' : 'bg-[var(--color-gray)]/25'"
        :value-class="winRate >= 50 ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-black)]'"
        :accent-glass-class="winRate >= 50 ? 'bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent' : 'bg-gradient-to-r from-[var(--color-gray)]/20 to-transparent'"
      >
        {{ winRate }}%
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.openDeals')"
        :tooltip="t('crm.dashboard.openDealsTooltip')"
        icon="material-symbols:work-outline"
        icon-class="text-[var(--color-warning-hover)]"
        icon-bg-class="bg-[var(--color-warning-hover)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-warning-hover)]/20 to-transparent"
      >
        {{ openDealsCount }} <span class="text-sm font-normal text-[var(--color-gray)]">{{ t('crm.dashboard.dealsUnit') }}</span>
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.wonThisPeriod')"
        :tooltip="t('crm.dashboard.wonThisPeriodTooltip')"
        icon="material-symbols:workspace-premium-outline"
        icon-class="text-[var(--color-success-toast)]"
        icon-bg-class="bg-[var(--color-success-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(wonValue) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.avgDealSize')"
        :tooltip="t('crm.dashboard.avgDealSizeTooltip')"
        icon="material-symbols:payments-outline"
        icon-class="text-[var(--color-chart-violet)]"
        icon-bg-class="bg-[var(--color-chart-violet)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-chart-violet)]/20 to-transparent"
      >
        {{ t('global.currencySymbol') }}{{ priceFormatCompact(avgDealSize) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.avgSalesCycle')"
        :tooltip="t('crm.dashboard.avgSalesCycleTooltip')"
        icon="material-symbols:schedule-outline"
        icon-class="text-[var(--color-info-toast)]"
        icon-bg-class="bg-[var(--color-info-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-info-toast)]/20 to-transparent"
      >
        {{ t('crm.dashboard.avgSalesCycleDays', { days: avgSalesCycleDays }) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.pipelineCoverage')"
        :tooltip="t('crm.dashboard.pipelineCoverageTooltip')"
        :icon="isPipelineHealthy ? 'material-symbols:check-circle-outline' : 'material-symbols:warning-outline'"
        :icon-bg-class="isPipelineHealthy ? 'bg-[var(--color-success-toast)]/25' : 'bg-[var(--color-danger-toast)]/25'"
        :value-class="isPipelineHealthy ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
        :hint-class="isPipelineHealthy ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
        :accent-glass-class="isPipelineHealthy ? 'bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent' : 'bg-gradient-to-r from-[var(--color-danger-toast)]/20 to-transparent'"
      >
        {{ pipelineCoverageRatio.toFixed(1) }}x
        <template #hint>
          {{ t(isPipelineHealthy ? 'crm.dashboard.onTrack' : 'crm.dashboard.belowTarget') }} · {{ t('crm.dashboard.pipelineCoverageHint', { target: `${t('global.currencySymbol')}${priceFormatCompact(quarterlySalesTarget)}` }) }}
        </template>
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.annualRevenueGoal')"
        :tooltip="t('crm.dashboard.annualRevenueGoalTooltip')"
        :icon="isAnnualGoalOnTrack ? 'material-symbols:check-circle-outline' : 'material-symbols:warning-outline'"
        :icon-bg-class="isAnnualGoalOnTrack ? 'bg-[var(--color-success-toast)]/25' : 'bg-[var(--color-danger-toast)]/25'"
        :value-class="isAnnualGoalOnTrack ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
        :hint-class="isAnnualGoalOnTrack ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
        :accent-glass-class="isAnnualGoalOnTrack ? 'bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent' : 'bg-gradient-to-r from-[var(--color-danger-toast)]/20 to-transparent'"
      >
        {{ annualGoalProgressPercent }}%
        <template #hint>
          {{ t(isAnnualGoalOnTrack ? 'crm.dashboard.onTrack' : 'crm.dashboard.belowTarget') }} · {{ t('crm.dashboard.annualRevenueGoalHint', { actual: `${t('global.currencySymbol')}${priceFormatCompact(annualRevenueActual)}`, goal: `${t('global.currencySymbol')}${priceFormatCompact(annualRevenueGoal)}` }) }}
        </template>
      </CrmStatCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { priceFormatCompact } = useFormatter()

defineProps<{
  openPipelineValue: number
  forecastedRevenue: number
  winRate: number
  openDealsCount: number
  wonValue: number
  avgDealSize: number
  avgSalesCycleDays: number
  pipelineCoverageRatio: number
  isPipelineHealthy: boolean
  quarterlySalesTarget: number
  annualGoalProgressPercent: number
  isAnnualGoalOnTrack: boolean
  annualRevenueActual: number
  annualRevenueGoal: number
}>()
</script>
