<template>
  <div>
    <!-- Sticks below the layout's own sticky header (which only appears at
         md+, hence the same breakpoint here) so the filters stay reachable
         on this long, scroll-heavy dashboard instead of scrolling out of
         view. z-10 matches the layout header's own stacking so page
         content scrolls underneath both, not just one. -->
    <div ref="filterBarSentinelRef" />
    <UCard
      class="sticky top-3 z-10 mb-6 transition-[background-color,backdrop-filter,box-shadow] duration-200 md:top-[calc(var(--layout-header-height)+12px)]"
      :ui="filterBarCardUi"
    >
      <!-- Laser accent: thin glowing gradient line on the bottom edge,
           only shown once the bar is actually floating — see
           filterBarCardUi for why the glass styling lives in script. -->
      <div
        v-if="isFilterBarStuck"
        class="pointer-events-none absolute inset-x-4 -bottom-px h-px bg-linear-to-r from-transparent via-(--color-secondary) to-transparent opacity-80 shadow-[0_0_8px_1px_var(--color-secondary)]"
      />
      <div class="flex flex-wrap items-end gap-2">
        <InputSelect
          :model-value="activePreset"
          :options="periodPresets"
          :label="t('crm.dashboard.filterPeriod')"
          :placeholder="t('crm.dashboard.periodCustom')"
          name="periodPreset"
          size="xs"
          class="w-32"
          @update:model-value="emit('apply-preset', $event as string)"
        />
        <InputDateRangePicker
          :model-value="dateRange"
          :label="t('crm.dashboard.filterDateRange')"
          :placeholder="t('crm.dashboard.dateRangePlaceholder')"
          name="dateRange"
          size="xs"
          class="w-56"
          @update:model-value="emit('update:dateRange', $event)"
        />
        <!-- Always shown on lg+ (desktop has room for them); on smaller
             screens they stay behind the More Filters toggle below. -->
        <div :class="showAdvancedFilters ? 'contents' : 'hidden lg:contents'">
          <InputSelect
            :model-value="businessUnitFilter"
            :options="businessUnitOptions"
            :label="t('crm.dashboard.filterBusinessUnit')"
            name="businessUnitFilter"
            size="xs"
            class="w-36"
            @update:model-value="emit('update:businessUnitFilter', $event as string)"
          />
          <InputSelect
            :model-value="channelFilter"
            :options="channelOptions"
            :label="t('crm.dashboard.filterChannel')"
            name="channelFilter"
            size="xs"
            class="w-32"
            @update:model-value="emit('update:channelFilter', $event as string)"
          />
          <InputSelect
            :model-value="salesRepFilter"
            :options="salesRepOptions"
            :label="t('crm.dashboard.filterSalesRep')"
            name="salesRepFilter"
            size="xs"
            class="w-40"
            @update:model-value="emit('update:salesRepFilter', $event as string)"
          />
          <InputText
            :model-value="companyTagFilter"
            :label="t('crm.dashboard.filterCompanyTag')"
            :placeholder="t('crm.dashboard.filterCompanyTagPlaceholder')"
            name="companyTagFilter"
            size="xs"
            class="w-36"
            @update:model-value="emit('update:companyTagFilter', $event as string)"
          />
        </div>
        <!-- The toggle itself is only needed on smaller screens, since the
             fields above are already always visible on lg+. -->
        <div class="flex flex-col lg:hidden">
          <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
          <UButton
            :label="showAdvancedFilters ? t('crm.dashboard.fewerFilters') : t('crm.dashboard.moreFilters')"
            :icon="showAdvancedFilters ? 'material-symbols:expand-less' : 'material-symbols:tune'"
            size="xs"
            variant="subtle"
            color="primary"
            class="font-medium"
            @click="showAdvancedFilters = !showAdvancedFilters"
          >
            <template v-if="advancedFilterCount > 0" #trailing>
              <UBadge :label="advancedFilterCount" size="xs" color="primary" variant="solid" />
            </template>
          </UButton>
        </div>
        <div v-if="hasActiveFilters" class="flex flex-col">
          <span class="mb-1 text-sm invisible" aria-hidden="true">&nbsp;</span>
          <UButton
            icon="material-symbols:filter-alt-off-outline"
            variant="outline"
            color="neutral"
            size="xs"
            square
            :aria-label="t('crm.dashboard.clearFilters')"
            @click="emit('clear-filters')"
          />
        </div>
        <span class="ml-auto text-xs text-[var(--color-gray)]">{{ t('crm.dashboard.showingDeals', { count: filteredCount, total: totalCount }) }}</span>
      </div>
    </UCard>

    <UAlert
      v-if="filteredCount === 0 && hasActiveFilters"
      class="mb-6"
      :title="t('crm.dashboard.noDealsMatch')"
      :ui="{
        root: 'items-center gap-2 border-l-4 border-l-[var(--color-warning-hover)] bg-[var(--color-warning-toast)]/20 p-2 shadow-sm ring-0',
        title: 'text-sm font-semibold text-[var(--color-black)]',
      }"
    >
      <template #leading>
        <div class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning-hover)]/25">
          <UIcon name="material-symbols:search-off-outline" class="size-3.5 text-[var(--color-warning-hover)]" />
        </div>
      </template>
    </UAlert>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  dateRange: { start: string, end: string } | null
  activePreset: string | null
  periodPresets: Select[]
  businessUnitFilter: string
  businessUnitOptions: Select[]
  channelFilter: string
  channelOptions: Select[]
  salesRepFilter: string
  salesRepOptions: Select[]
  companyTagFilter: string
  filteredCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  'update:dateRange': [value: { start: string, end: string } | null]
  'apply-preset': [value: string]
  'update:businessUnitFilter': [value: string]
  'update:channelFilter': [value: string]
  'update:salesRepFilter': [value: string]
  'update:companyTagFilter': [value: string]
  'clear-filters': []
}>()

