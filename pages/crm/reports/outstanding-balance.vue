<template>
  <div class="p-5">
    <PageHeader
      :title="t('crm.reports.outstandingBalance.heading')"
      :subtitle="t('crm.reports.outstandingBalance.subheading')"
      @back="goBack()"
    >
      <template #actions>
        <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
      </template>
    </PageHeader>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.outstandingBalance.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-full sm:w-56"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.outstandingBalance.filterCompanyTag')"
            :placeholder="t('crm.reports.outstandingBalance.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-full sm:w-48"
          />
          <div v-if="hasActiveFilters || bucketFilter !== 'all'" class="flex flex-col">
            <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
            <UButton
              icon="material-symbols:filter-alt-off-outline"
              variant="outline"
              color="neutral"
              size="xs"
              square
              :aria-label="t('crm.reports.outstandingBalance.clearFilters')"
              @click="clearFilters"
            />
          </div>
          <span v-if="results.length > 0" class="ml-auto text-xs text-(--color-gray)">
            {{ t('crm.reports.outstandingBalance.totalOutstanding', { amount: currencyCompact(totalOutstanding) }) }}
          </span>
        </div>
      </UCard>

      <!-- Aging summary: outstanding money by how long its oldest unpaid
           installment has been overdue. A tile filters the table below. -->
      <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-cy="aging-summary">
        <CrmStatCard
          v-for="bucket in agingSummary"
          :key="bucket.bucket"
          :active="bucketFilter === bucket.bucket"
          :data-cy="`aging-bucket-${bucket.bucket}`"
          reserve-hint-space
          @click="toggleBucket(bucket.bucket)"
        >
          <template #label>
            <UBadge size="sm" :color="agingBucketColor(bucket.bucket)" variant="subtle">{{ t(`crm.reports.outstandingBalance.agingBucket.${bucket.bucket}`) }}</UBadge>
          </template>
          <span :data-cy="`aging-bucket-${bucket.bucket}-amount`">{{ currencyCompact(bucket.outstanding) }}</span>
          <template #hint>
            {{ t('crm.reports.outstandingBalance.dealCount', { count: bucket.count }) }}
          </template>
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

