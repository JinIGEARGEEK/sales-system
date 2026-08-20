<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.reports.projectsAtRisk.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.projectsAtRisk.subheading') }}</p>
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
        @view-company="onViewCompany"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const { t } = useI18n()

useHead({ title: t('crm.reports.projectsAtRisk.pageTitle') })

const { $api } = useNuxtApp()
const { error } = useNotify()
const { hasRole } = useRole()
const { dateFormat, toBadge } = useFormatter()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

const results = ref<ProjectAtRiskRow[]>([])
const loading = ref(false)

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<ProjectAtRiskRow[]>>('/reports/projects-at-risk')
    results.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

onMounted(fetchReport)

const rows = computed(() => results.value.map(row => ({
  ...row,
  statusBadge: toBadge(row.status),
  targetEndDateDisplay: dateFormat(row.target_end_date),
  daysOverdueDisplay: t('crm.reports.projectsAtRisk.daysOverdue', { days: row.days_overdue }),
})))

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => rows.value.length)

// Project has no dedicated detail page of its own — it's viewed from its
// owning Company's Projects tab, same as every other Project link in the app.
const onViewCompany = (row: ProjectAtRiskRow) => navigateTo(`/crm/companies/${row.company_id}`)

const columns: TableDataColumn[] = [
  { label: t('crm.reports.projectsAtRisk.columns.name'), align: 'left', field: 'name' },
  { label: t('crm.reports.projectsAtRisk.columns.companyName'), align: 'left', field: 'company_name' },
  { label: t('crm.reports.projectsAtRisk.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.reports.projectsAtRisk.columns.targetEndDate'), align: 'left', field: 'targetEndDateDisplay' },
  { label: t('crm.reports.projectsAtRisk.columns.daysOverdue'), align: 'left', field: 'daysOverdueDisplay' },
  {
    label: t('crm.reports.projectsAtRisk.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.reports.projectsAtRisk.viewCompany'), emitName: 'viewCompany', isBorderBottom: false },
    ],
  },
]
</script>
