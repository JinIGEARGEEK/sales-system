<template>
  <div>
    <!-- Not sticky: this used to float over the top of the page while
         scrolling, but its stuck offset kept ending up wrong relative to
         the layout header (and the role-focus banner, when active),
         landing on top of it instead of below it. Plain in-flow
         positioning avoids that class of bug outright — it now scrolls
         away with the rest of the page like ordinary content. -->
    <div class="mb-6">
      <UCard :ui="filterBarCardUi">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2">
          <InputSelect
            :model-value="activePreset"
            :options="periodPresets"
            :label="t('crm.dashboard.filterPeriod')"
            :placeholder="t('crm.dashboard.periodCustom')"
            name="periodPreset"
            size="xs"
            class="w-full sm:w-40"
            @update:model-value="emit('apply-preset', $event as string)"
          />
          <InputDateRangePicker
            :model-value="dateRange"
            :label="t('crm.dashboard.filterDateRange')"
            :placeholder="t('crm.dashboard.dateRangePlaceholder')"
            name="dateRange"
            size="xs"
            class="w-full sm:w-56"
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
              class="w-full sm:w-44"
              @update:model-value="emit('update:businessUnitFilter', $event as string)"
            />
            <InputSelect
              :model-value="channelFilter"
              :options="channelOptions"
              :label="t('crm.dashboard.filterChannel')"
              name="channelFilter"
              size="xs"
              class="w-full sm:w-40"
              @update:model-value="emit('update:channelFilter', $event as string)"
            />
            <InputSelect
              :model-value="salesRepFilter"
              :options="salesRepOptions"
              :label="t('crm.dashboard.filterSalesRep')"
              name="salesRepFilter"
              size="xs"
              class="w-full sm:w-44"
              @update:model-value="emit('update:salesRepFilter', $event as string)"
            />
            <InputText
              :model-value="companyTagFilter"
              :label="t('crm.dashboard.filterCompanyTag')"
              :placeholder="t('crm.dashboard.filterCompanyTagPlaceholder')"
              name="companyTagFilter"
              size="xs"
              class="w-full sm:w-36"
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
    </div>

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

const filterBarCardUi = { body: 'p-2 sm:p-3' }

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
