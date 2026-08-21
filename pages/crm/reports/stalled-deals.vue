<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.reports.stalledDeals.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.stalledDeals.subheading') }}</p>
      </div>
      <div class="flex gap-2">
        <UButton
          :label="t('crm.reports.exportCsv')"
          icon="material-symbols:download"
          variant="outline"
          color="neutral"
          size="sm"
          @click="onExport"
        />
        <UButton
          :label="t('crm.reports.backToReports')"
          icon="material-symbols:arrow-back"
          variant="outline"
          color="neutral"
          size="sm"
          @click="navigateTo('/crm/reports')"
        />
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
      <div v-if="displayRows.length > 0" class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CrmStatCard :label="t('crm.reports.stalledDeals.summary.count')" icon="material-symbols:hourglass-empty">
          {{ displayRows.length }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.stalledDeals.summary.totalValue')" icon="material-symbols:payments-outline">
          {{ t('global.currencySymbol') }}{{ priceFormatCompact(totalValueAtRisk) }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.stalledDeals.summary.oldest')" icon="material-symbols:schedule-outline">
          {{ t('crm.reports.stalledDeals.daysStalled', { days: oldestDaysStalled }) }}
        </CrmStatCard>
      </div>

      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-wrap items-end gap-2">
          <InputText
            v-model.number="minDays"
            type="number"
            :label="t('crm.reports.stalledDeals.filterMinDays')"
            name="minDays"
            size="xs"
            class="w-80"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.stalledDeals.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-56"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.stalledDeals.filterCompanyTag')"
            :placeholder="t('crm.reports.stalledDeals.filterCompanyTagPlaceholder')"
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
              :aria-label="t('crm.reports.stalledDeals.clearFilters')"
              @click="clearFilters"
            />
          </div>
        </div>
      </UCard>

      <TableData
        v-model:page="page"
        :columns="columns"
        :rows="displayRows"
        :loading="loading"
        :total="displayRows.length"
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

useHead({ title: t('crm.reports.stalledDeals.pageTitle') })

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const { priceFormatCompact, dateFormat, toBadge, severityColor } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.stalledDeals.allSalesReps'), value: 'all' },
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

onMounted(fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch([minDays, companyTagFilter], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})
watch(salesRepFilter, fetchReport)

const onExport = () => downloadCsvBlob('/reports/stalled-deals/export', 'stalled-deals.csv', reportParams())

// Escalates neutral -> warning -> error once a deal's been stalled at 1x/2x
// the current min_days threshold — every row already cleared min_days (the
// query's own cutoff), so the badge communicates *how much* worse than the
// bar it's cleared, not just that it cleared it.
const displayRows = computed(() => results.value.map(row => ({
  ...row,
  valueDisplay: `${t('global.currencySymbol')}${priceFormatCompact(row.value)}`,
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

const columns: TableDataColumn[] = [
  { label: t('crm.reports.stalledDeals.columns.title'), align: 'left', field: 'title' },
  { label: t('crm.reports.stalledDeals.columns.companyName'), align: 'left', field: 'company_name' },
  { label: t('crm.reports.stalledDeals.columns.stage'), align: 'left', field: 'stage' },
  { label: t('crm.reports.stalledDeals.columns.value'), align: 'left', field: 'valueDisplay' },
  { label: t('crm.reports.stalledDeals.columns.assignedTo'), align: 'left', field: 'assignedToName' },
  { label: t('crm.reports.stalledDeals.columns.lastActivity'), align: 'left', field: 'lastActivityDisplay' },
  { label: t('crm.reports.stalledDeals.columns.daysStalled'), align: 'left', field: 'daysStalledBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('crm.reports.stalledDeals.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.reports.stalledDeals.viewDeal'), emitName: 'viewDeal', isBorderBottom: false },
    ],
  },
]
</script>
