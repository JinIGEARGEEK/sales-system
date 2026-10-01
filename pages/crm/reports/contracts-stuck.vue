<template>
  <div class="p-5">
    <PageHeader
      :title="t('crm.reports.contractsStuck.heading')"
      :subtitle="t('crm.reports.contractsStuck.subheading')"
      @back="goBack()"
    >
      <template #actions>
        <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
      </template>
    </PageHeader>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <div v-if="rows.length > 0" class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CrmStatCard :label="t('crm.reports.contractsStuck.summary.count')" icon="material-symbols:draft-outline">
          {{ rows.length }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.contractsStuck.summary.oldest')" icon="material-symbols:schedule-outline">
          {{ t('crm.reports.contractsStuck.daysInStatus', { days: oldestDaysInStatus }) }}
        </CrmStatCard>
      </div>

      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <InputText
            :model-value="minDaysParam"
            type="number"
            :label="t('crm.reports.contractsStuck.filterMinDays')"
            name="minDays"
            size="xs"
            class="w-full sm:w-72"
            @update:model-value="minDaysParam = String($event ?? '')"
          />
          <CrmMoreFilters :count="secondaryFilterCount">
            <InputSelect
              v-model="salesRepFilter"
              :options="salesRepOptions"
              :label="t('crm.reports.contractsStuck.filterSalesRep')"
              name="salesRepFilter"
              size="xs"
              class="w-full sm:w-56"
            />
            <InputText
              v-model="companyTagFilter"
              :label="t('crm.reports.contractsStuck.filterCompanyTag')"
              :placeholder="t('crm.reports.contractsStuck.filterCompanyTagPlaceholder')"
              name="companyTagFilter"
              size="xs"
              class="w-full sm:w-40"
            />
          </CrmMoreFilters>
          <div v-if="hasActiveFilters" class="flex flex-col">
            <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
            <UButton
              icon="material-symbols:filter-alt-off-outline"
              variant="outline"
              color="neutral"
              size="xs"
              square
              :aria-label="t('crm.reports.contractsStuck.clearFilters')"
              @click="clearFilters"
            />
          </div>
        </div>
      </UCard>

      <TableData
        v-model:page="page"
        :columns="columns"
        :rows="rows"
        :loading="loading"
        :total="rows.length"
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
import { GLASS_PANEL_UI } from '~/constants/ui'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const { t } = useI18n()

useHead({ title: t('crm.reports.contractsStuck.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { toBadge, severityColor } = useFormatter()
const { contractStatusBadgeColor } = useContractStatusColor()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.contractsStuck.allSalesReps'), value: 'all' },
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

const results = ref<ContractStuckRow[]>([])
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
    const response = await $api.get<ApiResponse<ContractStuckRow[]>>('/reports/contracts-stuck', { params: reportParams() })
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

const onExport = () => downloadCsvBlob('/reports/contracts-stuck/export', 'contracts-stuck.csv', reportParams())

const { companyName } = useCompanyName()
const rows = computed(() => results.value.map(row => ({
  ...row,
  company_name: companyName(row.company_name),
  statusBadge: toBadge(row.status, contractStatusBadgeColor(row.status)),
  assignedToName: teamMembersStore.nameById(row.assigned_to),
  daysInStatusBadge: toBadge(
    t('crm.reports.contractsStuck.daysInStatus', { days: row.days_in_status }),
    severityColor(row.days_in_status, minDays.value, minDays.value * 2),
  ),
})))

const oldestDaysInStatus = computed(() => results.value.reduce((max, row) => Math.max(max, row.days_in_status), 0))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const onViewDeal = (row: ContractStuckRow) => navigateTo(`/crm/deals/${row.deal_id}`)

const columns = computed<TableDataColumn[]>(() => [
  { label: t('crm.reports.contractsStuck.columns.dealTitle'), align: 'left', field: 'deal_title' },
  { label: t('crm.reports.contractsStuck.columns.companyName'), align: 'left', field: 'company_name', width: 180 },
  { label: t('crm.reports.contractsStuck.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS, width: 150 },
  { label: t('crm.reports.contractsStuck.columns.assignedTo'), align: 'left', field: 'assignedToName', width: 160 },
  { label: t('crm.reports.contractsStuck.columns.daysInStatus'), align: 'left', field: 'daysInStatusBadge', type: TABLE_CARD_TYPE.STATUS, width: 150 },
  {
    label: t('crm.reports.contractsStuck.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.reports.contractsStuck.viewDeal'), emitName: 'viewDeal', isBorderBottom: false },
    ],
  },
])
</script>
