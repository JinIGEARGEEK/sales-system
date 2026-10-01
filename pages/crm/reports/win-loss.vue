<template>
  <div class="p-5">
    <PageHeader
      :title="t('crm.reports.winLoss.heading')"
      :subtitle="t('crm.reports.winLoss.subheading')"
      @back="goBack()"
    >
      <template #actions>
        <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
      </template>
    </PageHeader>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <CrmReportFilterBar :show-clear="hasActiveFilters" :clear-label="t('crm.reports.winLoss.clearFilters')" @clear="clearFilters">
        <InputDateRangePicker
          v-model="dateRange"
          :label="t('crm.reports.winLoss.filterDateRange')"
          :placeholder="t('crm.reports.dateRangePlaceholder')"
          name="dateRange"
          size="xs"
          class="w-full sm:w-64"
        />
        <CrmMoreFilters :count="secondaryFilterCount">
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.winLoss.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-full sm:w-56"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.winLoss.filterCompanyTag')"
            :placeholder="t('crm.reports.winLoss.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-full sm:w-40"
          />
        </CrmMoreFilters>
      </CrmReportFilterBar>

      <UAlert
        v-if="!loading && rows.length === 0"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="material-symbols:search-off-outline"
        :title="t('crm.reports.winLoss.noData')"
        :ui="{ root: 'p-2', icon: 'size-4' }"
      />

      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CrmStatCard
          v-for="row in rows"
          :key="row.reason"
          :label="reasonLabel(row.reason)"
          :icon="row.reason === 'won' ? 'material-symbols:check-circle-outline' : 'material-symbols:cancel-outline'"
          :icon-class="row.reason === 'won' ? 'text-(--color-success-toast)' : 'text-(--color-danger-toast)'"
          :icon-bg-class="row.reason === 'won' ? 'bg-(--color-success-toast)/25' : 'bg-(--color-danger-toast)/25'"
        >
          {{ currencyCompact(row.value) }}
          <template #hint>{{ row.count }} {{ t('crm.dashboard.dealsUnit') }}</template>
        </CrmStatCard>
      </div>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import { lostReasonLabel } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.reports.winLoss.pageTitle') })

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
  { label: t('crm.reports.winLoss.allSalesReps'), value: 'all' },
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
const companyTagFilter = useQuerySyncedRef('company_tag', '', 400)

const { secondaryCount: secondaryFilterCount, hasActive: hasActiveFilters, clear: clearFilters } = useListFilters({
  filters: [
    { ref: dateFrom, default: '' },
    { ref: dateTo, default: '' },
    { ref: salesRepFilter, secondary: true },
    { ref: companyTagFilter, default: '', secondary: true },
  ],
})

const rows = ref<WinLossReasonRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
  assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
  company_tag: companyTagFilter.value || undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<WinLossReasonRow[]>>('/reports/win-loss-reasons', { params: reportParams() })
    rows.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

guardMounted(fetchReport)
watch([dateFrom, dateTo, salesRepFilter], fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(companyTagFilter, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})

const onExport = () => downloadCsvBlob('/reports/win-loss-reasons/export', 'win-loss-reasons.csv', reportParams())

// "won" is a virtual bucket the backend adds alongside the real LostReason
// values — reuses the same LOST_REASON_OPTIONS labels the Deal detail page's
// lost_reason picker already uses (plain hardcoded English, per this
// codebase's convention for enum-value option lists) rather than a second
// copy of those labels under a new locale namespace.
const reasonLabel = (reason: WinLossReasonRow['reason']) => {
  if (reason === 'won') return t('crm.reports.winLoss.won')
  return lostReasonLabel(reason)
}
</script>
