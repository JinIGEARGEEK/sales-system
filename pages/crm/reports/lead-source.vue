<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.reports.leadSource.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.leadSource.subheading') }}</p>
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
          <InputDateRangePicker
            v-model="dateRange"
            :placeholder="t('crm.reports.leadSource.filterDateRange')"
            name="dateRange"
            class="w-64"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :placeholder="t('crm.reports.leadSource.filterSalesRep')"
            name="salesRepFilter"
            class="w-56"
          />
          <UButton
            v-if="hasActiveFilters"
            icon="material-symbols:filter-alt-off-outline"
            variant="outline"
            color="neutral"
            size="xs"
            square
            :aria-label="t('crm.reports.leadSource.clearFilters')"
            @click="clearFilters"
          />
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
            <span class="w-24 shrink-0 text-right text-sm text-[var(--color-gray)]">{{ row.qualified }} / {{ row.total }}</span>
            <span class="w-14 shrink-0 text-right text-xs text-[var(--color-gray)]">{{ row.conversion_rate.toFixed(1) }}%</span>
          </CrmMetricBar>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI, CHART_CATEGORICAL_COLORS, CHART_FALLBACK_COLOR } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.reports.leadSource.pageTitle') })

const { $api } = useNuxtApp()
const { error } = useNotify()
const { hasRole } = useRole()
const teamMembersStore = useTeamMembersStore()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll()
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

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<LeadSourceConversionRow[]>>('/reports/lead-source-conversion', {
      params: {
        date_from: dateRange.value?.start,
        date_to: dateRange.value?.end,
        assigned_to: salesRepFilter.value !== 'all' ? salesRepFilter.value : undefined,
      },
    })
    rows.value = response.data.data
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loading.value = false
  }
}

onMounted(fetchReport)
watch([dateRange, salesRepFilter], fetchReport)
</script>