useHead({ title: t('crm.reports.outstandingBalance.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { currencyCompact, toBadge, dateFormat } = useFormatter()
const { companyName } = useCompanyName()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.outstandingBalance.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

const salesRepFilter = ref('all')
const companyTagFilter = ref('')

const hasActiveFilters = computed(() => salesRepFilter.value !== 'all' || Boolean(companyTagFilter.value))

const clearFilters = () => {
  salesRepFilter.value = 'all'
  companyTagFilter.value = ''
  bucketFilter.value = 'all'
}

// Client-side: the API has no bucket filter, and the summary tiles above
// always show every bucket of the current server-side filter.
const bucketFilter = useQuerySyncedRef<AgingBucket | 'all'>('bucket', 'all', 0, ['all', ...AGING_BUCKETS])
const toggleBucket = (bucket: AgingBucket) => {
  bucketFilter.value = bucketFilter.value === bucket ? 'all' : bucket
}

const results = ref<OutstandingBalanceRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
  company_tag: companyTagFilter.value || undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<OutstandingBalanceRow[]>>('/reports/outstanding-balance', { params: reportParams() })
    results.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

guardMounted(fetchReport)
watch(salesRepFilter, fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(companyTagFilter, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})

const onExport = () => downloadCsvBlob('/reports/outstanding-balance/export', 'outstanding-balance.csv', reportParams())

const totalOutstanding = computed(() => results.value.reduce((sum, row) => sum + row.outstanding_amount, 0))
const agingSummary = computed(() => summarizeAging(results.value))

// A Deal with no PaymentInstallment schedule defined gets aging: 'none' —
// rendered as a plain neutral badge rather than hidden/blank, so the column
// still reads consistently across every row.
const agingBadge = (row: OutstandingBalanceRow) => {
  if (row.aging === 'overdue') return toBadge(t('crm.reports.outstandingBalance.aging.overdue'), 'error')
  if (row.aging === 'upcoming') return toBadge(t('crm.reports.outstandingBalance.aging.upcoming'), 'warning')
  return toBadge(t('crm.reports.outstandingBalance.aging.none'), 'neutral')
}


const rows = computed(() => results.value
  .filter(row => bucketFilter.value === 'all' || row.aging_bucket === bucketFilter.value)
  .map((row) => {
    // A date-only field — dateFormat on the bare YYYY-MM-DD can't shift the day.
    const oldestOverdue = toDateOnly(row.oldest_overdue_due_date)
    return {
      ...row,
      company_name: companyName(row.company_name),
      dealValueDisplay: currencyCompact(row.deal_value),
      // Receivable incl. VAT from the latest Accepted Quote, else the (pre-VAT)
      // deal value — the second line says which, since they aren't comparable.
      receivableCell: {
        title: currencyCompact(row.receivable_amount ?? row.deal_value),
        description: row.receivable_source === 'quote'
          ? t('crm.reports.outstandingBalance.receivableSource.quote')
          : t('crm.reports.outstandingBalance.receivableSource.dealValue'),
      },
      paidAmountDisplay: currencyCompact(row.paid_amount),
      whtAmountDisplay: row.wht_amount ? currencyCompact(row.wht_amount) : '-',
      outstandingAmountDisplay: currencyCompact(row.outstanding_amount),
      oldestOverdueDisplay: oldestOverdue ? dateFormat(oldestOverdue) : '-',
      daysOverdueDisplay: row.days_overdue > 0 ? t('crm.reports.outstandingBalance.daysOverdueValue', { days: row.days_overdue }) : '-',
      agingBucketBadge: toBadge(t(`crm.reports.outstandingBalance.agingBucket.${row.aging_bucket ?? 'current'}`), agingBucketColor(row.aging_bucket ?? 'current')),
      agingBadge: agingBadge(row),
    }
  }))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const onViewDeal = (row: OutstandingBalanceRow) => navigateTo(`/crm/deals/${row.deal_id}`)

const columns = computed<TableDataColumn[]>(() => [
  { label: t('crm.reports.outstandingBalance.columns.dealTitle'), align: 'left', field: 'deal_title' },
  { label: t('crm.reports.outstandingBalance.columns.companyName'), align: 'left', field: 'company_name', width: 180 },
  { label: t('crm.reports.outstandingBalance.columns.dealValue'), align: 'left', field: 'dealValueDisplay', width: 120 },
  { label: t('crm.reports.outstandingBalance.columns.receivable'), align: 'left', field: 'receivableCell', type: TABLE_CARD_TYPE.MULTI_LINE, width: 150 },
  { label: t('crm.reports.outstandingBalance.columns.paidAmount'), align: 'left', field: 'paidAmountDisplay', width: 110 },
  { label: t('crm.reports.outstandingBalance.columns.whtAmount'), align: 'left', field: 'whtAmountDisplay', width: 100 },
  { label: t('crm.reports.outstandingBalance.columns.outstandingAmount'), align: 'left', field: 'outstandingAmountDisplay', width: 130 },
  { label: t('crm.reports.outstandingBalance.columns.oldestOverdue'), align: 'left', field: 'oldestOverdueDisplay', width: 130 },
  { label: t('crm.reports.outstandingBalance.columns.daysOverdue'), align: 'left', field: 'daysOverdueDisplay', width: 110 },
  { label: t('crm.reports.outstandingBalance.columns.agingBucket'), align: 'left', field: 'agingBucketBadge', type: TABLE_CARD_TYPE.STATUS, width: 120 },
  { label: t('crm.reports.outstandingBalance.columns.aging'), align: 'left', field: 'agingBadge', type: TABLE_CARD_TYPE.STATUS, width: 130 },
  {
    label: t('crm.reports.outstandingBalance.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.reports.outstandingBalance.viewDeal'), emitName: 'viewDeal', isBorderBottom: false },
    ],
  },
])
</script>
