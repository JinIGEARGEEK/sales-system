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
          <h2 class="text-xl font-black">{{ t('crm.reports.leadSource.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.leadSource.subheading') }}</p>
        </div>
      </div>
      <ButtonPrimary :label="t('crm.reports.exportCsv')" icon="material-symbols:download" outline @click="onExport" />
    </div>

    <AccessGate :can-access="canViewReports" :title="t('crm.reports.accessDeniedTitle')" :label="t('crm.reports.accessDeniedMessage')">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-wrap items-end gap-2">
          <InputDateRangePicker
            v-model="dateRange"
            :label="t('crm.reports.leadSource.filterDateRange')"
            :placeholder="t('crm.reports.dateRangePlaceholder')"
            name="dateRange"
            size="xs"
            class="w-64"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.leadSource.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-56"
          />
          <div v-if="hasActiveFilters" class="flex flex-col">
            <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
            <UButton
              icon="material-symbols:filter-alt-off-outline"
              variant="outline"
              color="neutral"
              size="xs"
              square
              :aria-label="t('crm.reports.leadSource.clearFilters')"
              @click="clearFilters"
            />
          </div>
        </div>
      </UCard>

      <UAlert
        v-if="!loading && rows.length === 0"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="material-symbols:search-off-outline"
        :title="t('crm.reports.leadSource.noData')"
        :ui="{ root: 'p-2', icon: 'size-4' }"
      />

      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <CrmStatCard
          v-for="(row, index) in rows"
          :key="row.source"
          :label="row.source"
          icon="material-symbols:campaign-outline"
          :icon-class="(CHART_CATEGORICAL_COLORS[index] ?? CHART_FALLBACK_COLOR).iconClass"
          :icon-bg-class="(CHART_CATEGORICAL_COLORS[index] ?? CHART_FALLBACK_COLOR).iconBgClass"
        >
          {{ row.conversion_rate.toFixed(1) }}%
          <template #hint>
            {{ t('crm.reports.leadSource.columns.qualified') }}: {{ row.qualified }} / {{ row.total }}
          </template>
        </CrmStatCard>
      </div>

      <UCard v-if="rows.length > 0" class="mt-4 ring-[var(--color-card-border)]">
        <template #header>
          <h3 class="text-lg font-medium">{{ t('crm.reports.leadSource.heading') }}</h3>
        </template>
        <div class="flex flex-col gap-3">
          <CrmMetricBar
            v-for="row in rows"
            :key="row.source"
            :label="row.source"
            :percent="Math.round(row.conversion_rate)"
          >
            <span class="min-w-24 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ row.qualified }} / {{ row.total }}</span>
            <span class="min-w-14 shrink-0 whitespace-nowrap text-right text-xs text-[var(--color-gray)]">{{ row.conversion_rate.toFixed(1) }}%</span>
          </CrmMetricBar>
        </div>
      </UCard>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI, CHART_CATEGORICAL_COLORS, CHART_FALLBACK_COLOR } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.reports.leadSource.pageTitle') })

const goBack = useBackNavigation('/crm/reports')

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()
const downloadCsvBlob = useDownloadCsvBlob()

const { canAccess: canViewReports, guardMounted } = usePageAccess(...MANAGER_ROLES)

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.leadSource.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

const dateRange = ref<{ start: string, end: string } | null>(null)
const salesRepFilter = ref('all')

const hasActiveFilters = computed(() => Boolean(dateRange.value) || salesRepFilter.value !== 'all')

const clearFilters = () => {
  dateRange.value = null
  salesRepFilter.value = 'all'
}

const rows = ref<LeadSourceConversionRow[]>([])
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
    const response = await $api.get<ApiResponse<LeadSourceConversionRow[]>>('/reports/lead-source-conversion', { params: reportParams() })
    rows.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

const onExport = () => downloadCsvBlob('/reports/lead-source-conversion/export', 'lead-source-conversion.csv', reportParams())

guardMounted(fetchReport)
watch([dateRange, salesRepFilter], fetchReport)
</script>
