<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.dashboard.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.dashboard.subheading') }}</p>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
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
          class="w-64"
        />
        <InputSelect
          v-model="businessUnitFilter"
          :options="BUSINESS_UNIT_FILTER_OPTIONS"
          :placeholder="t('crm.dashboard.filterBusinessUnit')"
          name="businessUnitFilter"
          class="w-40"
        />
        <InputSelect
          v-if="businessUnitFilter === 'Project'"
          v-model="projectFilter"
          :options="PROJECT_FILTER_OPTIONS"
          :placeholder="t('crm.dashboard.filterProject')"
          name="projectFilter"
          class="w-40"
        />
        <InputSelect
          v-if="businessUnitFilter === 'Product'"
          v-model="productFilter"
          :options="PRODUCT_FILTER_OPTIONS"
          :placeholder="t('crm.dashboard.filterProduct')"
          name="productFilter"
          class="w-40"
        />
        <InputSelect
          v-model="channelFilter"
          :options="CHANNEL_FILTER_OPTIONS"
          :placeholder="t('crm.dashboard.filterChannel')"
          name="channelFilter"
          class="w-36"
        />
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
    </UCard>

    <UAlert
      v-if="filteredDeals.length === 0"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="material-symbols:search-off-outline"
      :title="t('crm.dashboard.noDealsMatch')"
      :ui="{ root: 'p-2', icon: 'size-4' }"
    />

    <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <CrmStatCard :label="t('crm.dashboard.openPipelineValue')">
        {{ priceFormat(openPipelineValue) }} <span class="text-sm font-normal text-[var(--color-gray)]">{{ t('crm.dashboard.currencyUnit') }}</span>
      </CrmStatCard>
      <CrmStatCard :label="t('crm.dashboard.wonThisPeriod')">
        {{ priceFormat(wonValue) }} <span class="text-sm font-normal text-[var(--color-gray)]">{{ t('crm.dashboard.currencyUnit') }}</span>
      </CrmStatCard>
      <CrmStatCard :label="t('crm.dashboard.winRate')" :value-class="winRate >= 50 ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-black)]'">
        {{ winRate }}%
      </CrmStatCard>
      <CrmStatCard :label="t('crm.dashboard.openDeals')">
        {{ openDeals.length }} <span class="text-sm font-normal text-[var(--color-gray)]">{{ t('crm.dashboard.dealsUnit') }}</span>
      </CrmStatCard>
    </div>

    <div class="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <CrmStatCard :label="t('crm.dashboard.avgDealSize')">
        {{ priceFormat(avgDealSize) }} <span class="text-sm font-normal text-[var(--color-gray)]">{{ t('crm.dashboard.currencyUnit') }}</span>
      </CrmStatCard>
      <CrmStatCard :label="t('crm.dashboard.avgSalesCycle')">
        {{ t('crm.dashboard.avgSalesCycleDays', { days: avgSalesCycleDays }) }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.pipelineCoverage')"
        :value-class="isPipelineHealthy ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
        :hint-class="isPipelineHealthy ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
      >
        {{ pipelineCoverageRatio.toFixed(1) }}x
        <template #hint>
          {{ t(isPipelineHealthy ? 'crm.dashboard.onTrack' : 'crm.dashboard.belowTarget') }} · {{ t('crm.dashboard.pipelineCoverageHint', { target: `${priceFormat(QUARTERLY_SALES_TARGET)} ${t('crm.dashboard.currencyUnit')}` }) }}
        </template>
      </CrmStatCard>
    </div>

    <div class="mb-8">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <h3 class="text-lg font-medium">{{ t('crm.dashboard.revenueTrend') }}</h3>
          <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.revenueTrendHint') }}</p>
        </template>
        <div class="flex h-40 items-end gap-4 px-2">
          <div v-for="bucket in revenueTrend" :key="bucket.label" class="flex flex-1 flex-col items-center gap-2">
            <span class="text-xs font-medium" :class="bucket.value > 0 ? 'text-[var(--color-black)]' : 'text-[var(--color-gray)]'">
              {{ priceFormat(bucket.value) }} {{ t('crm.dashboard.currencyUnit') }}
            </span>
            <div class="flex h-28 w-full items-end overflow-hidden rounded-t-md bg-[var(--color-light-gray-2)]">
              <div
                class="w-full rounded-t-md"
                :class="bucket.value > 0 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-gray)]/40'"
                :style="`height: ${Math.max(bucket.percent, 4)}%`"
              />
            </div>
            <span class="text-xs text-[var(--color-gray)]">{{ bucket.label }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div class="lg:col-span-3">
        <UCard class="ring-[var(--color-card-border)]">
          <template #header>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.pipelineByStage') }}</h3>
          </template>
          <div class="flex flex-col gap-3">
            <CrmMetricBar v-for="row in stageBreakdown" :key="row.stage" :label="row.stage" :percent="row.percent">
              <span class="w-36 shrink-0 text-right text-sm text-[var(--color-gray)]">{{ priceFormat(row.value) }} {{ t('crm.dashboard.currencyUnit') }}</span>
              <span class="w-20 shrink-0 text-right text-xs text-[var(--color-gray)]">{{ row.count }} {{ t('crm.dashboard.dealsUnit') }}</span>
            </CrmMetricBar>
          </div>
        </UCard>
      </div>

      <div class="lg:col-span-2">
        <UCard class="ring-[var(--color-card-border)]">
          <template #header>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.upsellOpportunities') }}</h3>
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

    <div class="mb-8">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <h3 class="text-lg font-medium">{{ t('crm.dashboard.upcomingFollowUps') }}</h3>
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
              <p class="truncate text-xs text-[var(--color-gray)]">{{ task.relatedLabel }} · {{ teamMemberNameById(task.assigned_to) }}</p>
            </div>
            <UBadge :color="task.isOverdue ? 'error' : 'neutral'" variant="subtle" class="shrink-0">
              {{ dateFormat(task.due_date) }}
            </UBadge>
          </NuxtLink>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div class="lg:col-span-3">
        <UCard class="ring-[var(--color-card-border)]">
          <template #header>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.winRateByIndustry') }}</h3>
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
              bar-class="bg-[var(--color-accent-green)]"
            >
              <span class="w-14 shrink-0 text-right text-sm text-[var(--color-gray)]">{{ row.winRate }}%</span>
              <span class="w-16 shrink-0 text-right text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.dealsWon', { count: row.wonCount }) }}</span>
            </CrmMetricBar>
          </div>
        </UCard>
      </div>

      <div class="lg:col-span-2">
        <UCard class="ring-[var(--color-card-border)]">
          <template #header>
            <h3 class="text-lg font-medium">{{ t('crm.dashboard.teamPerformance') }}</h3>
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
              <span class="text-sm font-medium">{{ priceFormat(member.wonValue) }} {{ t('crm.dashboard.currencyUnit') }}</span>
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
  MOCK_TEAM_MEMBERS,
  DEAL_STAGE_OPTIONS,
  QUARTERLY_SALES_TARGET,
  BUSINESS_UNIT_FILTER_OPTIONS,
  PROJECT_FILTER_OPTIONS,
  PRODUCT_FILTER_OPTIONS,
  CHANNEL_FILTER_OPTIONS,
  lastContactDate,
  teamMemberNameById,
  isTaskOverdue,
} from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.dashboard.pageTitle') })

const { priceFormat, dateFormat } = useFormatter()
const { lastContactInfo } = useLastContact()
const companiesStore = useCompaniesStore()
const dealsStore = useDealsStore()
const tasksStore = useTasksStore()

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (dealsStore.items.length === 0) dealsStore.fetchAll()
})

