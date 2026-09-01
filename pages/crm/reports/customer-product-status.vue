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
          <h2 class="text-xl font-black">{{ t('crm.reports.customerProductStatus.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.customerProductStatus.subheading') }}</p>
        </div>
      </div>
      <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
    </div>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <InputSelect
            v-model="productFilter"
            :options="productOptions"
            :label="t('crm.reports.customerProductStatus.filterProduct')"
            name="productFilter"
            size="xs"
            class="w-full sm:w-48"
          />
          <InputSelect
            v-model="statusFilter"
            :options="statusOptions"
            :label="t('crm.reports.customerProductStatus.filterStatus')"
            name="statusFilter"
            size="xs"
            class="w-full sm:w-40"
          />
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.customerProductStatus.filterCompanyTag')"
            :placeholder="t('crm.reports.customerProductStatus.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-full sm:w-48"
          />
          <div v-if="hasActiveFilters" class="flex flex-col">
            <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
            <UButton
              icon="material-symbols:filter-alt-off-outline"
              variant="outline"
              color="neutral"
              size="xs"
              square
              :aria-label="t('crm.reports.customerProductStatus.clearFilters')"
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
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { CUSTOMER_PRODUCT_STATUS_OPTIONS } from '~/constants/mockData/products'

const { t } = useI18n()

useHead({ title: t('crm.reports.customerProductStatus.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { dateFormat, toBadge } = useFormatter()
const productsStore = useProductsStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (productsStore.items.length === 0) productsStore.fetchAll().catch(notifyApiError)
})

const productOptions = computed(() => [
  { label: t('crm.reports.customerProductStatus.allProducts'), value: 'all' },
  ...productsStore.items.map(p => ({ label: p.name, value: String(p.id) })),
])

const statusOptions = computed(() => [
  { label: t('crm.reports.customerProductStatus.allStatuses'), value: 'all' },
  ...CUSTOMER_PRODUCT_STATUS_OPTIONS,
])

const productFilter = ref('all')
const statusFilter = ref('all')
const companyTagFilter = ref('')

const hasActiveFilters = computed(() => {
  return productFilter.value !== 'all' || statusFilter.value !== 'all' || Boolean(companyTagFilter.value)
})

const clearFilters = () => {
  productFilter.value = 'all'
  statusFilter.value = 'all'
  companyTagFilter.value = ''
}

const results = ref<CustomerByProductStatusRow[]>([])
const loading = ref(false)

const reportParams = () => ({
  product_id: productFilter.value !== 'all' ? productFilter.value : undefined,
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
  company_tag: companyTagFilter.value || undefined,
})

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<CustomerByProductStatusRow[]>>('/reports/customers-by-product-status', { params: reportParams() })
    results.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

guardMounted(fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch([productFilter, statusFilter], fetchReport)
watch(companyTagFilter, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})

const onExport = () => downloadCsvBlob('/reports/customers-by-product-status/export', 'customers-by-product-status.csv', reportParams())

const productName = (productId: number) => productsStore.items.find(p => p.id === productId)?.name ?? '-'

const rows = computed(() => {
  return results.value.map(row => ({
    ...row,
    productName: productName(row.product_id),
    statusBadge: toBadge(row.status),
    startDateDisplay: dateFormat(row.start_date),
  }))
})

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const columns: TableDataColumn[] = [
  { label: t('crm.reports.customerProductStatus.columns.companyName'), align: 'left', field: 'company_name' },
  { label: t('crm.reports.customerProductStatus.columns.product'), align: 'left', field: 'productName' },
  { label: t('crm.reports.customerProductStatus.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.reports.customerProductStatus.columns.startDate'), align: 'left', field: 'startDateDisplay' },
]
</script>