// The filter bar only needs to look like frosted glass once it's actually
// floating over scrolled-past content — while it sits in its normal
// in-flow position at the top of the page there's nothing behind it to
// blur, so a plain card reads better there. A zero-height sentinel placed
// just above it flips `isFilterBarStuck` the moment it scrolls out of the
// scroll container's view (i.e. the instant the sticky bar starts
// floating) — same technique as the layout header's own sticky detection.
const isFilterBarStuck = ref(false)
const filterBarSentinelRef = ref<HTMLElement | null>(null)
onMounted(() => {
  const sentinelEl = filterBarSentinelRef.value
  const mainEl = sentinelEl?.closest('main') ?? null
  if (!sentinelEl || !mainEl) return
  const observer = new IntersectionObserver(
    ([entry]) => { isFilterBarStuck.value = !entry.isIntersecting },
    { root: mainEl, threshold: 0 },
  )
  observer.observe(sentinelEl)
  onUnmounted(() => observer.disconnect())
})

// Kept as a computed (rather than inline in the template's `:ui` attribute)
// so this reasoning lives in a plain JS comment instead of a comment inside
// a double-quoted HTML attribute — the latter breaks the moment the comment
// text itself needs a literal double quote (bitten by this twice already).
//
// Low fill opacity + strong blur so scrolled content is genuinely
// visible-but-frosted through the bar (real see-through glass) instead of
// reading as a near-solid card. Distinctness against the pale page
// background comes from the shadow/ring, not from opacity, so it can stay
// this transparent without dissolving in. The blue tint matches the
// sidebar nav's own active/focus glow (layouts/default.vue's
// .sidebar-nav-link.is-active — rgba(96, 165, 250) is the blue half of
// that gradient), so the floating-panel cue reads consistently with that
// active/focus state elsewhere in the app. One soft ring rather than a
// hard border layered under a separate ring, so the edge reads as a single
// seamless glow instead of a stacked double outline — paired with a plain
// elevation shadow so it doesn't lose its depth.
const filterBarCardUi = computed(() => ({
  root: isFilterBarStuck.value
    ? 'bg-white/10 backdrop-blur-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(96,165,250,0.4)] ring-1 ring-[rgba(96,165,250,0.4)]'
    : '',
  body: 'p-2 sm:p-3',
}))

const showAdvancedFilters = ref(false)

const advancedFilterCount = computed(() => {
  return [
    props.businessUnitFilter !== 'all',
    props.channelFilter !== 'all',
    props.salesRepFilter !== 'all',
    Boolean(props.companyTagFilter),
  ].filter(Boolean).length
})

const hasActiveFilters = computed(() => {
  return Boolean(props.dateRange)
    || props.businessUnitFilter !== 'all'
    || props.channelFilter !== 'all'
    || props.salesRepFilter !== 'all'
    || Boolean(props.companyTagFilter)
})
</script>
