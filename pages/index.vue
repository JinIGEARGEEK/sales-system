<template>
  <div class="p-5">
    <div class="mb-6">
      <h2 class="text-xl font-black">{{ t('crm.dashboard.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.dashboard.subheading') }}</p>
    </div>

    <UCard class="mb-6" :ui="GLASS_PANEL_UI">
      <div class="flex flex-wrap items-center gap-2">
        <UIcon name="material-symbols:filter-alt-outline" class="size-4 shrink-0 text-[var(--color-gray)]" />
        <UButton
          v-for="preset in PERIOD_PRESETS"
          :key="preset.value"
          :label="preset.label"
          size="xs"
          :variant="activePreset === preset.value ? 'solid' : 'outline'"
          :color="activePreset === preset.value ? 'primary' : 'neutral'"
          @click="applyPeriodPreset(preset.value)"
        />
        <InputDateRangePicker
          v-model="dateRange"
          :placeholder="t('crm.dashboard.filterDateRange')"
          name="dateRange"
          size="xs"
          class="w-64"
        />
        <UButton
          :label="showAdvancedFilters ? t('crm.dashboard.fewerFilters') : t('crm.dashboard.moreFilters')"
          :icon="showAdvancedFilters ? 'material-symbols:expand-less' : 'material-symbols:expand-more'"
          size="xs"
          variant="outline"
          :color="advancedFilterCount > 0 ? 'primary' : 'neutral'"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <template v-if="advancedFilterCount > 0" #trailing>
            <UBadge :label="advancedFilterCount" size="xs" color="primary" variant="solid" />
          </template>
        </UButton>
        <UButton
          v-if="hasActiveFilters"
          icon="material-symbols:filter-alt-off-outline"
          variant="outline"
          color="neutral"
          size="xs"
          square
          :aria-label="t('crm.dashboard.clearFilters')"
          @click="clearFilters"
        />
        <span class="ml-auto text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.showingDeals', { count: filteredDeals.length, total: dealsStore.items.length }) }}</span>
      </div>

      <div v-if="showAdvancedFilters" class="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-light-gray-2)] pt-3">
        <InputSelect
          v-model="businessUnitFilter"
          :options="BUSINESS_UNIT_FILTER_OPTIONS"
          :placeholder="t('crm.dashboard.filterBusinessUnit')"
          name="businessUnitFilter"
          size="xs"
          class="w-40"
        />
        <InputSelect
          v-model="channelFilter"
          :options="channelFilterOptions"
          :placeholder="t('crm.dashboard.filterChannel')"
          name="channelFilter"
          size="xs"
          class="w-36"
        />
        <InputSelect
          v-model="salesRepFilter"
          :options="salesRepOptions"
          :placeholder="t('crm.dashboard.filterSalesRep')"
          name="salesRepFilter"
          size="xs"
          class="w-44"
        />
        <InputText
          v-model="companyTagFilter"
          :placeholder="t('crm.dashboard.filterCompanyTagPlaceholder')"
          name="companyTagFilter"
          size="xs"
          class="w-40"
        />
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

    <!-- Primary: the numbers that answer "how's the pipeline doing right now" -->
    <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <CrmStatCard
        :label="t('crm.dashboard.openPipelineValue')"
        icon="material-symbols:account-balance-wallet-outline"
        icon-class="text-[var(--color-accent-green)]"
        icon-bg-class="bg-[var(--color-accent-green)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-accent-green)]/20 to-transparent"
      >
        {{ t('crm.dashboard.currencySymbol') }}{{ priceFormatCompact(openPipelineValue) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.forecastedRevenue')"
        icon="material-symbols:query-stats"
        icon-class="text-[var(--color-info-toast)]"
        icon-bg-class="bg-[var(--color-info-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-info-toast)]/20 to-transparent"
      >
        {{ t('crm.dashboard.currencySymbol') }}{{ priceFormatCompact(forecastedRevenue) }}
        <template #hint>{{ t('crm.dashboard.forecastedRevenueHint') }}</template>
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.winRate')"
        :icon="winRate >= 50 ? 'material-symbols:trending-up' : 'material-symbols:trending-down'"
        :icon-bg-class="winRate >= 50 ? 'bg-[var(--color-success-toast)]/25' : 'bg-[var(--color-gray)]/25'"
        :value-class="winRate >= 50 ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-black)]'"
        :accent-glass-class="winRate >= 50 ? 'bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent' : 'bg-gradient-to-r from-[var(--color-gray)]/20 to-transparent'"
      >
        {{ winRate }}%
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.openDeals')"
        icon="material-symbols:work-outline"
        icon-class="text-[var(--color-warning-hover)]"
        icon-bg-class="bg-[var(--color-warning-hover)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-warning-hover)]/20 to-transparent"
      >
        {{ openDealsCount }} <span class="text-sm font-normal text-[var(--color-gray)]">{{ t('crm.dashboard.dealsUnit') }}</span>
      </CrmStatCard>
    </div>

    <!-- Secondary: deeper diagnostics, one deliberate row instead of a leftover single card -->
    <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <CrmStatCard
        :label="t('crm.dashboard.wonThisPeriod')"
        icon="material-symbols:workspace-premium-outline"
        icon-class="text-[var(--color-success-toast)]"
        icon-bg-class="bg-[var(--color-success-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent"
      >
        {{ t('crm.dashboard.currencySymbol') }}{{ priceFormatCompact(wonValue) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.avgDealSize')"
        icon="material-symbols:payments-outline"
        icon-class="text-[var(--color-chart-violet)]"
        icon-bg-class="bg-[var(--color-chart-violet)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-chart-violet)]/20 to-transparent"
      >
        {{ t('crm.dashboard.currencySymbol') }}{{ priceFormatCompact(avgDealSize) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.avgSalesCycle')"
        icon="material-symbols:schedule-outline"
        icon-class="text-[var(--color-info-toast)]"
        icon-bg-class="bg-[var(--color-info-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-info-toast)]/20 to-transparent"
      >
        {{ t('crm.dashboard.avgSalesCycleDays', { days: avgSalesCycleDays }) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.pipelineCoverage')"
        :icon="isPipelineHealthy ? 'material-symbols:check-circle-outline' : 'material-symbols:warning-outline'"
        :icon-bg-class="isPipelineHealthy ? 'bg-[var(--color-success-toast)]/25' : 'bg-[var(--color-danger-toast)]/25'"
        :value-class="isPipelineHealthy ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
        :hint-class="isPipelineHealthy ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
        :accent-glass-class="isPipelineHealthy ? 'bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent' : 'bg-gradient-to-r from-[var(--color-danger-toast)]/20 to-transparent'"
      >
        {{ pipelineCoverageRatio.toFixed(1) }}x
        <template #hint>
          {{ t(isPipelineHealthy ? 'crm.dashboard.onTrack' : 'crm.dashboard.belowTarget') }} · {{ t('crm.dashboard.pipelineCoverageHint', { target: `${priceFormat(quarterlySalesTarget)} ${t('crm.dashboard.currencyUnit')}` }) }}
        </template>
      </CrmStatCard>
    </div>

    <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
              {{ t('crm.dashboard.currencySymbol') }}{{ priceFormatCompact(bucket.value) }}
            </span>
            <UTooltip :text="`${bucket.label}: ${t('crm.dashboard.currencySymbol')}${priceFormatCompact(bucket.value)}`">
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
              {{ t('crm.dashboard.currencySymbol') }}{{ priceFormatCompact(bucket.value) }}
            </span>
            <UTooltip :text="`${bucket.label}: ${t('crm.dashboard.currencySymbol')}${priceFormatCompact(bucket.value)}`">
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

    <div class="mb-6 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
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
              :tooltip="`${row.stage}: ${t('crm.dashboard.currencySymbol')}${priceFormatCompact(row.value)} · ${row.count} ${t('crm.dashboard.dealsUnit')}`"
            >
              <span class="w-24 shrink-0 text-right text-sm text-[var(--color-gray)]">{{ t('crm.dashboard.currencySymbol') }}{{ priceFormatCompact(row.value) }}</span>
              <span class="w-20 shrink-0 text-right text-xs text-[var(--color-gray)]">{{ row.count }} {{ t('crm.dashboard.dealsUnit') }}</span>
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
              <span class="w-14 shrink-0 text-right text-sm text-[var(--color-gray)]">{{ row.winRate }}%</span>
              <span class="w-16 shrink-0 text-right text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.dealsWon', { count: row.wonCount }) }}</span>
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
              <span class="text-sm font-medium">{{ t('crm.dashboard.currencySymbol') }}{{ priceFormatCompact(member.wonValue) }}</span>
            </div>
          </div>
        </UCard>
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
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.dashboard.pageTitle') })

const pipelineStagesStore = usePipelineStagesStore()
const leadSourcesStore = useLeadSourcesStore()
onMounted(() => {
  if (pipelineStagesStore.items.length === 0) pipelineStagesStore.fetchAll()
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll()
})

// Admin-configurable stage/source lists (replaces the previously hardcoded
// DEAL_STAGE_OPTIONS/CHANNEL_OPTIONS constants).
const channelFilterOptions = computed(() => [
  { label: 'All Channels', value: 'all' },
  ...leadSourcesStore.activeOptions,
])

const { $api } = useNuxtApp()
const { priceFormat, priceFormatCompact, dateFormat } = useFormatter()
const companiesStore = useCompaniesStore()
const dealsStore = useDealsStore()
const tasksStore = useTasksStore()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (dealsStore.items.length === 0) dealsStore.fetchAll()
  if (tasksStore.items.length === 0) tasksStore.fetchAll()
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll()
})

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

const salesRepOptions = computed(() => [
  { label: t('crm.dashboard.filterSalesRep'), value: 'all' },
  ...teamMembersStore.options,
])

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

// Fixed categorical order, validated together (light mode, all 6 checks pass)
// via the dataviz skill's validate_palette.js — never cycled within one chart,
// a 5th+ open stage or industry falls back to neutral gray instead of reusing
// a hue. Kept in this file (not global.css) since it's chart-assignment
// order, not a token value.
const CHART_CATEGORICAL_CLASSES = [
  'bg-[var(--color-accent-green)]',
  'bg-[var(--color-info-toast)]',
  'bg-[var(--color-warning-hover)]',
  'bg-[var(--color-chart-violet)]',
]
const CHART_FALLBACK_CLASS = 'bg-[var(--color-gray)]/50'

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
        : CHART_CATEGORICAL_CLASSES[openIndex++] ?? CHART_FALLBACK_CLASS
    return {
      stage: stage.label,
      value: stat.value,
      count: stat.count,
      percent: Math.round((stat.value / maxValue) * 100),
      barClass,
    }
  })
})

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

const industryBreakdown = computed(() => {
  return (summary.value?.industry_breakdown ?? [])
    .map(row => ({ industry: row.industry, wonCount: row.won_count, winRate: Math.round(row.win_rate) }))
    .sort((a, b) => b.winRate - a.winRate)
    .map((row, index) => ({ ...row, barClass: CHART_CATEGORICAL_CLASSES[index] ?? CHART_FALLBACK_CLASS }))
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
