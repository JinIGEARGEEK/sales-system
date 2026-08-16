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
          v-model="channelFilter"
          :options="CHANNEL_FILTER_OPTIONS"
          :placeholder="t('crm.dashboard.filterChannel')"
          name="channelFilter"
          class="w-36"
        />
        <InputSelect
          v-model="salesRepFilter"
          :options="salesRepOptions"
          :placeholder="t('crm.dashboard.filterSalesRep')"
          name="salesRepFilter"
          class="w-44"
        />
        <InputText
          v-model="companyTagFilter"
          :placeholder="t('crm.dashboard.filterCompanyTagPlaceholder')"
          name="companyTagFilter"
          class="w-40"
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
        {{ openDealsCount }} <span class="text-sm font-normal text-[var(--color-gray)]">{{ t('crm.dashboard.dealsUnit') }}</span>
      </CrmStatCard>
    </div>

    <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          {{ t(isPipelineHealthy ? 'crm.dashboard.onTrack' : 'crm.dashboard.belowTarget') }} · {{ t('crm.dashboard.pipelineCoverageHint', { target: `${priceFormat(quarterlySalesTarget)} ${t('crm.dashboard.currencyUnit')}` }) }}
        </template>
      </CrmStatCard>
    </div>

    <div class="mb-4">
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

    <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
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

    <div class="mb-4">
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
              <p class="truncate text-xs text-[var(--color-gray)]">{{ task.relatedLabel }} · {{ teamMembersStore.nameById(task.assigned_to) }}</p>
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
  DEAL_STAGE_OPTIONS,
  BUSINESS_UNIT_FILTER_OPTIONS,
  CHANNEL_FILTER_OPTIONS,
  isTaskOverdue,
} from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.dashboard.pageTitle') })

const { $api } = useNuxtApp()
const { priceFormat, dateFormat } = useFormatter()
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

// Every stage always renders a bar (even at zero) — the backend only returns rows for
// stages with at least one deal, so missing stages are filled in at zero here.
const stageBreakdown = computed(() => {
  const stats = new Map(DEAL_STAGE_OPTIONS.map(stage => [stage.value, { value: 0, count: 0 }]))
  for (const row of summary.value?.stage_breakdown ?? []) {
    const stat = stats.get(row.stage)
    if (stat) { stat.value = row.value; stat.count = row.count }
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

const revenueTrend = computed(() => {
  const points = summary.value?.revenue_trend ?? []
  const maxValue = Math.max(...points.map(p => p.value), 1)
  return points.map(p => ({ ...p, percent: Math.round((p.value / maxValue) * 100) }))
})

const industryBreakdown = computed(() => {
  return (summary.value?.industry_breakdown ?? [])
    .map(row => ({ industry: row.industry, wonCount: row.won_count, winRate: Math.round(row.win_rate) }))
    .sort((a, b) => b.winRate - a.winRate)
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
