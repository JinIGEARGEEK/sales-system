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
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
          <div v-if="hasActiveFilters" class="flex flex-col">
            <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
            <UButton
              icon="material-symbols:filter-alt-off-outline"
              variant="outline"
              color="neutral"
              size="xs"
              square
              :aria-label="t('crm.reports.prospectSource.clearFilters')"
              @click="clearFilters"
            />
          </div>
        </div>
      </UCard>

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
import { GLASS_PANEL_UI } from '~/constants/ui'

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

// URL-synced (design-system §5.4), like Source Performance: a shared link,
// a refresh or a back-button return reopens the same window. The range
// travels as two YYYY-MM-DD strings straight from the date picker.
const dateFrom = useQuerySyncedRef('date_from', '')
const dateTo = useQuerySyncedRef('date_to', '')
const assigneeFilter = useQuerySyncedRef('assigned_to')
const dateRange = computed<{ start: string, end: string } | null>({
  get: () => (dateFrom.value && dateTo.value ? { start: dateFrom.value, end: dateTo.value } : null),
  set: (value) => {
    dateFrom.value = value?.start ?? ''
    dateTo.value = value?.end ?? ''
  },
})

const { hasActive: hasActiveFilters, clear: clearFilters } = useListFilters({
  filters: [{ ref: dateFrom, default: '' }, { ref: dateTo, default: '' }, { ref: assigneeFilter }],
})

const rows = ref<ProspectSourceConversionRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
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
watch([dateFrom, dateTo, assigneeFilter], fetchReport)
</script>
