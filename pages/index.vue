<template>
  <div class="p-5">
    <div class="mb-6">
      <h2 class="text-xl font-black">{{ t('crm.dashboard.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.dashboard.subheading') }}</p>
    </div>

    <!-- Sticks below the layout's own sticky header (which only appears at
         md+, hence the same breakpoint here) so the filters stay reachable
         on this long, scroll-heavy dashboard instead of scrolling out of
         view. z-10 matches the layout header's own stacking so page
         content scrolls underneath both, not just one. -->
    <div ref="filterBarSentinelRef" />
    <UCard
      class="sticky top-3 z-10 mb-6 transition-[background-color,backdrop-filter,box-shadow] duration-200 md:top-[calc(var(--layout-header-height)+12px)]"
      :ui="filterBarCardUi"
    >
      <!-- Laser accent: thin glowing gradient line on the bottom edge,
           only shown once the bar is actually floating — see
           filterBarCardUi for why the glass styling lives in script. -->
      <div
        v-if="isFilterBarStuck"
        class="pointer-events-none absolute inset-x-4 -bottom-px h-px bg-linear-to-r from-transparent via-(--color-secondary) to-transparent opacity-80 shadow-[0_0_8px_1px_var(--color-secondary)]"
      />
      <div class="flex flex-wrap items-end gap-2">
        <InputSelect
          :model-value="activePreset"
          :options="PERIOD_PRESETS"
          :label="t('crm.dashboard.filterPeriod')"
          :placeholder="t('crm.dashboard.periodCustom')"
          name="periodPreset"
          size="xs"
          class="w-32"
          @update:model-value="applyPeriodPreset"
        />
        <InputDateRangePicker
          v-model="dateRange"
          :label="t('crm.dashboard.filterDateRange')"
          :placeholder="t('crm.dashboard.dateRangePlaceholder')"
          name="dateRange"
          size="xs"
          class="w-56"
        />
        <!-- Always shown on lg+ (desktop has room for them); on smaller
             screens they stay behind the More Filters toggle below. -->
        <div :class="showAdvancedFilters ? 'contents' : 'hidden lg:contents'">
          <InputSelect
            v-model="businessUnitFilter"
            :options="BUSINESS_UNIT_FILTER_OPTIONS"
            :label="t('crm.dashboard.filterBusinessUnit')"
            name="businessUnitFilter"
            size="xs"
            class="w-36"
          />
          <InputSelect
            v-model="channelFilter"
            :options="channelFilterOptions"
            :label="t('crm.dashboard.filterChannel')"
            name="channelFilter"
            size="xs"
            class="w-32"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.dashboard.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-40"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.dashboard.filterCompanyTag')"
            :placeholder="t('crm.dashboard.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-36"
          />
        </div>
        <!-- The toggle itself is only needed on smaller screens, since the
             fields above are already always visible on lg+. -->
        <div class="flex flex-col lg:hidden">
          <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
          <UButton
            :label="showAdvancedFilters ? t('crm.dashboard.fewerFilters') : t('crm.dashboard.moreFilters')"
            :icon="showAdvancedFilters ? 'material-symbols:expand-less' : 'material-symbols:tune'"
            size="xs"
            variant="subtle"
            color="primary"
            class="font-medium"
            @click="showAdvancedFilters = !showAdvancedFilters"
          >
            <template v-if="advancedFilterCount > 0" #trailing>
              <UBadge :label="advancedFilterCount" size="xs" color="primary" variant="solid" />
            </template>
          </UButton>
        </div>
        <div v-if="hasActiveFilters" class="flex flex-col">
          <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
          <UButton
            icon="material-symbols:filter-alt-off-outline"
            variant="outline"
            color="neutral"
            size="xs"
            square
            :aria-label="t('crm.dashboard.clearFilters')"
            @click="clearFilters"
          />
        </div>
        <span class="ml-auto text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.showingDeals', { count: filteredDeals.length, total: dealsStore.items.length }) }}</span>
      </div>
    </UCard>

    <UAlert
      v-if="filteredDeals.length === 0 && hasActiveFilters"
      class="mb-6"
      :title="t('crm.dashboard.noDealsMatch')"
      :ui="{
        root: 'items-center gap-2 border-l-4 border-l-[var(--color-warning-hover)] bg-[var(--color-warning-toast)]/20 p-2 shadow-sm ring-0',
        title: 'text-sm font-semibold text-[var(--color-black)]',
      }"
    >
      <template #leading>
        <div class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning-hover)]/25">
          <UIcon name="material-symbols:search-off-outline" class="size-3.5 text-[var(--color-warning-hover)]" />
        </div>
      </template>
    </UAlert>

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

    <div class="mb-8">
      <h3 class="mb-3 border-b border-[var(--color-light-gray-2)] pb-2 text-sm font-semibold text-[var(--color-black)]">
        {{ t('crm.dashboard.sectionTrends') }}
      </h3>

    <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-info-toast)]/15">
              <UIcon name="material-symbols:show-chart" class="size-4 text-[var(--color-info-toast)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.revenueTrend') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.revenueTrendHint') }}</p>
        </template>
        <div class="relative flex h-40 items-end gap-4 px-2">
          <div class="pointer-events-none absolute inset-x-2 top-0 flex h-28 flex-col justify-between">
            <div v-for="line in 4" :key="line" class="border-t border-dashed border-[var(--color-light-gray-2)]" />
          </div>
          <div v-for="bucket in revenueTrend" :key="bucket.label" class="flex flex-1 flex-col items-center gap-2">
            <span class="text-xs font-medium" :class="bucket.value > 0 ? 'text-[var(--color-black)]' : 'text-[var(--color-gray)]'">
              {{ t('global.currencySymbol') }}{{ priceFormatCompact(bucket.value) }}
            </span>
            <UTooltip :text="`${bucket.label}: ${t('global.currencySymbol')}${priceFormatCompact(bucket.value)}`">
              <div class="flex h-28 w-full items-end overflow-hidden rounded-t-md bg-[var(--color-light-gray-2)]">
                <div
                  class="w-full rounded-t-md transition-[filter] duration-150 hover:brightness-110"
                  :class="bucket.value > 0 ? 'bg-sky-400' : 'bg-[var(--color-gray)]/40'"
                  :style="`height: ${Math.max(bucket.percent, 4)}%`"
                />
              </div>
            </UTooltip>
            <span class="text-xs text-[var(--color-gray)]">{{ bucket.label }}</span>
          </div>
        </div>
      </UCard>

      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-chart-violet)]/15">
              <UIcon name="material-symbols:trending-up" class="size-4 text-[var(--color-chart-violet)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.forecastTrend') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.forecastTrendHint') }}</p>
        </template>
        <div class="relative flex h-40 items-end gap-4 px-2">
          <div class="pointer-events-none absolute inset-x-2 top-0 flex h-28 flex-col justify-between">
            <div v-for="line in 4" :key="line" class="border-t border-dashed border-[var(--color-light-gray-2)]" />
          </div>
          <div v-for="bucket in forecastTrend" :key="bucket.label" class="flex flex-1 flex-col items-center gap-2">
            <span class="text-xs font-medium" :class="bucket.value > 0 ? 'text-[var(--color-black)]' : 'text-[var(--color-gray)]'">
              {{ t('global.currencySymbol') }}{{ priceFormatCompact(bucket.value) }}
            </span>
            <UTooltip :text="`${bucket.label}: ${t('global.currencySymbol')}${priceFormatCompact(bucket.value)}`">
              <div class="flex h-28 w-full items-end overflow-hidden rounded-t-md bg-[var(--color-light-gray-2)]">
                <div
                  class="w-full rounded-t-md transition-[filter] duration-150 hover:brightness-110"
                  :class="bucket.value > 0 ? 'bg-violet-400' : 'bg-[var(--color-gray)]/40'"
                  :style="`height: ${Math.max(bucket.percent, 4)}%`"
                />
              </div>
            </UTooltip>
            <span class="text-xs text-[var(--color-gray)]">{{ bucket.label }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="ring-[var(--color-card-border)]">
      <template #header>
        <div class="flex items-center gap-2">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-toast)]/15">
            <UIcon name="material-symbols:flag-outline" class="size-4 text-[var(--color-success-toast)]" />
          </div>
          <h3 class="text-lg font-medium">{{ t('crm.dashboard.annualRevenueTrend') }}</h3>
        </div>
        <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.annualRevenueTrendHint') }}</p>
      </template>
      <div class="relative flex h-40 items-end gap-3 px-2">
        <div class="pointer-events-none absolute inset-x-2 top-0 flex h-28 flex-col justify-between">
          <div v-for="line in 4" :key="line" class="border-t border-dashed border-[var(--color-light-gray-2)]" />
        </div>
        <div v-for="bucket in annualRevenueTrendChart" :key="bucket.label" class="flex flex-1 flex-col items-center gap-2">
          <span class="text-xs font-medium" :class="bucket.actual > 0 ? 'text-[var(--color-black)]' : 'text-[var(--color-gray)]'">
            {{ t('global.currencySymbol') }}{{ priceFormatCompact(bucket.actual) }}
          </span>
          <UTooltip :text="`${bucket.label}: ${t('global.currencySymbol')}${priceFormatCompact(bucket.actual)} (${t('crm.dashboard.annualRevenueTrendPaceLabel', { pace: `${t('global.currencySymbol')}${priceFormatCompact(bucket.goal_pace)}` })})`">
            <div class="relative flex h-28 w-full items-end overflow-hidden rounded-t-md bg-[var(--color-light-gray-2)]">
              <div
                class="w-full rounded-t-md transition-[filter] duration-150 hover:brightness-110"
                :class="bucket.actual >= bucket.goal_pace ? 'bg-[var(--color-success-toast)]' : 'bg-[var(--color-danger-toast)]'"
                :style="`height: ${Math.max(bucket.actualPercent, 4)}%`"
              />
              <div
                class="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-[var(--color-black)]/40"
                :style="`bottom: ${bucket.goalPacePercent}%`"
              />
            </div>
          </UTooltip>
          <span class="text-xs text-[var(--color-gray)]">{{ bucket.label }}</span>
        </div>
      </div>
    </UCard>
    </div>

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

      <div v-if="canViewSalesPipelineWidgets" class="lg:col-span-2">
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

    <div>
      <h3 class="mb-3 border-b border-[var(--color-light-gray-2)] pb-2 text-sm font-semibold text-[var(--color-black)]">
        {{ t('crm.dashboard.sectionFollowUpsTeam') }}
      </h3>

    <div class="mb-6">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning-hover)]/15">
              <UIcon name="material-symbols:event-upcoming-outline" class="size-4 text-[var(--color-warning-hover)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.upcomingFollowUps') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.upcomingFollowUpsHint') }}</p>
        </template>
        <div v-if="upcomingTasks.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
          {{ t('crm.dashboard.noUpcomingTasks') }}
        </div>
        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <NuxtLink
            v-for="task in upcomingTasks"
            :key="task.id"
            :to="task.path"
            class="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ task.title }}</p>
              <p class="truncate text-xs text-[var(--color-gray)]">{{ task.relatedLabel }} · {{ teamMembersStore.nameById(task.assigned_to) }}</p>
            </div>
            <UBadge :color="task.isOverdue ? 'error' : 'neutral'" variant="subtle" class="shrink-0">
              {{ dateFormat(task.due_date) }}
            </UBadge>
          </NuxtLink>
        </div>
      </UCard>
    </div>

    <div v-if="canViewSalesPipelineWidgets" class="mb-6">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-toast)]/15">
              <UIcon name="material-symbols:notifications-outline" class="size-4 text-[var(--color-danger-toast)]" />
            </div>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.recentAlerts') }}</h3>
          </div>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.recentAlertsHint') }}</p>
        </template>
        <div v-if="recentAlerts.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
          {{ t('crm.dashboard.noRecentAlerts') }}
        </div>
        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <NuxtLink
            v-for="alert in recentAlerts"
            :key="alert.id"
            :to="`/crm/deals/${alert.deal_id}`"
            class="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ alert.deal_title }}</p>
              <p class="truncate text-xs text-[var(--color-gray)]">{{ alert.rule_name }}</p>
            </div>
            <UBadge color="neutral" variant="subtle" class="shrink-0">
              {{ dateTimeFormat(alert.notified_at.toISOString()) }}
            </UBadge>
          </NuxtLink>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
      <div class="lg:col-span-3">
        <UCard class="h-full ring-[var(--color-card-border)]" :ui="{ root: 'flex h-full flex-col', body: 'flex-1' }">
          <template #header>
            <div class="flex items-center gap-2">
              <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-toast)]/15">
                <UIcon name="material-symbols:leaderboard-outline" class="size-4 text-[var(--color-success-toast)]" />
              </div>
              <h3 class="text-lg font-medium">{{ t('crm.dashboard.winRateByIndustry') }}</h3>
            </div>
            <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.winRateByIndustryHint') }}</p>
          </template>
          <div v-if="industryBreakdown.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.dashboard.noClosedDeals') }}
          </div>
          <div v-else class="flex flex-col gap-3">
            <CrmMetricBar
              v-for="row in industryBreakdown"
              :key="row.industry"
              :label="row.industry"
              :percent="row.winRate"
              :bar-class="row.barClass"
              :tooltip="`${row.industry}: ${row.winRate}% · ${t('crm.dashboard.dealsWon', { count: row.wonCount })}`"
            >
              <span class="min-w-14 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ row.winRate }}%</span>
              <span class="min-w-16 shrink-0 whitespace-nowrap text-right text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.dealsWon', { count: row.wonCount }) }}</span>
            </CrmMetricBar>
          </div>
        </UCard>
      </div>

      <div class="lg:col-span-2">
        <UCard class="h-full ring-[var(--color-card-border)]" :ui="{ root: 'flex h-full flex-col', body: 'flex-1' }">
          <template #header>
            <div class="flex items-center gap-2">
              <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-info-toast)]/15">
                <UIcon name="material-symbols:groups-outline" class="size-4 text-[var(--color-info-toast)]" />
              </div>
              <h3 class="text-lg font-medium">{{ t('crm.dashboard.teamPerformance') }}</h3>
            </div>
            <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.teamPerformanceHint') }}</p>
          </template>
          <div class="flex flex-col gap-2">
            <div
              v-for="member in teamPerformance"
              :key="member.id"
              class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <UAvatar :text="member.initials" size="sm" />
                <div>
                  <p class="text-sm font-medium">{{ member.name }}</p>
                  <p class="text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.dealsWon', { count: member.wonCount }) }} · {{ member.winRate }}%</p>
                </div>
              </div>
              <span class="text-sm font-medium">{{ t('global.currencySymbol') }}{{ priceFormatCompact(member.wonValue) }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  BUSINESS_UNIT_FILTER_OPTIONS,
  isTaskOverdue,
} from '~/constants/mockData'
import { CHART_CATEGORICAL_COLORS, CHART_FALLBACK_COLOR } from '~/constants/ui'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'

