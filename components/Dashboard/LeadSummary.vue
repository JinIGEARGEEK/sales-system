<template>
  <div class="mb-8">
    <h3 class="mb-3 flex items-center justify-between border-b border-[var(--color-light-gray-2)] pb-2">
      <span class="text-sm font-semibold text-[var(--color-black)]">{{ t('crm.dashboard.sectionLeadFunnel') }}</span>
      <NuxtLink to="/crm/reports/lead-source" class="text-xs font-medium text-[var(--color-primary)] hover:underline">
        {{ t('crm.dashboard.viewFullReport') }}
      </NuxtLink>
    </h3>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-4">
      <CrmStatCard
        :label="t('crm.dashboard.totalLeads')"
        icon="material-symbols:person-add-outline"
        icon-class="text-[var(--color-info-toast)]"
        icon-bg-class="bg-[var(--color-info-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-info-toast)]/20 to-transparent"
        to="/crm/leads"
      >
        {{ summary?.total_leads ?? 0 }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.newLeads')"
        icon="material-symbols:fiber-new-outline"
        icon-class="text-[var(--color-warning-hover)]"
        icon-bg-class="bg-[var(--color-warning-hover)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-warning-hover)]/20 to-transparent"
        to="/crm/leads?status=New"
      >
        {{ summary?.new_leads ?? 0 }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.qualifiedLeads')"
        icon="material-symbols:check-circle-outline"
        icon-class="text-[var(--color-success-toast)]"
        icon-bg-class="bg-[var(--color-success-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-success-toast)]/20 to-transparent"
        to="/crm/leads?status=Qualified"
      >
        {{ summary?.qualified_leads ?? 0 }}
      </CrmStatCard>
      <CrmStatCard
        :label="t('crm.dashboard.disqualifiedLeads')"
        icon="material-symbols:cancel-outline"
        icon-class="text-[var(--color-danger-toast)]"
        icon-bg-class="bg-[var(--color-danger-toast)]/25"
        accent-glass-class="bg-gradient-to-r from-[var(--color-danger-toast)]/20 to-transparent"
        to="/crm/leads?status=Disqualified"
      >
        {{ summary?.disqualified_leads ?? 0 }}
      </CrmStatCard>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <h3 class="text-lg font-medium">{{ t('crm.dashboard.leadsByStatus') }}</h3>
        </template>
        <div v-if="!statusRows.length" class="py-6 text-center text-sm text-[var(--color-gray)]">
          {{ t('crm.dashboard.noLeadData') }}
        </div>
        <div v-else class="flex flex-col gap-3">
          <CrmMetricBar
            v-for="(row, index) in statusRows"
            :key="row.status"
            :label="row.status"
            :percent="row.percent"
            :bar-class="(CHART_CATEGORICAL_COLORS[index] ?? CHART_FALLBACK_COLOR).bar"
            :to="`/crm/leads?status=${encodeURIComponent(row.status)}`"
          >
            <span class="min-w-10 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ row.count }}</span>
          </CrmMetricBar>
        </div>
      </UCard>

      <UCard class="ring-[var(--color-card-border)]">
        <template #header>
          <h3 class="text-lg font-medium">{{ t('crm.dashboard.leadsBySource') }}</h3>
        </template>
        <div v-if="!(summary?.source_breakdown?.length)" class="py-6 text-center text-sm text-[var(--color-gray)]">
          {{ t('crm.dashboard.noLeadData') }}
        </div>
        <div v-else class="flex flex-col gap-3">
          <CrmMetricBar
            v-for="row in summary!.source_breakdown"
            :key="row.source"
            :label="row.source"
            :percent="Math.round(row.conversion_rate)"
            :to="`/crm/leads?source=${encodeURIComponent(row.source)}`"
          >
            <span class="min-w-24 shrink-0 whitespace-nowrap text-right text-sm text-[var(--color-gray)]">{{ row.qualified }} / {{ row.total }}</span>
            <span class="min-w-14 shrink-0 whitespace-nowrap text-right text-xs text-[var(--color-gray)]">{{ row.conversion_rate.toFixed(1) }}%</span>
          </CrmMetricBar>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CHART_CATEGORICAL_COLORS, CHART_FALLBACK_COLOR } from '~/constants/ui'

const { t } = useI18n()

const props = defineProps<{
  summary: LeadDashboardSummary | null
}>()

// Bars scale against the largest status bucket, same convention as the
// Prospect Funnel widget (components/Dashboard/MarketingSummary.vue).
const statusRows = computed(() => {
  const rows = props.summary?.status_breakdown ?? []
  const maxCount = Math.max(...rows.map(r => r.count), 1)
  return rows.map(row => ({ ...row, percent: Math.round((row.count / maxCount) * 100) }))
})
</script>
