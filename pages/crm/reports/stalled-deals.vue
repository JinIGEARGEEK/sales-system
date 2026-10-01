<template>
  <div class="p-5">
    <PageHeader
      :title="t('crm.reports.stalledDeals.heading')"
      :subtitle="t('crm.reports.stalledDeals.subheading')"
      @back="goBack()"
    >
      <template #actions>
        <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
      </template>
    </PageHeader>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <div v-if="displayRows.length > 0" class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CrmStatCard :label="t('crm.reports.stalledDeals.summary.count')" icon="material-symbols:hourglass-empty">
          {{ displayRows.length }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.stalledDeals.summary.totalValue')" icon="material-symbols:payments-outline">
          {{ currencyCompact(totalValueAtRisk) }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.stalledDeals.summary.oldest')" icon="material-symbols:schedule-outline">
          {{ t('crm.reports.stalledDeals.daysStalled', { days: oldestDaysStalled }) }}
        </CrmStatCard>
      </div>

      <CrmReportFilterBar :show-clear="hasActiveFilters" :clear-label="t('crm.reports.stalledDeals.clearFilters')" @clear="clearFilters">
        <InputText
          :model-value="minDaysParam"
          type="number"
          :label="t('crm.reports.stalledDeals.filterMinDays')"
          name="minDays"
          size="xs"
          class="w-full sm:w-80"
          @update:model-value="minDaysParam = String($event ?? '')"
        />
        <CrmMoreFilters :count="secondaryFilterCount">
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.stalledDeals.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-full sm:w-56"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.stalledDeals.filterCompanyTag')"
            :placeholder="t('crm.reports.stalledDeals.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-full sm:w-40"
          />
        </CrmMoreFilters>
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
        @view-deal="onViewDeal"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const { t } = useI18n()

useHead({ title: t('crm.reports.stalledDeals.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { dateFormat, toBadge, severityColor, currencyCompact } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.stalledDeals.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

// URL-synced (design-system §5.4) so a shared link, a refresh or a
// back-button return reopens the same view. min_days travels as a string and is
// converted at use; the two free-text inputs debounce their URL write like
// their refetch below.
const minDaysParam = useQuerySyncedRef('min_days', '14', 400)
const minDays = computed(() => Number(minDaysParam.value) || 0)
const salesRepFilter = useQuerySyncedRef('assigned_to')
const companyTagFilter = useQuerySyncedRef('company_tag', '', 400)

const { secondaryCount: secondaryFilterCount, hasActive: hasActiveFilters, clear: clearFilters } = useListFilters({
  filters: [
    { ref: minDaysParam, default: '14' },
    { ref: salesRepFilter, secondary: true },
    { ref: companyTagFilter, default: '', secondary: true },
  ],
})

const results = ref<StalledDealRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  min_days: minDays.value || undefined,
  assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
  company_tag: companyTagFilter.value || undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<StalledDealRow[]>>('/reports/stalled-deals', { params: reportParams() })
    results.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

guardMounted(fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch([minDaysParam, companyTagFilter], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})
// Runs after the debounced watcher in the same flush (watchers fire in
// creation order), so Clear filters fetches once instead of twice.
watch(salesRepFilter, () => {
  clearTimeout(debounceTimer)
  fetchReport()
})

const onExport = () => downloadCsvBlob('/reports/stalled-deals/export', 'stalled-deals.csv', reportParams())

const { companyName } = useCompanyName()
// Escalates neutral -> warning -> error once a deal's been stalled at 1x/2x
// the current min_days threshold — every row already cleared min_days (the
// query's own cutoff), so the badge communicates *how much* worse than the
// bar it's cleared, not just that it cleared it.
const displayRows = computed(() => results.value.map(row => ({
  ...row,
  company_name: companyName(row.company_name),
  valueDisplay: currencyCompact(row.value),
  assignedToName: teamMembersStore.nameById(row.assigned_to),
  lastActivityDisplay: dateFormat(row.last_activity_at),
  daysStalledBadge: toBadge(
    t('crm.reports.stalledDeals.daysStalled', { days: row.days_stalled }),
    severityColor(row.days_stalled, minDays.value, minDays.value * 2),
  ),
})))

const totalValueAtRisk = computed(() => results.value.reduce((sum, row) => sum + row.value, 0))
const oldestDaysStalled = computed(() => results.value.reduce((max, row) => Math.max(max, row.days_stalled), 0))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => displayRows.value.length)

const onViewDeal = (row: StalledDealRow) => navigateTo(`/crm/deals/${row.deal_id}`)

const columns = computed<TableDataColumn[]>(() => [
  { label: t('crm.reports.stalledDeals.columns.title'), align: 'left', field: 'title' },
  { label: t('crm.reports.stalledDeals.columns.companyName'), align: 'left', field: 'company_name', width: 170 },
  { label: t('crm.reports.stalledDeals.columns.stage'), align: 'left', field: 'stage', width: 140 },
  { label: t('crm.reports.stalledDeals.columns.value'), align: 'left', field: 'valueDisplay', width: 130 },
  { label: t('crm.reports.stalledDeals.columns.assignedTo'), align: 'left', field: 'assignedToName', width: 150 },
  { label: t('crm.reports.stalledDeals.columns.lastActivity'), align: 'left', field: 'lastActivityDisplay', width: 150 },
  { label: t('crm.reports.stalledDeals.columns.daysStalled'), align: 'left', field: 'daysStalledBadge', type: TABLE_CARD_TYPE.STATUS, width: 150 },
  {
    label: t('crm.reports.stalledDeals.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.reports.stalledDeals.viewDeal'), emitName: 'viewDeal', isBorderBottom: false },
    ],
  },
])
</script>