const { t } = useI18n()
const { hasRole } = useRole()
// Upsell Opportunities/Recent Alerts link straight into Company/Deal detail
// pages, which aren't a primary destination for Production (same
// SALES_PIPELINE_ROLES exclusion as the sidebar nav and GlobalSearch) — this
// dashboard was the one remaining place that restriction wasn't mirrored.
const canViewSalesPipelineWidgets = computed(() => hasRole(...SALES_PIPELINE_ROLES))
const { error } = useNotify()
// Every fire-and-forget fetch below is a bare `if (...) store.fetchAll()` (no
// `await`, no caller-side try/catch) — this dashboard has none of the loading
// components' own error handling, so a failed request would otherwise be a
// silent unhandled rejection with no user-facing feedback. Route every one
// through this so a network/API failure at least surfaces a toast.
const notifyFetchError = (err: unknown) => error(getApiErrorMessage(err, t('global.genericError')))

useHead({ title: t('crm.dashboard.pageTitle') })

// The filter bar only needs to look like frosted glass once it's actually
// floating over scrolled-past content — while it sits in its normal
// in-flow position at the top of the page there's nothing behind it to
// blur, so a plain card reads better there. A zero-height sentinel placed
// just above it flips `isFilterBarStuck` the moment it scrolls out of the
// scroll container's view (i.e. the instant the sticky bar starts
// floating) — same technique as the layout header's own sticky detection.
const isFilterBarStuck = ref(false)
const filterBarSentinelRef = ref<HTMLElement | null>(null)
onMounted(() => {
  const sentinelEl = filterBarSentinelRef.value
  const mainEl = sentinelEl?.closest('main') ?? null
  if (!sentinelEl || !mainEl) return
  const observer = new IntersectionObserver(
    ([entry]) => { isFilterBarStuck.value = !entry.isIntersecting },
    { root: mainEl, threshold: 0 },
  )
  observer.observe(sentinelEl)
  onUnmounted(() => observer.disconnect())
})

