<template>
  <div class="p-5">
    <PageHeader
      :title="t('crm.reports.prospectSource.heading')"
      :subtitle="t('crm.reports.prospectSource.subheading')"
      @back="goBack()"
    >
      <template #actions>
        <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline :disabled="rows.length === 0" @click="onExport" />
      </template>
    </PageHeader>

    <AccessGate :can-access="canViewReport" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <CrmReportFilterBar :show-clear="hasActiveFilters" :clear-label="t('crm.reports.prospectSource.clearFilters')" @clear="clearFilters">
        <InputDateRangePicker
          v-model="dateRange"
          :label="t('crm.reports.prospectSource.filterDateRange')"
          :placeholder="t('crm.reports.dateRangePlaceholder')"
          name="dateRange"
          size="xs"
          class="w-full sm:w-64"
        />
        <InputSelect
          v-model="assigneeFilter"
          :options="assigneeOptions"
          :label="t('crm.reports.prospectSource.filterAssignee')"
          name="assigneeFilter"
          size="xs"
          class="w-full sm:w-56"
        />
      </CrmReportFilterBar>

      <CrmSourceBreakdownReport
        :rows="rows"
        :loading="loading"
        :no-data-message="t('crm.reports.prospectSource.noData')"
        link-base="/crm/prospects"
        :total-label="t('crm.reports.prospectSource.summary.totalProspects')"
        :converted-total-label="t('crm.reports.prospectSource.summary.totalConverted')"
        :rate-label="t('crm.reports.prospectSource.summary.overallConversionRate')"
        :rate-tooltip="t('crm.reports.prospectSource.summary.overallConversionRateTooltip')"
        :converted-label="t('crm.reports.prospectSource.columns.converted')"
        :breakdown-heading="t('crm.reports.prospectSource.bySource')"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PROSPECT_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.reports.prospectSource.pageTitle') })

const goBack = useBackNavigation('/crm/prospects')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

// Marketing's own report — a separate gate from every other report page
// (MANAGER_ROLES/Admin+Sales Manager only), matching the backend's own
// prospectReports route group (Admin/Marketing/Sales Manager).
const { canAccess: canViewReport, guardMounted } = usePageAccess(...PROSPECT_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const assigneeOptions = computed(() => [
  { label: t('crm.reports.prospectSource.allAssignees'), value: 'all' },
  ...teamMembersStore.options,
])

const dateRange = ref<{ start: string, end: string } | null>(null)
const assigneeFilter = ref('all')

const hasActiveFilters = computed(() => Boolean(dateRange.value) || assigneeFilter.value !== 'all')

const clearFilters = () => {
  dateRange.value = null
  assigneeFilter.value = 'all'
}

const rows = ref<ProspectSourceConversionRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  date_from: dateRange.value?.start,
  date_to: dateRange.value?.end,
  assigned_to: assigneeFilter.value !== 'all' ? assigneeFilter.value : undefined,
})

const fetchReport = async () => {
  if (!canViewReport.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<ProspectSourceConversionRow[]>>('/reports/prospect-source-conversion', { params: reportParams() })
    rows.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

const onExport = () => downloadCsvBlob('/reports/prospect-source-conversion/export', 'prospect-source-conversion.csv', reportParams())

guardMounted(fetchReport)
watch([dateRange, assigneeFilter], fetchReport)
</script>
