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
          <h2 class="text-xl font-black">{{ t('crm.reports.topReferrers.heading') }}</h2>
          <p class="text-sm text-(--color-gray)">{{ t('crm.reports.topReferrers.subheading') }}</p>
        </div>
      </div>
      <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline :disabled="rows.length === 0" @click="onExport" />
    </div>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <InputDateRangePicker
            v-model="dateRange"
            :label="t('crm.reports.topReferrers.filterDateRange')"
            :placeholder="t('crm.reports.dateRangePlaceholder')"
            name="dateRange"
            size="xs"
            class="w-full sm:w-64"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.topReferrers.filterSalesRep')"
            name="salesRepFilter"
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
              :aria-label="t('crm.reports.topReferrers.clearFilters')"
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
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.reports.topReferrers.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { priceFormatCompact } = useFormatter()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.topReferrers.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

const dateRange = ref<{ start: string, end: string } | null>(null)
const salesRepFilter = ref('all')

const hasActiveFilters = computed(() => Boolean(dateRange.value) || salesRepFilter.value !== 'all')

const clearFilters = () => {
  dateRange.value = null
  salesRepFilter.value = 'all'
}

const rows = ref<TopReferrerRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  date_from: dateRange.value?.start,
  date_to: dateRange.value?.end,
  assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<TopReferrerRow[]>>('/reports/top-referrers', { params: reportParams() })
    rows.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

const onExport = () => downloadCsvBlob('/reports/top-referrers/export', 'top-referrers.csv', reportParams())

guardMounted(fetchReport)
watch([dateRange, salesRepFilter], fetchReport)

const displayRows = computed(() => rows.value.map(row => ({
  ...row,
  referrerTypeLabel: row.referrer_type === 'company' ? t('crm.reports.topReferrers.typeCompany') : t('crm.reports.topReferrers.typeContact'),
  wonRevenueDisplay: `${t('global.currencySymbol')}${priceFormatCompact(row.won_revenue)}`,
})))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => displayRows.value.length)

const columns = computed<TableDataColumn[]>(() => [
  { label: t('crm.reports.topReferrers.columns.referrer'), align: 'left', field: 'referrer_name' },
  { label: t('crm.reports.topReferrers.columns.type'), align: 'left', field: 'referrerTypeLabel', width: 120 },
  { label: t('crm.reports.topReferrers.columns.leadsReferred'), align: 'left', field: 'leads_referred', width: 140 },
  { label: t('crm.reports.topReferrers.columns.dealsCreated'), align: 'left', field: 'deals_created', width: 140 },
  { label: t('crm.reports.topReferrers.columns.dealsWon'), align: 'left', field: 'deals_won', width: 120 },
  { label: t('crm.reports.topReferrers.columns.wonRevenue'), align: 'left', field: 'wonRevenueDisplay', width: 150 },
])
</script>