// Kept as a computed (rather than inline in the template's `:ui` attribute)
// so this reasoning lives in a plain JS comment instead of a comment inside
// a double-quoted HTML attribute — the latter breaks the moment the comment
// text itself needs a literal double quote (bitten by this twice already).
//
// Low fill opacity + strong blur so scrolled content is genuinely
// visible-but-frosted through the bar (real see-through glass) instead of
// reading as a near-solid card. Distinctness against the pale page
// background comes from the shadow/ring, not from opacity, so it can stay
// this transparent without dissolving in. The blue tint matches the
// sidebar nav's own active/focus glow (layouts/default.vue's
// .sidebar-nav-link.is-active — rgba(96, 165, 250) is the blue half of
// that gradient), so the floating-panel cue reads consistently with that
// active/focus state elsewhere in the app. One soft ring rather than a
// hard border layered under a separate ring, so the edge reads as a single
// seamless glow instead of a stacked double outline — paired with a plain
// elevation shadow so it doesn't lose its depth.
const filterBarCardUi = computed(() => ({
  root: isFilterBarStuck.value
    ? 'bg-white/10 backdrop-blur-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(96,165,250,0.4)] ring-1 ring-[rgba(96,165,250,0.4)]'
    : '',
  body: 'p-2 sm:p-3',
}))

