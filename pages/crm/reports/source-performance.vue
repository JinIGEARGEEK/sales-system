<template>
  <div class="p-5">
    <PageHeader
      :title="t('crm.reports.sourcePerformance.heading')"
      :subtitle="t('crm.reports.sourcePerformance.subheading')"
      @back="goBack()"
    >
      <template #actions>
        <ButtonPrimary
          :label="t('crm.reports.exportCsv')"
          icon="material-symbols:download"
          outline
          :disabled="results.length === 0"
          data-cy="source-performance-export"
          @click="onExport"
        />
      </template>
    </PageHeader>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <InputDateRangePicker
            v-model="dateRange"
            :label="t('crm.reports.sourcePerformance.filterDateRange')"
            :placeholder="t('crm.reports.dateRangePlaceholder')"
            name="dateRange"
            size="xs"
            class="w-full sm:w-64"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.sourcePerformance.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-full sm:w-56"
          />
          <div v-if="hasActiveFilters" class="flex flex-col">
            <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
            <UButton
              icon="material-symbols:filter-alt-off-outline"
              variant="outline"
              color="neutral"
              size="xs"
              square
              :aria-label="t('crm.reports.sourcePerformance.clearFilters')"
              @click="clearFilters"
            />
          </div>
        </div>
      </UCard>

      <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4" data-cy="source-performance-summary">
        <CrmStatCard :label="t('crm.reports.sourcePerformance.summary.leads')" icon="material-symbols:group-outline">
          {{ numberFormat(totals.leads) }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.sourcePerformance.summary.dealsWon')" icon="material-symbols:emoji-events-outline">
          {{ numberFormat(totals.dealsWon + totals.directDealsWon) }}
          <template #hint>{{ t('crm.reports.sourcePerformance.summary.dealsWonHint', { fromLeads: totals.dealsWon, direct: totals.directDealsWon }) }}</template>
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.sourcePerformance.summary.wonValue')" icon="material-symbols:payments-outline">
          {{ t('global.currencySymbol') }}{{ priceFormatCompact(totals.wonValue + totals.directWonValue) }}
          <template #hint>{{ t('crm.reports.sourcePerformance.summary.wonValueHint', { direct: `${t('global.currencySymbol')}${priceFormatCompact(totals.directWonValue)}` }) }}</template>
        </CrmStatCard>
        <CrmStatCard
          :label="t('crm.reports.sourcePerformance.summary.winRate')"
          :tooltip="t('crm.reports.sourcePerformance.summary.winRateTooltip')"
          icon="material-symbols:trending-up"
        >
          {{ overallWinRate.toFixed(1) }}%
        </CrmStatCard>
      </div>

      <TableData
        v-model:page="page"
        :columns="columns"
        :rows="rows"
        :loading="loading"
        :total="rows.length"
        :total-page="totalPage"
        :per-page="perPage"
        :empty-title="t('crm.reports.sourcePerformance.noData')"
        empty-icon="material-symbols:search-off-outline"
        :filtered="hasActiveFilters"
        data-cy="source-performance-table"
        @clear-filters="clearFilters"
        @change-page="onChangePage"
        @change-per-page="onChangePerPage"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'

// FR-CRM-005: which Lead sources turn into Won revenue. A Deal is attributed
// through its originating Lead (not its editable channel); Won Deals with no
// Lead show up in the direct_* columns of their channel's row.
const { t } = useI18n()

useHead({ title: t('crm.reports.sourcePerformance.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { priceFormatCompact, numberFormat } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.sourcePerformance.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

// URL-synced, like the Activity Log's date range, so a shared link or a
// back-button return reopens the same window.
const dateFrom = useQuerySyncedRef('date_from', '')
const dateTo = useQuerySyncedRef('date_to', '')
const salesRepFilter = useQuerySyncedRef('assigned_to')
const dateRange = computed<{ start: string, end: string } | null>({
  get: () => (dateFrom.value && dateTo.value ? { start: dateFrom.value, end: dateTo.value } : null),
  set: (value) => {
    dateFrom.value = value?.start ?? ''
    dateTo.value = value?.end ?? ''
  },
})

const { hasActive: hasActiveFilters, clear: clearFilters } = useListFilters({
  filters: [{ ref: dateFrom, default: '' }, { ref: dateTo, default: '' }, { ref: salesRepFilter }],
})

const results = ref<SourcePerformanceRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
  assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<SourcePerformanceRow[]>>('/reports/source-performance', { params: reportParams() })
    results.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

const onExport = () => downloadCsvBlob('/reports/source-performance/export', 'source-performance.csv', reportParams())

guardMounted(fetchReport)
watch([dateFrom, dateTo, salesRepFilter], fetchReport)

const totals = computed(() => results.value.reduce((sum, row) => ({
  leads: sum.leads + row.leads,
  dealsWon: sum.dealsWon + row.deals_won,
  wonValue: sum.wonValue + row.won_value,
  directDealsWon: sum.directDealsWon + row.direct_deals_won,
  directWonValue: sum.directWonValue + row.direct_won_value,
}), { leads: 0, dealsWon: 0, wonValue: 0, directDealsWon: 0, directWonValue: 0 }))

// Same definition as the per-row win_rate: Lead-sourced Won Deals ÷ Leads.
const overallWinRate = computed(() => (totals.value.leads > 0 ? (totals.value.dealsWon / totals.value.leads) * 100 : 0))

const money = (value: number) => `${t('global.currencySymbol')}${priceFormatCompact(value)}`

const rows = computed(() => results.value.map(row => ({
  ...row,
  id: row.source,
  sourceDisplay: row.source || t('crm.reports.sourcePerformance.noSource'),
  wonValueDisplay: money(row.won_value),
  winRateDisplay: `${row.win_rate.toFixed(1)}%`,
  directWonValueDisplay: row.direct_deals_won ? money(row.direct_won_value) : '-',
})))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const columns = computed<TableDataColumn[]>(() => [
  { label: t('crm.reports.sourcePerformance.columns.source'), align: 'left', field: 'sourceDisplay' },
  { label: t('crm.reports.sourcePerformance.columns.leads'), align: 'left', field: 'leads', width: 90 },
  { label: t('crm.reports.sourcePerformance.columns.qualified'), align: 'left', field: 'qualified', width: 100 },
  { label: t('crm.reports.sourcePerformance.columns.dealsWon'), align: 'left', field: 'deals_won', width: 110 },
  { label: t('crm.reports.sourcePerformance.columns.wonValue'), align: 'left', field: 'wonValueDisplay', width: 130 },
  { label: t('crm.reports.sourcePerformance.columns.winRate'), align: 'left', field: 'winRateDisplay', width: 100 },
  { label: t('crm.reports.sourcePerformance.columns.directDealsWon'), align: 'left', field: 'direct_deals_won', width: 140 },
  { label: t('crm.reports.sourcePerformance.columns.directWonValue'), align: 'left', field: 'directWonValueDisplay', width: 150 },
])
</script>
