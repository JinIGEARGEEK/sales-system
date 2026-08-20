<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.reports.quotesExpiringSoon.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.quotesExpiringSoon.subheading') }}</p>
      </div>
      <UButton
        :label="t('crm.reports.backToReports')"
        icon="material-symbols:arrow-back"
        variant="outline"
        color="neutral"
        size="sm"
        @click="navigateTo('/crm/reports')"
      />
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
        <div class="flex flex-wrap items-center gap-2">
          <UIcon name="material-symbols:filter-alt-outline" class="size-4 shrink-0 text-[var(--color-gray)]" />
          <InputText
            v-model.number="withinDays"
            type="number"
            :label="t('crm.reports.quotesExpiringSoon.filterWithinDays')"
            name="withinDays"
            class="w-40"
          />
          <UButton
            v-if="hasActiveFilters"
            icon="material-symbols:filter-alt-off-outline"
            variant="outline"
            color="neutral"
            size="xs"
            square
            :aria-label="t('crm.reports.quotesExpiringSoon.clearFilters')"
            @click="clearFilters"
          />
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

useHead({ title: t('crm.reports.quotesExpiringSoon.pageTitle') })

const { $api } = useNuxtApp()
const { error } = useNotify()
const { hasRole } = useRole()
const { priceFormatCompact, dateFormat } = useFormatter()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

const withinDays = ref(7)

const hasActiveFilters = computed(() => withinDays.value !== 7)

const clearFilters = () => {
  withinDays.value = 7
}

const results = ref<QuoteExpiringSoonRow[]>([])
const loading = ref(false)

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<QuoteExpiringSoonRow[]>>('/reports/quotes-expiring-soon', {
      params: { within_days: withinDays.value || undefined },
    })
    results.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

onMounted(fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(withinDays, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})

const rows = computed(() => results.value.map(row => ({
  ...row,
  validityDateDisplay: dateFormat(row.validity_date),
  totalValueDisplay: `${t('global.currencySymbol')}${priceFormatCompact(row.total_value)}`,
})))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const onViewDeal = (row: QuoteExpiringSoonRow) => navigateTo(`/crm/deals/${row.deal_id}`)

const columns: TableDataColumn[] = [
  { label: t('crm.reports.quotesExpiringSoon.columns.dealTitle'), align: 'left', field: 'deal_title' },
  { label: t('crm.reports.quotesExpiringSoon.columns.companyName'), align: 'left', field: 'company_name' },
  { label: t('crm.reports.quotesExpiringSoon.columns.validityDate'), align: 'left', field: 'validityDateDisplay' },
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