const PERIOD_PRESET_VALUES = ['all', 'month', 'quarter', 'year', 'last6', 'last12']

const { dateRange, activePreset, applyPeriodPreset, isDealInRange, anchorDate } = useDatePeriodFilter(() => dealsStore.items, PERIOD_PRESET_VALUES)

const PERIOD_PRESETS = computed(() => [
  { label: t('crm.dashboard.periodAll'), value: 'all' },
  { label: t('crm.dashboard.periodThisMonth'), value: 'month' },
  { label: t('crm.dashboard.periodThisQuarter'), value: 'quarter' },
  { label: t('crm.dashboard.periodThisYear'), value: 'year' },
  { label: t('crm.dashboard.periodLast6Months'), value: 'last6' },
  { label: t('crm.dashboard.periodLast12Months'), value: 'last12' },
])

const businessUnitFilter = ref('all')
const projectFilter = ref('all')
const productFilter = ref('all')
const channelFilter = ref('all')

const hasActiveFilters = computed(() => {
  return Boolean(dateRange.value) || businessUnitFilter.value !== 'all' || channelFilter.value !== 'all'
})

const clearFilters = () => {
  dateRange.value = null
  businessUnitFilter.value = 'all'
  projectFilter.value = 'all'
  productFilter.value = 'all'
  channelFilter.value = 'all'
}

const filteredDeals = computed(() => {
  return dealsStore.items.filter((deal) => {
    if (!isDealInRange(deal)) return false
    if (businessUnitFilter.value !== 'all' && deal.business_unit !== businessUnitFilter.value) return false
    if (businessUnitFilter.value === 'Project' && projectFilter.value !== 'all' && deal.business_unit_item !== projectFilter.value) return false
    if (businessUnitFilter.value === 'Product' && productFilter.value !== 'all' && deal.business_unit_item !== productFilter.value) return false
    if (channelFilter.value !== 'all' && deal.channel !== channelFilter.value) return false
    return true
  })
})

