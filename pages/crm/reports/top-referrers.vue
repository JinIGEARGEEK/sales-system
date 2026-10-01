<template>
  <div class="p-5">
    <PageHeader
      :title="t('crm.reports.topReferrers.heading')"
      :subtitle="t('crm.reports.topReferrers.subheading')"
      @back="goBack()"
    >
      <template #actions>
        <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline :disabled="rows.length === 0" @click="onExport" />
      </template>
    </PageHeader>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <CrmReportFilterBar :show-clear="hasActiveFilters" :clear-label="t('crm.reports.topReferrers.clearFilters')" @clear="clearFilters">
        <InputDateRangePicker
          v-model="dateRange"
          :label="t('crm.reports.topReferrers.filterDateRange')"
          :placeholder="t('crm.reports.dateRangePlaceholder')"
          name="dateRange"
          size="xs"
          class="w-full sm:w-64"
        />
        <InputSelect
          v-model="salesRepFilter"
          :options="salesRepOptions"
          :label="t('crm.reports.topReferrers.filterSalesRep')"
          name="salesRepFilter"
          size="xs"
          class="w-full sm:w-56"
        />
      </CrmReportFilterBar>

      <TableData
        v-model:page="page"
        :columns="columns"
        :rows="displayRows"
        :loading="loading"
        :total="displayRows.length"
        :total-page="totalPage"
        :per-page="perPage"
        :filtered="hasActiveFilters"
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

const { t } = useI18n()

useHead({ title: t('crm.reports.topReferrers.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { currencyCompact } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.topReferrers.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

// URL-synced (design-system §5.4), like Source Performance: a shared link,
// a refresh or a back-button return reopens the same window. The range
// travels as two YYYY-MM-DD strings straight from the date picker.
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

const rows = ref<TopReferrerRow[]>([])
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
    const response = await $api.get<ApiResponse<TopReferrerRow[]>>('/reports/top-referrers', { params: reportParams() })
    rows.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

const onExport = () => downloadCsvBlob('/reports/top-referrers/export', 'top-referrers.csv', reportParams())

guardMounted(fetchReport)
watch([dateFrom, dateTo, salesRepFilter], fetchReport)

const displayRows = computed(() => rows.value.map(row => ({
  ...row,
  referrerTypeLabel: row.referrer_type === 'company' ? t('crm.reports.topReferrers.typeCompany') : t('crm.reports.topReferrers.typeContact'),
  wonRevenueDisplay: currencyCompact(row.won_revenue),
})))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => displayRows.value.length)

const columns = computed<TableDataColumn[]>(() => [
  { label: t('crm.reports.topReferrers.columns.referrer'), align: 'left', field: 'referrer_name' },
  { label: t('crm.reports.topReferrers.columns.type'), align: 'left', field: 'referrerTypeLabel', width: 120 },
  { label: t('crm.reports.topReferrers.columns.leadsReferred'), align: 'left', field: 'leads_referred', width: 140 },
  { label: t('crm.reports.topReferrers.columns.dealsCreated'), align: 'left', field: 'deals_created', width: 140 },
  { label: t('crm.reports.topReferrers.columns.dealsWon'), align: 'left', field: 'deals_won', width: 120 },
  { label: t('crm.reports.topReferrers.columns.wonRevenue'), align: 'left', field: 'wonRevenueDisplay', width: 150 },
])
</script>
