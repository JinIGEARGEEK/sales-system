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
          <h2 class="text-xl font-black">{{ t('crm.reports.projectsAtRisk.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.projectsAtRisk.subheading') }}</p>
        </div>
      </div>
      <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
    </div>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-wrap items-end gap-2">
          <InputText
            v-model="companyTagFilter"
            :label="t('crm.reports.projectsAtRisk.filterCompanyTag')"
            :placeholder="t('crm.reports.projectsAtRisk.filterCompanyTagPlaceholder')"
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
              :aria-label="t('crm.reports.projectsAtRisk.clearFilters')"
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
        @view-company="onViewCompany"
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

useHead({ title: t('crm.reports.projectsAtRisk.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { dateFormat, toBadge, severityColor } = useFormatter()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

const companyTagFilter = ref('')
const hasActiveFilters = computed(() => Boolean(companyTagFilter.value))
const clearFilters = () => { companyTagFilter.value = '' }

const results = ref<ProjectAtRiskRow[]>([])
const loading = ref(false)

const reportParams = () => ({ company_tag: companyTagFilter.value || undefined })

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<ProjectAtRiskRow[]>>('/reports/projects-at-risk', { params: reportParams() })
    results.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

guardMounted(fetchReport)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(companyTagFilter, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchReport, 400)
})

const onExport = () => downloadCsvBlob('/reports/projects-at-risk/export', 'projects-at-risk.csv', reportParams())

// No configurable threshold on this report (unlike Stalled Deals/Contracts
// Stuck, which escalate relative to their own min_days filter) — every row
// here is already overdue by definition, so fixed 30/60-day bands are used
// instead.
const rows = computed(() => results.value.map(row => ({
  ...row,
  statusBadge: toBadge(row.status),
  targetEndDateDisplay: dateFormat(row.target_end_date),
  daysOverdueBadge: toBadge(
    t('crm.reports.projectsAtRisk.daysOverdue', { days: row.days_overdue }),
    severityColor(row.days_overdue, 30, 60),
  ),
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
  { label: t('crm.reports.projectsAtRisk.columns.daysOverdue'), align: 'left', field: 'daysOverdueBadge', type: TABLE_CARD_TYPE.STATUS },
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