const { openDeals, openValue: openPipelineValue, wonValue, winRate, avgDealSize, avgSalesCycleDays } = useDealMetrics(() => filteredDeals.value)

const pipelineCoverageRatio = computed(() => openPipelineValue.value / QUARTERLY_SALES_TARGET)
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

// Shared win-rate calc for any won/lost tally (industry breakdown, team leaderboard, ...).
const winRateOf = (wonCount: number, lostCount: number) => {
  const closed = wonCount + lostCount
  return closed === 0 ? 0 : Math.round((wonCount / closed) * 100)
}

const UPSELL_TIER_GROUPS = computed(() => [
  { tier: 'tier1', label: t('crm.dashboard.upsellTier60') },
  { tier: 'tier2', label: t('crm.dashboard.upsellTier90') },
  { tier: 'tier3', label: t('crm.dashboard.upsellTier120') },
])

const staleCandidates = computed(() => {
  return companiesStore.items
    .filter(company => company.status === 'active')
    .map(company => ({ company, contact: lastContactInfo(lastContactDate(company.id)) }))
    .filter(({ contact }) => contact.isStale)
    .sort((a, b) => (b.contact.days ?? Infinity) - (a.contact.days ?? Infinity))
})

const upsellGroups = computed(() => {
  return UPSELL_TIER_GROUPS.value.map(group => ({
    ...group,
    candidates: staleCandidates.value.filter(({ contact }) => contact.tier === group.tier).slice(0, 5),
  }))
})

const stageBreakdown = computed(() => {
  const stats = new Map(DEAL_STAGE_OPTIONS.map(stage => [stage.value, { value: 0, count: 0 }]))
  for (const deal of filteredDeals.value) {
    const stat = stats.get(deal.stage)!
    stat.value += deal.value
    stat.count += 1
  }
  const maxValue = Math.max(...[...stats.values()].map(s => s.value), 1)
  return DEAL_STAGE_OPTIONS.map((stage) => {
    const stat = stats.get(stage.value)!
    return {
      stage: stage.label,
      value: stat.value,
      count: stat.count,
      percent: Math.round((stat.value / maxValue) * 100),
    }
  })
})

// Last 6 calendar months (oldest first) ending on the most recent deal activity in the
// data set — anchoring to the real current date would run the window dry as mock data ages.
const revenueTrend = computed(() => {
  const latest = anchorDate.value
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(latest.getFullYear(), latest.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 }
  })
  const byKey = new Map(months.map(m => [m.key, m]))
  for (const deal of filteredDeals.value) {
    if (deal.status !== 'won' || !deal.expected_close_date) continue
    const d = new Date(deal.expected_close_date)
    const bucket = byKey.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (bucket) bucket.value += deal.value
  }
  const maxValue = Math.max(...months.map(m => m.value), 1)
  return months.map(m => ({ ...m, percent: Math.round((m.value / maxValue) * 100) }))
})

const industryBreakdown = computed(() => {
  const industryByCompanyId = new Map(companiesStore.items.map(c => [c.id, c.industry]))
  const stats = new Map<string, { wonCount: number; lostCount: number }>()
  for (const deal of filteredDeals.value) {
    if (deal.status !== 'won' && deal.status !== 'lost') continue
    const industry = industryByCompanyId.get(deal.company_id) ?? '-'
    const stat = stats.get(industry) ?? { wonCount: 0, lostCount: 0 }
    if (deal.status === 'won') stat.wonCount += 1
    else stat.lostCount += 1
    stats.set(industry, stat)
  }
  return [...stats.entries()]
    .map(([industry, stat]) => ({
      industry,
      wonCount: stat.wonCount,
      winRate: winRateOf(stat.wonCount, stat.lostCount),
    }))
    .sort((a, b) => b.winRate - a.winRate)
})

const teamPerformance = computed(() => {
  return MOCK_TEAM_MEMBERS
    .map((member) => {
      let wonCount = 0
      let lostCount = 0
      let wonValue = 0
      for (const deal of filteredDeals.value) {
        if (deal.assigned_to !== member.id) continue
        if (deal.status === 'won') { wonCount += 1; wonValue += deal.value }
        else if (deal.status === 'lost') lostCount += 1
      }
      return {
        id: member.id,
        name: member.name,
        initials: member.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
        wonCount,
        wonValue,
        winRate: winRateOf(wonCount, lostCount),
      }
    })
    .sort((a, b) => b.wonValue - a.wonValue)
})
</script>
