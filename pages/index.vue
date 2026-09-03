<template>
  <div class="p-5">
    <div class="mb-6">
      <h2 class="text-xl font-black">{{ t('crm.dashboard.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.dashboard.subheading') }}</p>
    </div>

    <!-- Only rendered for a role that can see both tabs (Admin/Sales Manager,
    the only roles in both SALES_PIPELINE_ROLES and PROSPECT_ROLES) — a Sales
    Rep or Marketing-only user has just the one tab's content, with no
    switcher to a tab they can't see anyway. -->
    <UTabs v-if="showDashboardTabs" v-model="activeDashboardTab" :items="dashboardTabItems" class="mb-4" />

    <template v-if="activeDashboardTab === 'sales'">
      <DashboardFilterBar
        :date-range="dateRange"
        :active-preset="activePreset"
        :period-presets="PERIOD_PRESETS"
        :business-unit-filter="businessUnitFilter"
        :business-unit-options="BUSINESS_UNIT_FILTER_OPTIONS"
        :channel-filter="channelFilter"
        :channel-options="channelFilterOptions"
        :sales-rep-filter="salesRepFilter"
        :sales-rep-options="salesRepOptions"
        :company-tag-filter="companyTagFilter"
        :filtered-count="filteredDeals.length"
        :total-count="dealsStore.items.length"
        @update:date-range="dateRange = $event"
        @apply-preset="applyPeriodPreset"
        @update:business-unit-filter="businessUnitFilter = $event"
        @update:channel-filter="channelFilter = $event"
        @update:sales-rep-filter="salesRepFilter = $event"
        @update:company-tag-filter="companyTagFilter = $event"
        @clear-filters="clearFilters"
      />

      <!-- Open pipeline value/forecast/win rate/quota, revenue trends, stage
      breakdown, funnel, and outcome split are all Deal-derived numbers with no
      meaning outside the sales pipeline — hidden from Marketing/Production
      (SALES_PIPELINE_ROLES), same restriction as the Leads/Deals/Companies/
      Contacts nav items and GlobalSearch results. -->
      <template v-if="canViewSalesPipelineWidgets">
        <DashboardPipelineOverview
          :open-pipeline-value="openPipelineValue"
          :forecasted-revenue="forecastedRevenue"
          :win-rate="winRate"
          :open-deals-count="openDealsCount"
          :won-value="wonValue"
          :avg-deal-size="avgDealSize"
          :avg-sales-cycle-days="avgSalesCycleDays"
          :pipeline-coverage-ratio="pipelineCoverageRatio"
          :is-pipeline-healthy="isPipelineHealthy"
          :quarterly-sales-target="quarterlySalesTarget"
          :annual-goal-progress-percent="annualGoalProgressPercent"
          :is-annual-goal-on-track="isAnnualGoalOnTrack"
          :annual-revenue-actual="annualRevenueActual"
          :annual-revenue-goal="annualRevenueGoal"
        />

        <DashboardTrends
          :revenue-trend="revenueTrend"
          :forecast-trend="forecastTrend"
          :annual-revenue-trend-chart="annualRevenueTrendChart"
        />

        <DashboardPipelineOpportunities
          :stage-breakdown="stageBreakdown"
          :upsell-groups="upsellGroups"
          :funnel-stages="funnelStages"
          :funnel-stages-preview="funnelStagesPreview"
          :outcome-donut-segments="outcomeDonutSegments"
          :outcome-donut-segments-preview="outcomeDonutSegmentsPreview"
          :outcome-total="outcomeTotal"
          :outcome-total-preview-label="outcomeTotalPreviewLabel"
        />
      </template>
    </template>

    <!-- Marketing's own tab — Prospect funnel counts/status/source breakdown,
    hidden from anyone outside PROSPECT_ROLES the same way the tab itself is
    (canViewProspectSummary gate is still needed here even without the tab
    switcher, since activeDashboardTab could still equal 'marketing' for a
    role that only qualifies for one tab). -->
    <DashboardMarketingSummary v-if="activeDashboardTab === 'marketing' && canViewProspectSummary" :summary="prospectSummary" />

    <DashboardFollowUpsTeam
      :upcoming-tasks="upcomingTasks"
      :can-view-sales-pipeline-widgets="canViewSalesPipelineWidgets"
      :recent-alerts="recentAlerts"
      :industry-breakdown="industryBreakdown"
      :team-performance="teamPerformance"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  BUSINESS_UNIT_FILTER_OPTIONS,
  isTaskOverdue,
} from '~/constants/mockData'
import { CHART_CATEGORICAL_COLORS, CHART_FALLBACK_COLOR } from '~/constants/ui'
import { SALES_PIPELINE_ROLES, PROSPECT_ROLES } from '~/constants/roles'