const pipelineStagesStore = usePipelineStagesStore()
const leadSourcesStore = useLeadSourcesStore()
onMounted(() => {
  if (pipelineStagesStore.items.length === 0) pipelineStagesStore.fetchAll().catch(notifyFetchError)
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll().catch(notifyFetchError)
})

// Admin-configurable stage/source lists (replaces the previously hardcoded
// DEAL_STAGE_OPTIONS/CHANNEL_OPTIONS constants).
const channelFilterOptions = computed(() => [
  { label: 'All Channels', value: 'all' },
  ...leadSourcesStore.activeOptions,
])

const { $api } = useNuxtApp()
const { priceFormatCompact, dateFormat, dateTimeFormat } = useFormatter()
const companiesStore = useCompaniesStore()
const dealsStore = useDealsStore()
const tasksStore = useTasksStore()
const teamMembersStore = useTeamMembersStore()
const notificationLogStore = useNotificationLogStore()

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyFetchError)
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyFetchError)
  if (tasksStore.items.length === 0) tasksStore.fetchAll().catch(notifyFetchError)
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyFetchError)
  notificationLogStore.fetchRecent().catch(notifyFetchError)
})

const recentAlerts = computed(() => notificationLogStore.items)

const PERIOD_PRESET_VALUES = ['all', 'month', 'quarter', 'year', 'last6', 'last12']

