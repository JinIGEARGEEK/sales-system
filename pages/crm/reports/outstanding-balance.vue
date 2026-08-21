<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.reports.outstandingBalance.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.outstandingBalance.subheading') }}</p>
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
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-wrap items-end gap-2">
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.outstandingBalance.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-56"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.outstandingBalance.filterCompanyTag')"
            :placeholder="t('crm.reports.outstandingBalance.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-48"
          />
          <div v-if="hasActiveFilters" class="flex flex-col">
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
          <span v-if="rows.length > 0" class="ml-auto text-xs text-[var(--color-gray)]">
            {{ t('crm.reports.outstandingBalance.totalOutstanding', { amount: `${t('global.currencySymbol')}${priceFormatCompact(totalOutstanding)}` }) }}
          </span>
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

useHead({ title: t('crm.reports.outstandingBalance.pageTitle') })

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const { priceFormatCompact } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

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

onMounted(fetchReport)
watch(salesRepFilter, fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(companyTagFilter, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})

const onExport = () => downloadCsvBlob('/reports/outstanding-balance/export', 'outstanding-balance.csv', reportParams())

const totalOutstanding = computed(() => results.value.reduce((sum, row) => sum + row.outstanding_amount, 0))

const rows = computed(() => results.value.map(row => ({
  ...row,
  dealValueDisplay: `${t('global.currencySymbol')}${priceFormatCompact(row.deal_value)}`,
  paidAmountDisplay: `${t('global.currencySymbol')}${priceFormatCompact(row.paid_amount)}`,
  outstandingAmountDisplay: `${t('global.currencySymbol')}${priceFormatCompact(row.outstanding_amount)}`,
})))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const onViewDeal = (row: OutstandingBalanceRow) => navigateTo(`/crm/deals/${row.deal_id}`)

const columns: TableDataColumn[] = [
  { label: t('crm.reports.outstandingBalance.columns.dealTitle'), align: 'left', field: 'deal_title' },
  { label: t('crm.reports.outstandingBalance.columns.companyName'), align: 'left', field: 'company_name' },
  { label: t('crm.reports.outstandingBalance.columns.dealValue'), align: 'left', field: 'dealValueDisplay' },
  { label: t('crm.reports.outstandingBalance.columns.paidAmount'), align: 'left', field: 'paidAmountDisplay' },
  { label: t('crm.reports.outstandingBalance.columns.outstandingAmount'), align: 'left', field: 'outstandingAmountDisplay' },
  {
    label: t('crm.reports.outstandingBalance.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.reports.outstandingBalance.viewDeal'), emitName: 'viewDeal', isBorderBottom: false },
    ],
  },
]
</script>
