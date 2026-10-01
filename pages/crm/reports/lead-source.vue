<template>
  <div class="p-5">
    <PageHeader
      :title="t('crm.reports.leadSource.heading')"
      :subtitle="t('crm.reports.leadSource.subheading')"
      @back="goBack()"
    >
      <template #actions>
        <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline :disabled="rows.length === 0" @click="onExport" />
      </template>
    </PageHeader>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <CrmReportFilterBar :show-clear="hasActiveFilters" :clear-label="t('crm.reports.leadSource.clearFilters')" @clear="clearFilters">
        <InputDateRangePicker
          v-model="dateRange"
          :label="t('crm.reports.leadSource.filterDateRange')"
          :placeholder="t('crm.reports.dateRangePlaceholder')"
          name="dateRange"
          size="xs"
          class="w-full sm:w-64"
        />
        <InputSelect
          v-model="salesRepFilter"
          :options="salesRepOptions"
          :label="t('crm.reports.leadSource.filterSalesRep')"
          name="salesRepFilter"
          size="xs"
          class="w-full sm:w-56"
        />
      </CrmReportFilterBar>

      <CrmSourceBreakdownReport
        :rows="breakdownRows"
        :loading="loading"
        :no-data-message="t('crm.reports.leadSource.noData')"
        link-base="/crm/leads"
        :total-label="t('crm.reports.leadSource.summary.totalLeads')"
        :converted-total-label="t('crm.reports.leadSource.summary.totalQualified')"
        :rate-label="t('crm.reports.leadSource.summary.overallConversionRate')"
        :rate-tooltip="t('crm.reports.leadSource.summary.overallConversionRateTooltip')"
        :converted-label="t('crm.reports.leadSource.columns.qualified')"
        :breakdown-heading="t('crm.reports.leadSource.bySource')"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.reports.leadSource.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.leadSource.allSalesReps'), value: 'all' },
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

const rows = ref<LeadSourceConversionRow[]>([])
const loading = ref(false)

// CrmSourceBreakdownReport's row shape is shared with prospect-source.vue,
// which calls its own count "converted" rather than "qualified".
const breakdownRows = computed(() => rows.value.map(row => ({ source: row.source, total: row.total, converted: row.qualified, conversion_rate: row.conversion_rate })))

const reportParams = () => ({
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
  assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<LeadSourceConversionRow[]>>('/reports/lead-source-conversion', { params: reportParams() })
    rows.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

const onExport = () => downloadCsvBlob('/reports/lead-source-conversion/export', 'lead-source-conversion.csv', reportParams())

guardMounted(fetchReport)
watch([dateFrom, dateTo, salesRepFilter], fetchReport)
</script>
