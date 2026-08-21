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
          <h2 class="text-xl font-black">{{ t('crm.reports.contractsStuck.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.contractsStuck.subheading') }}</p>
        </div>
      </div>
      <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
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
      <div v-if="rows.length > 0" class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CrmStatCard :label="t('crm.reports.contractsStuck.summary.count')" icon="material-symbols:draft-outline">
          {{ rows.length }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.contractsStuck.summary.oldest')" icon="material-symbols:schedule-outline">
          {{ t('crm.reports.contractsStuck.daysInStatus', { days: oldestDaysInStatus }) }}
        </CrmStatCard>
      </div>

      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-wrap items-end gap-2">
          <InputText
            v-model.number="minDays"
            type="number"
            :label="t('crm.reports.contractsStuck.filterMinDays')"
            name="minDays"
            size="xs"
            class="w-72"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.contractsStuck.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-56"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.contractsStuck.filterCompanyTag')"
            :placeholder="t('crm.reports.contractsStuck.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-40"
          />
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
        @change-page="onChangePage"
        @change-per-page="onChangePerPage"
        @view-deal="onViewDeal"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const { t } = useI18n()

useHead({ title: t('crm.reports.contractsStuck.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const { toBadge, severityColor } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.contractsStuck.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

const minDays = ref(14)
const salesRepFilter = ref('all')
const companyTagFilter = ref('')

const hasActiveFilters = computed(() => minDays.value !== 14 || salesRepFilter.value !== 'all' || Boolean(companyTagFilter.value))

const clearFilters = () => {
  minDays.value = 14
  salesRepFilter.value = 'all'
  companyTagFilter.value = ''
}

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

onMounted(fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch([minDays, companyTagFilter], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})
watch(salesRepFilter, fetchReport)

const onExport = () => downloadCsvBlob('/reports/contracts-stuck/export', 'contracts-stuck.csv', reportParams())

const rows = computed(() => results.value.map(row => ({
  ...row,
  statusBadge: toBadge(row.status, row.status === 'sent' ? 'info' : 'neutral'),
  assignedToName: teamMembersStore.nameById(row.assigned_to),
  daysInStatusBadge: toBadge(
    t('crm.reports.contractsStuck.daysInStatus', { days: row.days_in_status }),
    severityColor(row.days_in_status, minDays.value, minDays.value * 2),
  ),
})))

const oldestDaysInStatus = computed(() => results.value.reduce((max, row) => Math.max(max, row.days_in_status), 0))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const onViewDeal = (row: ContractStuckRow) => navigateTo(`/crm/deals/${row.deal_id}`)

const columns: TableDataColumn[] = [
  { label: t('crm.reports.contractsStuck.columns.dealTitle'), align: 'left', field: 'deal_title' },
  { label: t('crm.reports.contractsStuck.columns.companyName'), align: 'left', field: 'company_name' },
  { label: t('crm.reports.contractsStuck.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.reports.contractsStuck.columns.assignedTo'), align: 'left', field: 'assignedToName' },
  { label: t('crm.reports.contractsStuck.columns.daysInStatus'), align: 'left', field: 'daysInStatusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('crm.reports.contractsStuck.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.reports.contractsStuck.viewDeal'), emitName: 'viewDeal', isBorderBottom: false },
    ],
  },
]
</script>