const { t } = useI18n()
const { hasRole } = useRole()
// Upsell Opportunities/Recent Alerts link straight into Company/Deal detail
// pages, which aren't a primary destination for Production (same
// SALES_PIPELINE_ROLES exclusion as the sidebar nav and GlobalSearch) — this
// dashboard was the one remaining place that restriction wasn't mirrored.
const canViewSalesPipelineWidgets = computed(() => hasRole(...SALES_PIPELINE_ROLES))
// Marketing's own tab — Prospect funnel data, meaningless to a plain Sales
// Rep (excluded from PROSPECT_ROLES) the same way Deal data is meaningless
// to Marketing.
const canViewProspectSummary = computed(() => hasRole(...PROSPECT_ROLES))
// Only Admin/Sales Manager are in both role lists — everyone else has just
// one tab's worth of content, so no switcher is shown at all for them.
const showDashboardTabs = computed(() => canViewSalesPipelineWidgets.value && canViewProspectSummary.value)
const dashboardTabItems = computed(() => [
  { label: t('crm.dashboard.tabSales'), value: 'sales' },
  { label: t('crm.dashboard.tabMarketing'), value: 'marketing' },
])
const activeDashboardTab = ref<'sales' | 'marketing'>('sales')
// Defaults a Marketing-only user straight onto their own tab instead of
// landing on an empty "sales" tab they can't see anything on. Role
// resolution can land after mount (hydrate-auth.client.ts), hence `watch`
// with `immediate` rather than a one-shot computed at setup time.
watch(canViewSalesPipelineWidgets, (canViewSales) => {
  if (!canViewSales && canViewProspectSummary.value) activeDashboardTab.value = 'marketing'
}, { immediate: true })
const { error } = useNotify()
// Every fire-and-forget fetch below is a bare `if (...) store.fetchAll()` (no
// `await`, no caller-side try/catch) — this dashboard has none of the loading
// components' own error handling, so a failed request would otherwise be a
// silent unhandled rejection with no user-facing feedback. Route every one
// through this so a network/API failure at least surfaces a toast.
const notifyFetchError = (err: unknown) => error(getApiErrorMessage(err, t('global.genericError')))

useHead({ title: t('crm.dashboard.pageTitle') })

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
const { priceFormatCompact } = useFormatter()
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

// teamMembersStore.filterOptions already provides a correct "All Team
// Members" catch-all — reuse it instead of reimplementing it here (the
// previous local version mistakenly used the field's own label,
// "พนักงานขาย"/"Sales Rep", as the catch-all's label).
const salesRepOptions = computed(() => teamMembersStore.filterOptions)

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

// Marketing's own tab — deliberately its own fetch/params, not folded into
// fetchSummary above: this dashboard's date range/business-unit/channel/
// company-tag filter bar is Deal-specific (only shown on the "sales" tab),
// so the Prospect summary just refetches once on mount rather than reacting
// to filters that don't apply to it.
const prospectSummary = ref<ProspectDashboardSummary | null>(null)
const fetchProspectSummary = async () => {
  if (!canViewProspectSummary.value) return
  try {
    const response = await $api.get<ApiResponse<ProspectDashboardSummary>>('/dashboard/prospect-summary')
    prospectSummary.value = response.data.data
  } catch (err) {
    notifyFetchError(err)
  }
}
watch(canViewProspectSummary, (canView) => {
  if (canView && !prospectSummary.value) fetchProspectSummary()
}, { immediate: true })

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

// Deal/Contact/Company-linked tasks resolve to pages nav-hides from
// Marketing/Production (SALES_PIPELINE_ROLES) — previously this widget
// surfaced them to every role regardless, so a Marketing/Production user
// could click straight into a Deal detail page with no nav trail back.
// Prospect-linked tasks stay visible to everyone since Marketing owns that
// entity; Production has no task-linked entity of its own (Tasks aren't
// tied to Projects), so it sees none here, matching its "not a full CRM
// user" scope.
const upcomingTasks = computed(() => {
  const now = Date.now()
  return tasksStore.pending
    .filter(task => canViewSalesPipelineWidgets.value || task.related_type === 'prospect')
    .map(task => ({
      ...task,
      ...resolveRelated(task.related_type, task.related_id),
      isOverdue: isTaskOverdue(task, now),
      assignedToName: teamMembersStore.nameById(task.assigned_to),
    }))
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