const { dateRange, activePreset, applyPeriodPreset, isDealInRange } = useDatePeriodFilter(() => dealsStore.items, PERIOD_PRESET_VALUES)

const PERIOD_PRESETS = computed(() => [
  { label: t('crm.dashboard.periodAll'), value: 'all' },
  { label: t('crm.dashboard.periodThisMonth'), value: 'month' },
  { label: t('crm.dashboard.periodThisQuarter'), value: 'quarter' },
  { label: t('crm.dashboard.periodThisYear'), value: 'year' },
  { label: t('crm.dashboard.periodLast6Months'), value: 'last6' },
  { label: t('crm.dashboard.periodLast12Months'), value: 'last12' },
])

const businessUnitFilter = ref('all')
const channelFilter = ref('all')
const salesRepFilter = ref('all')
const companyTagFilter = ref('')
const showAdvancedFilters = ref(false)

const advancedFilterCount = computed(() => {
  return [
    businessUnitFilter.value !== 'all',
    channelFilter.value !== 'all',
    salesRepFilter.value !== 'all',
    Boolean(companyTagFilter.value),
  ].filter(Boolean).length
})

// teamMembersStore.filterOptions already provides a correct "All Team
// Members" catch-all — reuse it instead of reimplementing it here (the
// previous local version mistakenly used the field's own label,
// "พนักงานขาย"/"Sales Rep", as the catch-all's label).
const salesRepOptions = computed(() => teamMembersStore.filterOptions)

