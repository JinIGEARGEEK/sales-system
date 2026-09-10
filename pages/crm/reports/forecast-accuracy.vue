<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UButton
          icon="material-symbols:arrow-back"
          variant="ghost"
          color="neutral"
          class="cursor-pointer p-0 hover:bg-transparent"
          :aria-label="t('global.back')"
          @click="goBack()"
        />
        <div>
          <h2 class="text-xl font-black">{{ t('crm.reports.forecastAccuracy.heading') }}</h2>
          <p class="text-sm text-(--color-gray)">{{ t('crm.reports.forecastAccuracy.subheading') }}</p>
        </div>
      </div>
    </div>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <div v-if="latestQuarter" class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CrmStatCard :label="t('crm.reports.forecastAccuracy.latestForecastLabel')" icon="material-symbols:query-stats">
          {{ t('global.currencySymbol') }}{{ priceFormatCompact(latestQuarter.weighted_forecast) }}
          <template #hint>{{ t('crm.reports.forecastAccuracy.forQuarter', { year: latestQuarter.year, quarter: latestQuarter.quarter }) }}</template>
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.forecastAccuracy.latestActualLabel')" icon="material-symbols:payments-outline">
          {{ t('global.currencySymbol') }}{{ priceFormatCompact(latestQuarter.actual_won_to_date) }}
          <template #hint>{{ t('crm.reports.forecastAccuracy.asOf', { date: latestQuarter.snapshot_date }) }}</template>
        </CrmStatCard>
        <CrmStatCard
          :label="t('crm.reports.forecastAccuracy.accuracyLabel')"
          :icon="isAccurate(latestQuarter) ? 'material-symbols:check-circle-outline' : 'material-symbols:warning-outline'"
          :value-class="isAccurate(latestQuarter) ? 'text-(--color-success-toast)' : 'text-(--color-warning-hover)'"
        >
          {{ Math.round(latestQuarter.accuracy_ratio * 100) }}%
          <template #hint>{{ t('crm.reports.forecastAccuracy.accuracyHint') }}</template>
        </CrmStatCard>
      </div>

      <UAlert
        v-if="!loading && quarters.length === 0"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="material-symbols:search-off-outline"
        :title="t('crm.reports.forecastAccuracy.noData')"
        :ui="{ root: 'p-2', icon: 'size-4' }"
      />

      <UCard v-else :ui="GLASS_PANEL_UI">
        <template #header>
          <h3 class="text-sm font-semibold">{{ t('crm.reports.forecastAccuracy.byQuarter') }}</h3>
        </template>
        <TableData
          :columns="columns"
          :rows="displayQuarters"
          :total="displayQuarters.length"
          :total-page="1"
          :per-page="displayQuarters.length || 1"
          :page="1"
          :loading="loading"
        />
      </UCard>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const { t } = useI18n()

useHead({ title: t('crm.reports.forecastAccuracy.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { priceFormatCompact, toBadge } = useFormatter()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

const quarters = ref<ForecastAccuracyQuarter[]>([])
const loading = ref(false)

// Oldest-first from the API (for a left-to-right chart elsewhere); most-recent
// quarter for the headline stat cards is simply the last item.
const latestQuarter = computed(() => quarters.value.at(-1) ?? null)

// Within 15 points of 100% counts as "accurate" — forecasting is inherently
// approximate, this isn't meant to be a pass/fail line, just a quick visual cue.
const isAccurate = (q: ForecastAccuracyQuarter) => Math.abs(q.accuracy_ratio - 1) <= 0.15

const displayQuarters = computed(() => [...quarters.value].reverse().map(q => ({
  ...q,
  periodLabel: t('crm.reports.forecastAccuracy.periodLabel', { year: q.year, quarter: q.quarter }),
  weightedForecastLabel: `${t('global.currencySymbol')}${priceFormatCompact(q.weighted_forecast)}`,
  actualLabel: `${t('global.currencySymbol')}${priceFormatCompact(q.actual_won_to_date)}`,
  accuracyBadge: isAccurate(q)
    ? toBadge(`${Math.round(q.accuracy_ratio * 100)}%`, 'success')
    : toBadge(`${Math.round(q.accuracy_ratio * 100)}%`, 'warning'),
})))

const columns: TableDataColumn[] = [
  { label: t('crm.reports.forecastAccuracy.columns.period'), align: 'left', field: 'periodLabel' },
  { label: t('crm.reports.forecastAccuracy.columns.forecast'), align: 'left', field: 'weightedForecastLabel' },
  { label: t('crm.reports.forecastAccuracy.columns.actual'), align: 'left', field: 'actualLabel' },
  { label: t('crm.reports.forecastAccuracy.columns.accuracy'), align: 'left', field: 'accuracyBadge', type: TABLE_CARD_TYPE.STATUS },
]

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<ForecastAccuracyQuarter[]>>('/dashboard/forecast-accuracy')
    quarters.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

guardMounted(fetchReport)
</script>
