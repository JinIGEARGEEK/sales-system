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
          <h2 class="text-xl font-black">{{ t('crm.reports.quotesExpiringSoon.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.quotesExpiringSoon.subheading') }}</p>
        </div>
      </div>
      <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
    </div>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <div v-if="rows.length > 0" class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CrmStatCard :label="t('crm.reports.quotesExpiringSoon.summary.count')" icon="material-symbols:schedule-outline">
          {{ rows.length }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.quotesExpiringSoon.summary.totalValue')" icon="material-symbols:payments-outline">
          {{ t('global.currencySymbol') }}{{ priceFormatCompact(totalValue) }}
        </CrmStatCard>
        <CrmStatCard :label="t('crm.reports.quotesExpiringSoon.summary.soonest')" icon="material-symbols:hourglass-empty">
          {{ soonestDaysLeftDisplay }}
        </CrmStatCard>
      </div>

      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <InputText
            v-model.number="withinDays"
            type="number"
            :label="t('crm.reports.quotesExpiringSoon.filterWithinDays')"
            name="withinDays"
            size="xs"
            class="w-full sm:w-40"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.quotesExpiringSoon.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-full sm:w-56"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.quotesExpiringSoon.filterCompanyTag')"
            :placeholder="t('crm.reports.quotesExpiringSoon.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-full sm:w-40"
          />
          <div v-if="hasActiveFilters" class="flex flex-col">
            <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
            <UButton
              icon="material-symbols:filter-alt-off-outline"
              variant="outline"
              color="neutral"
              size="xs"
              square
              :aria-label="t('crm.reports.quotesExpiringSoon.clearFilters')"
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
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const { t } = useI18n()

useHead({ title: t('crm.reports.quotesExpiringSoon.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { priceFormatCompact, dateFormat, toBadge, severityColor } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.quotesExpiringSoon.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

const withinDays = ref(7)
const salesRepFilter = ref('all')
const companyTagFilter = ref('')

const hasActiveFilters = computed(() => withinDays.value !== 7 || salesRepFilter.value !== 'all' || Boolean(companyTagFilter.value))

const clearFilters = () => {
  withinDays.value = 7
  salesRepFilter.value = 'all'
  companyTagFilter.value = ''
}

const results = ref<QuoteExpiringSoonRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  within_days: withinDays.value || undefined,
  assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
  company_tag: companyTagFilter.value || undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<QuoteExpiringSoonRow[]>>('/reports/quotes-expiring-soon', { params: reportParams() })
    results.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

guardMounted(fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch([withinDays, companyTagFilter], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})
watch(salesRepFilter, fetchReport)

const onExport = () => downloadCsvBlob('/reports/quotes-expiring-soon/export', 'quotes-expiring-soon.csv', reportParams())

// Days remaining until the quote's validity_date — the inverse of the other
// day-based reports (fewer days left = more urgent), so severity escalates
// as this counts DOWN toward zero rather than up: reuses severityColor by
// feeding it "days already elapsed of the window" instead of days left.
const daysLeft = (validityDate: string) => Math.ceil((new Date(validityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

const rows = computed(() => results.value.map((row) => {
  const left = daysLeft(row.validity_date)
  const elapsed = withinDays.value - left
  return {
    ...row,
    validityDateBadge: toBadge(dateFormat(row.validity_date), severityColor(elapsed, Math.ceil(withinDays.value / 2), withinDays.value - 2)),
    totalValueDisplay: `${t('global.currencySymbol')}${priceFormatCompact(row.total_value)}`,
  }
}))

const totalValue = computed(() => results.value.reduce((sum, row) => sum + row.total_value, 0))
const soonestDaysLeft = computed(() => {
  if (results.value.length === 0) return null
  return Math.min(...results.value.map(row => daysLeft(row.validity_date)))
})
const soonestDaysLeftDisplay = computed(() => {
  if (soonestDaysLeft.value === null) return '-'
  return soonestDaysLeft.value <= 0
    ? t('crm.reports.quotesExpiringSoon.summary.expiresToday')
    : t('crm.reports.quotesExpiringSoon.summary.daysLeft', { days: soonestDaysLeft.value })
})

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const onViewDeal = (row: QuoteExpiringSoonRow) => navigateTo(`/crm/deals/${row.deal_id}`)

const columns: TableDataColumn[] = [
  { label: t('crm.reports.quotesExpiringSoon.columns.dealTitle'), align: 'left', field: 'deal_title' },
  { label: t('crm.reports.quotesExpiringSoon.columns.companyName'), align: 'left', field: 'company_name' },
  { label: t('crm.reports.quotesExpiringSoon.columns.validityDate'), align: 'left', field: 'validityDateBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.reports.quotesExpiringSoon.columns.totalValue'), align: 'left', field: 'totalValueDisplay' },
  {
    label: t('crm.reports.quotesExpiringSoon.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.reports.quotesExpiringSoon.viewDeal'), emitName: 'viewDeal', isBorderBottom: false },
    ],
  },
]
</script>