const hasActiveFilters = computed(() => {
  return Boolean(dateRange.value)
    || businessUnitFilter.value !== 'all'
    || channelFilter.value !== 'all'
    || salesRepFilter.value !== 'all'
    || Boolean(companyTagFilter.value)
})

const clearFilters = () => {
  dateRange.value = null
  businessUnitFilter.value = 'all'
  channelFilter.value = 'all'
  salesRepFilter.value = 'all'
  companyTagFilter.value = ''
}

// Kept for the toolbar's "Showing X of Y deals" count and the "no deals match" alert
// only — every metric widget below comes from GET /dashboard/summary instead.
const filteredDeals = computed(() => {
  return dealsStore.items.filter((deal) => {
    if (!isDealInRange(deal)) return false
    if (businessUnitFilter.value !== 'all' && deal.business_unit !== businessUnitFilter.value) return false
    if (channelFilter.value !== 'all' && deal.channel !== channelFilter.value) return false
    return true
  })
})

const summary = ref<DashboardSummary | null>(null)

const fetchSummary = async () => {
  try {
    const response = await $api.get<ApiResponse<DashboardSummary>>('/dashboard/summary', {
      params: {
        date_from: dateRange.value?.start,
        date_to: dateRange.value?.end,
        business_unit: businessUnitFilter.value !== 'all' ? businessUnitFilter.value : undefined,
        channel: channelFilter.value !== 'all' ? channelFilter.value : undefined,
        assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
        company_tag: companyTagFilter.value || undefined,
      },
    })
    summary.value = response.data.data
  } catch (err) {
    notifyFetchError(err)
  }
}

onMounted(fetchSummary)
watch([dateRange, businessUnitFilter, channelFilter, salesRepFilter], fetchSummary)

let companyTagDebounce: ReturnType<typeof setTimeout> | undefined
watch(companyTagFilter, () => {
  clearTimeout(companyTagDebounce)
  companyTagDebounce = setTimeout(fetchSummary, 400)
})

const openPipelineValue = computed(() => summary.value?.open_pipeline_value ?? 0)
const wonValue = computed(() => summary.value?.won_value ?? 0)
const winRate = computed(() => Math.round(summary.value?.win_rate ?? 0))
const openDealsCount = computed(() => summary.value?.open_deals_count ?? 0)
const forecastedRevenue = computed(() => summary.value?.forecasted_revenue ?? 0)
const avgDealSize = computed(() => summary.value?.avg_deal_size ?? 0)
const avgSalesCycleDays = computed(() => summary.value?.avg_sales_cycle_days ?? 0)
const pipelineCoverageRatio = computed(() => summary.value?.pipeline_coverage_ratio ?? 0)
const quarterlySalesTarget = computed(() => summary.value?.quarterly_sales_target ?? 0)
const isPipelineHealthy = computed(() => pipelineCoverageRatio.value >= 1)
const annualRevenueGoal = computed(() => summary.value?.annual_revenue_goal ?? 0)
const annualRevenueActual = computed(() => summary.value?.annual_revenue_actual ?? 0)
const annualRevenueProgressRatio = computed(() => summary.value?.annual_revenue_progress_ratio ?? 0)
const annualGoalProgressPercent = computed(() => Math.round(annualRevenueProgressRatio.value * 100))
const annualRevenueTrend = computed(() => summary.value?.annual_revenue_trend ?? [])
// On track = this year's cumulative actual has kept pace with a straight-line
// goal_pace for the months elapsed so far (dashboard.go's annualRevenueTrend(),
// annualGoal × monthsElapsed/12) — not a flat >= 100% bar like isPipelineHealthy,
// since the annual goal isn't expected to be fully met until December. Reads
// the trend's own last point rather than re-deriving a pro-rated expectation
// client-side (e.g. from today's day-of-year), so this indicator can never
// disagree with the "Annual Goal Pace" chart below, which colors its bars
// against that exact same actual-vs-goal_pace comparison.
const isAnnualGoalOnTrack = computed(() => {
  const latest = annualRevenueTrend.value[annualRevenueTrend.value.length - 1]
  return latest ? latest.actual >= latest.goal_pace : false
})

const UPCOMING_TASKS_LIMIT = 6
const { resolveRelated } = useRelatedRecord()

