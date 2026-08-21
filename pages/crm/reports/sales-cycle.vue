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
          <h2 class="text-xl font-black">{{ t('crm.reports.salesCycle.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.salesCycle.subheading') }}</p>
        </div>
      </div>
    </div>

    <UAlert
      v-if="!canViewReports"
      color="error"
      variant="subtle"
      icon="material-symbols:lock-outline"
      :title="t('crm.reports.accessDeniedTitle')"
      :description="t('crm.reports.accessDeniedMessage')"
    />

    <template v-else>
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-wrap items-end gap-2">
          <InputDateRangePicker
            v-model="dateRange"
            :label="t('crm.reports.salesCycle.filterDateRange')"
            :placeholder="t('crm.reports.dateRangePlaceholder')"
            name="dateRange"
            size="xs"
            class="w-64"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.salesCycle.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-56"
          />
          <div v-if="hasActiveFilters" class="flex flex-col">
            <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
            <UButton
              icon="material-symbols:filter-alt-off-outline"
              variant="outline"
              color="neutral"
              size="xs"
              square
              :aria-label="t('crm.reports.salesCycle.clearFilters')"
              @click="clearFilters"
            />
          </div>
        </div>
      </UCard>

      <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CrmStatCard
          :label="t('crm.reports.salesCycle.avgCycleLabel')"
          icon="material-symbols:schedule-outline"
        >
          {{ report ? Math.round(report.avg_sales_cycle_days) : '-' }} {{ t('crm.reports.salesCycle.daysUnit') }}
          <template #hint>{{ report?.closed_deal_count ?? 0 }} {{ t('crm.reports.salesCycle.closedDealsUnit') }}</template>
        </CrmStatCard>
      </div>

      <UAlert
        v-if="!loading && !hasAnyBreakdownData"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="material-symbols:search-off-outline"
        :title="t('crm.reports.salesCycle.noData')"
        :ui="{ root: 'p-2', icon: 'size-4' }"
      />

      <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <UCard :ui="GLASS_PANEL_UI">
          <template #header>
            <h3 class="text-sm font-semibold">{{ t('crm.reports.salesCycle.byStage') }}</h3>
          </template>
          <TableData
            :columns="bucketColumns"
            :rows="byStageRows"
            :total="byStageRows.length"
            :total-page="1"
            :per-page="byStageRows.length || 1"
            :page="1"
            :loading="loading"
          />
        </UCard>

        <UCard :ui="GLASS_PANEL_UI">
          <template #header>
            <h3 class="text-sm font-semibold">{{ t('crm.reports.salesCycle.byRep') }}</h3>
          </template>
          <TableData
            :columns="bucketColumns"
            :rows="byRepRows"
            :total="byRepRows.length"
            :total-page="1"
            :per-page="byRepRows.length || 1"
            :page="1"
            :loading="loading"
          />
        </UCard>

        <UCard :ui="GLASS_PANEL_UI">
          <template #header>
            <h3 class="text-sm font-semibold">{{ t('crm.reports.salesCycle.bySource') }}</h3>
          </template>
          <TableData
            :columns="bucketColumns"
            :rows="bySourceRows"
            :total="bySourceRows.length"
            :total-page="1"
            :per-page="bySourceRows.length || 1"
            :page="1"
            :loading="loading"
          />
        </UCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.reports.salesCycle.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const teamMembersStore = useTeamMembersStore()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.salesCycle.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

const dateRange = ref<{ start: string, end: string } | null>(null)
const salesRepFilter = ref('all')

const hasActiveFilters = computed(() => Boolean(dateRange.value) || salesRepFilter.value !== 'all')

const clearFilters = () => {
  dateRange.value = null
  salesRepFilter.value = 'all'
}

const report = ref<SalesCycleReport | null>(null)
const loading = ref(false)

const hasAnyBreakdownData = computed(() => Boolean(
  report.value && (report.value.by_stage.length || report.value.by_rep.length || report.value.by_source.length),
))

const roundDays = (row: SalesCycleBucketRow) => ({ ...row, avg_days: Math.round(row.avg_days * 10) / 10 })

const byStageRows = computed(() => (report.value?.by_stage ?? []).map(roundDays))
const bySourceRows = computed(() => (report.value?.by_source ?? []).map(roundDays))
// by_rep's `key` is a Sales Rep user id (as a string) — resolved to a display
// name here rather than on the backend, same "id in, name via the frontend
// store" convention used by every other report/badge in this codebase.
const byRepRows = computed(() => (report.value?.by_rep ?? []).map(row => ({
  ...row,
  avg_days: Math.round(row.avg_days * 10) / 10,
  key: teamMembersStore.nameById(Number(row.key)),
})))

const bucketColumns: TableDataColumn[] = [
  { label: t('crm.reports.salesCycle.columns.key'), align: 'left', field: 'key' },
  { label: t('crm.reports.salesCycle.columns.avgDays'), align: 'left', field: 'avg_days' },
  { label: t('crm.reports.salesCycle.columns.count'), align: 'left', field: 'count' },
]

const reportParams = () => ({
  date_from: dateRange.value?.start,
  date_to: dateRange.value?.end,
  assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<SalesCycleReport>>('/reports/sales-cycle', { params: reportParams() })
    report.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

onMounted(fetchReport)
watch([dateRange, salesRepFilter], fetchReport)
</script>
