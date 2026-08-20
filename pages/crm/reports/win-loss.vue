<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.reports.winLoss.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.reports.winLoss.subheading') }}</p>
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
          <InputDateRangePicker
            v-model="dateRange"
            :label="t('crm.reports.winLoss.filterDateRange')"
            :placeholder="t('crm.reports.dateRangePlaceholder')"
            name="dateRange"
            size="xs"
            class="w-64"
          />
          <InputSelect
            v-model="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.reports.winLoss.filterSalesRep')"
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
              :aria-label="t('crm.reports.winLoss.clearFilters')"
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
        :title="t('crm.reports.winLoss.noData')"
        :ui="{ root: 'p-2', icon: 'size-4' }"
      />

      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CrmStatCard
          v-for="row in rows"
          :key="row.reason"
          :label="reasonLabel(row.reason)"
          :icon="row.reason === 'won' ? 'material-symbols:check-circle-outline' : 'material-symbols:cancel-outline'"
          :icon-class="row.reason === 'won' ? 'text-[var(--color-success-toast)]' : 'text-[var(--color-danger-toast)]'"
          :icon-bg-class="row.reason === 'won' ? 'bg-[var(--color-success-toast)]/25' : 'bg-[var(--color-danger-toast)]/25'"
        >
          {{ t('global.currencySymbol') }}{{ priceFormatCompact(row.value) }}
          <template #hint>{{ row.count }} {{ t('crm.dashboard.dealsUnit') }}</template>
        </CrmStatCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'
import { LOST_REASON_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.reports.winLoss.pageTitle') })

const { $api } = useNuxtApp()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const { priceFormatCompact } = useFormatter()
const teamMembersStore = useTeamMembersStore()

const canViewReports = computed(() => hasRole('Admin', 'Sales Manager'))

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const salesRepOptions = computed(() => [
  { label: t('crm.reports.winLoss.allSalesReps'), value: 'all' },
  ...teamMembersStore.options,
])

const dateRange = ref<{ start: string, end: string } | null>(null)
const salesRepFilter = ref('all')

const hasActiveFilters = computed(() => Boolean(dateRange.value) || salesRepFilter.value !== 'all')

const clearFilters = () => {
  dateRange.value = null
  salesRepFilter.value = 'all'
}

const rows = ref<WinLossReasonRow[]>([])
const loading = ref(false)

const fetchReport = async () => {
  if (!canViewReports.value) return
  loading.value = true
  try {
    const response = await $api.get<ApiResponse<WinLossReasonRow[]>>('/reports/win-loss-reasons', {
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

// "won" is a virtual bucket the backend adds alongside the real LostReason
// values — reuses the same LOST_REASON_OPTIONS labels the Deal detail page's
// lost_reason picker already uses (plain hardcoded English, per this
// codebase's convention for enum-value option lists) rather than a second
// copy of those labels under a new locale namespace.
const reasonLabel = (reason: WinLossReasonRow['reason']) => {
  if (reason === 'won') return t('crm.reports.winLoss.won')
  return LOST_REASON_OPTIONS.find(option => option.value === reason)?.label ?? reason
}
</script>
