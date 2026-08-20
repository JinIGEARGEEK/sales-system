<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.reports.contractsStuck.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.contractsStuck.subheading') }}</p>
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
        <div class="flex flex-wrap items-end gap-2">
          <InputText
            v-model.number="minDays"
            type="number"
            :label="t('crm.reports.contractsStuck.filterMinDays')"
            name="minDays"
            size="xs"
            class="w-72"
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

const { $api } = useNuxtApp()
const { error } = useNotify()
const { hasRole } = useRole()
const { toBadge } = useFormatter()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

const minDays = ref(14)

const hasActiveFilters = computed(() => minDays.value !== 14)

const clearFilters = () => {
  minDays.value = 14
}

const results = ref<ContractStuckRow[]>([])
const loading = ref(false)

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<ContractStuckRow[]>>('/reports/contracts-stuck', {
      params: { min_days: minDays.value || undefined },
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
watch(minDays, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})

const rows = computed(() => results.value.map(row => ({
  ...row,
  statusBadge: toBadge(row.status, row.status === 'sent' ? 'info' : 'neutral'),
  daysInStatusDisplay: t('crm.reports.contractsStuck.daysInStatus', { days: row.days_in_status }),
})))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

const onViewDeal = (row: ContractStuckRow) => navigateTo(`/crm/deals/${row.deal_id}`)

const columns: TableDataColumn[] = [
  { label: t('crm.reports.contractsStuck.columns.dealTitle'), align: 'left', field: 'deal_title' },
  { label: t('crm.reports.contractsStuck.columns.companyName'), align: 'left', field: 'company_name' },
  { label: t('crm.reports.contractsStuck.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.reports.contractsStuck.columns.daysInStatus'), align: 'left', field: 'daysInStatusDisplay' },
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