const upcomingTasks = computed(() => {
  const now = Date.now()
  return tasksStore.pending
    .map(task => ({ ...task, ...resolveRelated(task.related_type, task.related_id), isOverdue: isTaskOverdue(task, now) }))
    .sort((a, b) => a.due_date.getTime() - b.due_date.getTime())
    .slice(0, UPCOMING_TASKS_LIMIT)
})

// upsell_opportunities is always [] server-side today (not yet implemented), so every
// tier's candidate list stays empty until the backend fills it in.
const upsellGroups = computed(() => [
  { tier: 'tier1', label: t('crm.dashboard.upsellTier60'), candidates: [] as { company: Company, contact: { color: string, label: string } }[] },
  { tier: 'tier2', label: t('crm.dashboard.upsellTier90'), candidates: [] as { company: Company, contact: { color: string, label: string } }[] },
  { tier: 'tier3', label: t('crm.dashboard.upsellTier120'), candidates: [] as { company: Company, contact: { color: string, label: string } }[] },
])


// Every stage always renders a bar (even at zero) — the backend only returns rows for
// stages with at least one deal, so missing stages are filled in at zero here.
const stageBreakdown = computed(() => {
  const stats = new Map(pipelineStagesStore.activeOptions.map(stage => [stage.value, { value: 0, count: 0 }]))
  for (const row of summary.value?.stage_breakdown ?? []) {
    const stat = stats.get(row.stage)
    if (stat) { stat.value = row.value; stat.count = row.count }
  }
  const maxValue = Math.max(...[...stats.values()].map(s => s.value), 1)
  let openIndex = 0
  return pipelineStagesStore.activeOptions.map((stage) => {
    const stat = stats.get(stage.value)!
    const row = pipelineStagesStore.byName(String(stage.value))
    const barClass = row?.is_won_stage
      ? 'bg-[var(--color-success-toast)]'
      : row?.is_lost_stage
        ? 'bg-[var(--color-chart-lost)]'
        : (CHART_CATEGORICAL_COLORS[openIndex++] ?? CHART_FALLBACK_COLOR).bar
    return {
      stage: stage.label,
      value: stat.value,
      count: stat.count,
      percent: Math.round((stat.value / maxValue) * 100),
      barClass,
    }
  })
})

// Reuses stageBreakdown's already-built {stage, value, count, barClass} rows
// rather than re-deriving from summary.stage_breakdown a second time —
// funnelStages just drops the Lost-flagged stage(s) (a funnel shows forward
// progression; Lost is an exit, not a step in it) and switches from $ value
// to deal count, since a funnel's job is showing where deals drop off, not
// how much money sits in each stage (that's what the bar chart above is for).
const funnelStages = computed(() => stageBreakdown.value
  .filter(row => !pipelineStagesStore.byName(row.stage)?.is_lost_stage)
  .map(row => ({ label: row.stage, value: row.count, barClass: row.barClass })))

// Fallback stage labels for the empty-state preview only — used when there
// are no pipeline stages configured at all, so there's nothing in
// funnelStages to borrow real labels/colors from. Real deployments always
// have stages configured (FR-CRM-021), so this is purely illustrative.
const FUNNEL_PREVIEW_FALLBACK_STAGES = ['Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won']

// Same stages/labels/colors as funnelStages, but with a fabricated
// decreasing count per stage so the empty state shows what a real funnel
// shape looks like instead of just a "no data" message.
const funnelStagesPreview = computed(() => {
  const base = funnelStages.value.length > 0
    ? funnelStages.value
    : FUNNEL_PREVIEW_FALLBACK_STAGES.map(label => ({ label, value: 0, barClass: undefined }))
  return base.map((stage, index) => ({ ...stage, value: Math.max(5, Math.round(100 * 0.6 ** index)) }))
})

// lostValue isn't in DashboardSummary directly — it's exactly the Lost-flagged
// stage's `value` in stage_breakdown (every deal in a terminal Lost stage is,
// by definition, closed-lost), summed in case more than one stage is flagged
// is_lost_stage. Reduces a second query round-trip to zero: stage_breakdown
// already has this, it just needed picking out.
const lostValue = computed(() => stageBreakdown.value
  .filter(row => pipelineStagesStore.byName(row.stage)?.is_lost_stage)
  .reduce((sum, row) => sum + row.value, 0))

