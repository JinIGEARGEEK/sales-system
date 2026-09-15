<template>
  <!-- First load — no rows to show yet, so a skeleton stands in for the
  real layout rather than flashing empty-totals cards and an empty list. -->
  <div v-if="isInitialLoading">
    <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <USkeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-lg" />
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <USkeleton v-for="i in 5" :key="i" class="h-16 w-full rounded-lg" />
    </div>
    <UCard class="mt-4 ring-(--color-card-border)">
      <template #header>
        <h3 class="text-lg font-medium">{{ breakdownHeading }}</h3>
      </template>
      <div class="flex flex-col gap-4">
        <USkeleton v-for="i in 5" :key="i" class="h-3 w-full rounded-full" />
      </div>
    </UCard>
  </div>

  <UAlert
    v-else-if="rows.length === 0"
    class="mb-4"
    color="warning"
    variant="subtle"
    icon="material-symbols:search-off-outline"
    :title="noDataMessage"
    :ui="{ root: 'p-2', icon: 'size-4' }"
  />

  <!-- Refetching (filters changed) with rows already on screen — dim rather
  than replace with a skeleton, so the view doesn't jump around. -->
  <div v-else class="transition-opacity" :class="{ 'pointer-events-none opacity-50': loading }">
    <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <CrmStatCard :label="totalLabel" icon="material-symbols:group-outline">
        {{ totalCount }}
      </CrmStatCard>
      <CrmStatCard :label="convertedTotalLabel" icon="material-symbols:check-circle-outline">
        {{ convertedCount }}
      </CrmStatCard>
      <CrmStatCard :label="rateLabel" icon="material-symbols:trending-up" :tooltip="rateTooltip">
        {{ overallRate.toFixed(1) }}%
      </CrmStatCard>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <CrmStatCard
        v-for="(row, index) in sortedRows"
        :key="row.source"
        :label="row.source"
        icon="material-symbols:campaign-outline"
        :icon-class="(CHART_CATEGORICAL_COLORS[index] ?? CHART_FALLBACK_COLOR).iconClass"
        :icon-bg-class="(CHART_CATEGORICAL_COLORS[index] ?? CHART_FALLBACK_COLOR).iconBgClass"
        :to="`${linkBase}?source=${encodeURIComponent(row.source)}`"
      >
        {{ row.conversion_rate.toFixed(1) }}%
        <template #hint>{{ convertedLabel }}: {{ row.converted }} / {{ row.total }}</template>
      </CrmStatCard>
    </div>

    <UCard class="mt-4 ring-(--color-card-border)">
      <template #header>
        <h3 class="text-lg font-medium">{{ breakdownHeading }}</h3>
      </template>
      <div class="flex flex-col gap-3">
        <CrmMetricBar
          v-for="row in sortedRows"
          :key="row.source"
          :label="row.source"
          :percent="Math.round(row.conversion_rate)"
          :to="`${linkBase}?source=${encodeURIComponent(row.source)}`"
        >
          <span class="min-w-24 shrink-0 whitespace-nowrap text-right text-sm text-(--color-gray)">{{ row.converted }} / {{ row.total }}</span>
          <span class="min-w-14 shrink-0 whitespace-nowrap text-right text-xs text-(--color-gray)">{{ row.conversion_rate.toFixed(1) }}%</span>
        </CrmMetricBar>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { CHART_CATEGORICAL_COLORS, CHART_FALLBACK_COLOR } from '~/constants/ui'

// Shared by every "conversion by source" report (Lead Source, Prospect
// Source) — same summary + ranked grid + ranked bar-list shape, differing
// only in row labels, the drill-down list they link into, and whether the
// "converted" count means Qualified (Leads) or Converted-to-Lead (Prospects).
interface SourceBreakdownRow {
  source: string
  total: number
  converted: number
  conversion_rate: number
}

const props = defineProps<{
  rows: SourceBreakdownRow[]
  loading: boolean
  noDataMessage: string
  // Drill-down target for a row's `to` link, e.g. '/crm/leads' or
  // '/crm/prospects' — appended with `?source=<row.source>`.
  linkBase: string
  totalLabel: string
  convertedTotalLabel: string
  rateLabel: string
  rateTooltip: string
  // Prefix for each card's per-source hint line, e.g. "Qualified" or
  // "Converted" (translated by the caller).
  convertedLabel: string
  breakdownHeading: string
}>()

const isInitialLoading = computed(() => props.loading && props.rows.length === 0)

// Ranked by volume first (total descending), not raw conversion_rate — a
// source with 1/1 (100%) would otherwise outrank one with 400/500 (80%)
// despite the latter being the far more meaningful number for a business
// reading "which source performs best." conversion_rate only breaks ties
// between sources of equal size.
const sortedRows = computed(() => [...props.rows].sort((a, b) => b.total - a.total || b.conversion_rate - a.conversion_rate))

const totalCount = computed(() => props.rows.reduce((sum, row) => sum + row.total, 0))
const convertedCount = computed(() => props.rows.reduce((sum, row) => sum + row.converted, 0))
const overallRate = computed(() => (totalCount.value > 0 ? (convertedCount.value / totalCount.value) * 100 : 0))
</script>