const outcomeTotal = computed(() => wonValue.value + lostValue.value + openPipelineValue.value)

// Won/Lost/Open are states, not identity — colored with the app's existing
// status tokens (success/danger/gray, already used for e.g. isPipelineHealthy)
// rather than the categorical chart palette, and each carries an icon +
// label in the legend so the state never reads from color alone.
const outcomeDonutSegments = computed(() => [
  {
    label: t('crm.dashboard.outcomeWon'),
    value: wonValue.value,
    valueLabel: `${t('global.currencySymbol')}${priceFormatCompact(wonValue.value)}`,
    colorVar: 'var(--color-success-toast)',
    icon: 'material-symbols:check-circle-outline',
  },
  {
    label: t('crm.dashboard.outcomeLost'),
    value: lostValue.value,
    valueLabel: `${t('global.currencySymbol')}${priceFormatCompact(lostValue.value)}`,
    colorVar: 'var(--color-danger-toast)',
    icon: 'material-symbols:cancel-outline',
  },
  {
    label: t('crm.dashboard.outcomeOpen'),
    value: openPipelineValue.value,
    valueLabel: `${t('global.currencySymbol')}${priceFormatCompact(openPipelineValue.value)}`,
    colorVar: 'var(--color-gray)',
    icon: 'material-symbols:radio-button-unchecked',
  },
])

// Illustrative Won/Lost/Open split for the empty-state preview only — real
// values are always 0 with no deals yet, so these are fabricated purely to
// show what the donut looks like once real data exists.
const OUTCOME_PREVIEW_SAMPLE_VALUES = [600000, 150000, 250000]
const outcomeDonutSegmentsPreview = computed(() => outcomeDonutSegments.value.map((seg, index) => {
  const sampleValue = OUTCOME_PREVIEW_SAMPLE_VALUES[index] ?? 100000
  return {
    ...seg,
    value: sampleValue,
    valueLabel: `${t('global.currencySymbol')}${priceFormatCompact(sampleValue)}`,
  }
}))
const outcomeTotalPreviewLabel = computed(() => `${t('global.currencySymbol')}${priceFormatCompact(OUTCOME_PREVIEW_SAMPLE_VALUES.reduce((sum, v) => sum + v, 0))}`)

const revenueTrend = computed(() => {
  const points = summary.value?.revenue_trend ?? []
  const maxValue = Math.max(...points.map(p => p.value), 1)
  return points.map(p => ({ ...p, percent: Math.round((p.value / maxValue) * 100) }))
})

const forecastTrend = computed(() => {
  const points = summary.value?.forecast_trend ?? []
  const maxValue = Math.max(...points.map(p => p.value), 1)
  return points.map(p => ({ ...p, percent: Math.round((p.value / maxValue) * 100) }))
})

// Scaled against the full-year goal (not just this year's tallest month) so
// the bars visibly grow toward the goal_pace line as the year progresses,
// rather than each bucket being re-scaled to its own neighbors.
const annualRevenueTrendChart = computed(() => {
  const points = annualRevenueTrend.value
  const maxValue = Math.max(annualRevenueGoal.value, ...points.map(p => p.actual), 1)
  return points.map(p => ({
    ...p,
    actualPercent: Math.round((p.actual / maxValue) * 100),
    goalPacePercent: Math.round((p.goal_pace / maxValue) * 100),
  }))
})

const industryBreakdown = computed(() => {
  return (summary.value?.industry_breakdown ?? [])
    .map(row => ({ industry: row.industry, wonCount: row.won_count, winRate: Math.round(row.win_rate) }))
    .sort((a, b) => b.winRate - a.winRate)
    .map((row, index) => ({ ...row, barClass: (CHART_CATEGORICAL_COLORS[index] ?? CHART_FALLBACK_COLOR).bar }))
})

const teamPerformance = computed(() => {
  return (summary.value?.team_performance ?? [])
    .map(row => ({
      id: row.user_id,
      name: row.name,
      initials: row.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
      wonCount: row.won_count,
      wonValue: row.won_value,
      winRate: Math.round(row.win_rate),
    }))
    .sort((a, b) => b.wonValue - a.wonValue)
})
</script>
