<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="overview-screen">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="text-xl font-black">{{ t('crm.overviewPipeline.heading') }}</h2>
            <p class="text-sm text-(--color-gray)">{{ t('crm.overviewPipeline.subheading') }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <CrmStatusPill v-model="period" :options="periodOptions" class="flex-wrap [&>button]:whitespace-nowrap" data-cy="overview-period" />
            <ButtonPrimary
              outline
              icon="material-symbols:picture-as-pdf-outline"
              :label="t('crm.overviewPipeline.exportPdf')"
              :title="t('crm.overviewPipeline.exportPdfHint')"
              :disabled="!overview"
              @click="onExportPdf"
            />
          </div>
        </div>

        <UCard class="mb-4" :ui="GLASS_PANEL_UI">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="flex-1">
              <InputText v-model="search" :placeholder="t('crm.overviewPipeline.filters.search')" name="overviewSearch" />
            </div>
            <div class="w-full lg:w-44">
              <InputSelect v-model="assigneeFilter" :options="teamMembersStore.filterOptions" name="overviewAssignee" />
            </div>
            <div class="w-full lg:w-44">
              <InputSelect v-model="sourceFilter" :options="sourceOptions" name="overviewSource" />
            </div>
            <div class="w-full lg:w-44">
              <InputSelect v-model="businessUnitFilter" :options="BUSINESS_UNIT_FILTER_OPTIONS" name="overviewBusinessUnit" />
            </div>
            <div class="w-full lg:w-40">
              <InputSelect v-model="tagFilter" :options="tagOptions" name="overviewTag" />
            </div>
            <UButton v-if="hasFilters" color="neutral" variant="link" :label="t('crm.overviewPipeline.filters.clear')" @click="clearFilters" />
          </div>
        </UCard>

        <template v-if="overview">
          <div class="transition-opacity" :class="loading ? 'opacity-60' : ''">
            <CrmOverviewPipelineSummaryStrip :summary="overview.summary" :period-days="periodDays" class="mb-3" />

            <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-(--color-dark-gray)">
              <span class="flex items-center gap-1">
                <span class="inline-flex items-center gap-0.5 rounded-full bg-(--color-info-toast)/12 px-1.5 py-px text-[11px] text-(--color-info-toast)">
                  <UIcon name="material-symbols:arrow-upward" class="size-3" />{{ t('crm.overviewPipeline.legend.moved') }}
                </span>
                {{ t('crm.overviewPipeline.legend.movedHint') }}
              </span>
              <span class="flex items-center gap-1">
                <span class="h-3.5 w-1 rounded-sm bg-(--color-warning-hover)" />
                {{ t('crm.overviewPipeline.legend.stale', { days: OVERVIEW_STALE_DAYS }) }}
              </span>
              <span>{{ t('crm.overviewPipeline.legend.terminal') }}</span>
              <span class="text-(--color-gray) lg:ml-auto">{{ t('crm.overviewPipeline.legend.boards') }}</span>
            </div>

            <CrmOverviewPipelineBoard
              :zones="overview.zones"
              :period="periodRange"
              :collapsed="collapsed"
              :selected-key="selectedKey"
              @select="onSelect"
              @toggle-collapse="toggleCollapse"
            />
          </div>
        </template>
        <div v-else class="flex flex-col gap-3">
          <USkeleton class="h-24 w-full" />
          <div class="flex gap-3 overflow-hidden">
            <USkeleton v-for="n in 5" :key="n" class="h-80 w-60 shrink-0" />
          </div>
        </div>
      </div>

      <!-- Teleported to <body> so no scroll container in the layout can
      clip it when printing. -->
      <Teleport to="body">
        <CrmOverviewPipelinePrintReport
          v-if="overview"
          :data="overview"
          :period-label="`${periodOptions.find(o => o.value === period)?.label ?? ''} (${periodRangeLabel})`"
          :filters-label="filtersLabel"
        />
      </Teleport>

      <CrmOverviewPipelineCardPanel
        v-model:open="panelOpen"
        :selection="selection"
        :zone-lanes="selectionZoneLanes"
        @changed="refresh"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'
import { BUSINESS_UNIT_FILTER_OPTIONS } from '~/constants/mockData'
import {
  OVERVIEW_PERIOD_PRESETS,
  OVERVIEW_STALE_DAYS,
  overviewPeriodLength,
  overviewPeriodRange,
  type OverviewPeriodPreset,
} from '~/composables/utils/usePipelineOverview'

const { t } = useI18n()
useHead({ title: t('crm.overviewPipeline.pageTitle') })

const { canAccess, guardMounted } = usePageAccess(...SALES_PIPELINE_ROLES)
const { dateFormat } = useFormatter()
const { notifyApiError } = useApiErrorNotifier()
const overviewStore = usePipelineOverviewStore()
const teamMembersStore = useTeamMembersStore()
const prospectSourcesStore = useProspectSourcesStore()
const leadSourcesStore = useLeadSourcesStore()
const tagsStore = useTagsStore()

// Filters live in the URL so a review view (e.g. "last week, Mint's deals")
// can be shared as a link or reopened with the back button.
const period = useQuerySyncedRef('period', 'week')
const assigneeFilter = useQuerySyncedRef('assigned_to', 'all')
const sourceFilter = useQuerySyncedRef('source', 'all')
const businessUnitFilter = useQuerySyncedRef('business_unit', 'all')
const tagFilter = useQuerySyncedRef('tag', 'all')
const search = useQuerySyncedRef('search', '', 400)

const periodPreset = computed<OverviewPeriodPreset>(() =>
  (OVERVIEW_PERIOD_PRESETS as string[]).includes(period.value) ? period.value as OverviewPeriodPreset : 'week')
const periodOptions = computed(() => OVERVIEW_PERIOD_PRESETS.map(p => ({ label: t(`crm.overviewPipeline.periods.${p}`), value: p })))
const periodRange = computed(() => overviewPeriodRange(periodPreset.value))
const periodDays = computed(() => overviewPeriodLength(periodRange.value))
const periodRangeLabel = computed(() => t('crm.overviewPipeline.periodRange', {
  from: dateFormat(periodRange.value.date_from),
  to: dateFormat(periodRange.value.date_to),
}))

// Prospect and Lead/Deal sources are separate admin lists; the filter offers
// both, and the backend matches each record against its own source field.
const sourceOptions = computed<Select[]>(() => {
  const seen = new Set<string>()
  const merged: Select[] = []
  for (const option of [...prospectSourcesStore.activeOptions, ...leadSourcesStore.activeOptions]) {
    const key = String(option.value)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(option)
  }
  return [{ label: t('crm.overviewPipeline.filters.allSources'), value: 'all' }, ...merged]
})
const tagOptions = computed<Select[]>(() => [
  { label: t('crm.overviewPipeline.filters.allTags'), value: 'all' },
  ...tagsStore.items.filter(tag => tag.status === 'active').map(tag => ({ label: tag.name, value: tag.name })),
])

const hasFilters = computed(() => [assigneeFilter, sourceFilter, businessUnitFilter, tagFilter].some(f => f.value !== 'all') || search.value !== '')
const clearFilters = () => {
  assigneeFilter.value = 'all'
  sourceFilter.value = 'all'
  businessUnitFilter.value = 'all'
  tagFilter.value = 'all'
  search.value = ''
}
const filtersLabel = computed(() => {
  const parts: string[] = []
  if (assigneeFilter.value !== 'all') parts.push(String(teamMembersStore.filterOptions.find(o => o.value === assigneeFilter.value)?.label ?? assigneeFilter.value))
  for (const f of [sourceFilter, businessUnitFilter, tagFilter]) if (f.value !== 'all') parts.push(f.value)
  if (search.value) parts.push(`"${search.value}"`)
  return parts.join(', ')
})

const buildParams = (): PipelineOverviewParams => {
  const opt = (v: string) => (v === 'all' || v === '' ? undefined : v)
  return {
    ...periodRange.value,
    assigned_to: opt(assigneeFilter.value),
    source: opt(sourceFilter.value),
    business_unit: opt(businessUnitFilter.value),
    tag: opt(tagFilter.value),
    search: opt(search.value.trim()),
  }
}

const overview = computed(() => overviewStore.data)
const loading = computed(() => overviewStore.loading)

const refresh = async () => {
  try {
    await overviewStore.fetch(buildParams())
  } catch (err) {
    notifyApiError(err)
  }
}

guardMounted(() => {
  refresh()
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  if (prospectSourcesStore.items.length === 0) prospectSourcesStore.fetchAll().catch(notifyApiError)
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll().catch(notifyApiError)
  if (tagsStore.items.length === 0) tagsStore.fetchAll().catch(notifyApiError)
})
watch([periodPreset, assigneeFilter, sourceFilter, businessUnitFilter, tagFilter], () => { if (canAccess.value) refresh() })
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { if (canAccess.value) refresh() }, 400)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

// Collapsed zones are a per-viewer layout preference, so they're remembered
// in this browser only, not in the shareable URL.
const COLLAPSED_KEY = 'overview-pipeline:collapsed'
const collapsed = ref<Partial<Record<PipelineOverviewZoneKey, boolean>>>({})
onMounted(() => {
  try {
    collapsed.value = JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '{}')
  } catch {
    collapsed.value = {}
  }
})
const toggleCollapse = (zone: PipelineOverviewZoneKey) => {
  collapsed.value = { ...collapsed.value, [zone]: !collapsed.value[zone] }
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed.value))
  } catch {
    // Storage blocked (private mode etc.) — the toggle still works for this visit.
  }
}

// The side panel keeps pointing at the same record across refetches: after a
// stage move the card now sits in a different lane object, so it's looked up
// again by zone + id rather than holding on to the stale one.
const selectedRef = ref<{ zone: PipelineOverviewZoneKey, id: number } | null>(null)
const panelOpen = ref(false)
const selectedKey = computed(() => (panelOpen.value && selectedRef.value ? `${selectedRef.value.zone}:${selectedRef.value.id}` : null))
const lastSelection = ref<PipelineOverviewSelection | null>(null)
const selection = computed<PipelineOverviewSelection | null>(() => {
  const target = selectedRef.value
  if (!target || !overview.value) return lastSelection.value
  const zone = overview.value.zones.find(z => z.key === target.zone)
  for (const lane of zone?.lanes ?? []) {
    const card = lane.cards.find(c => c.id === target.id)
    if (card) return { zone: target.zone, lane, card }
  }
  // Moved out of view (e.g. into a terminal lane outside the period): keep
  // showing what we last had rather than blanking the open panel.
  return lastSelection.value
})
watch(selection, (value) => { if (value) lastSelection.value = value })
const selectionZoneLanes = computed(() => overview.value?.zones.find(z => z.key === selection.value?.zone)?.lanes ?? [])
const onSelect = (payload: PipelineOverviewSelection) => {
  lastSelection.value = payload
  selectedRef.value = { zone: payload.zone, id: payload.card.id }
  panelOpen.value = true
}

const onExportPdf = () => window.print()
</script>

<style>
/* "Export PDF" prints only the PrintReport summary; the app chrome and the
   interactive board are hidden. Unscoped on purpose: it has to reach the
   layout's sidebar/header, which live outside this page's component. */
@media print {
  @page { size: A4 landscape; margin: 12mm; }
  body * { visibility: hidden; }
  .overview-print, .overview-print * { visibility: visible; }
  .overview-print { display: block !important; position: absolute; inset: 0 auto auto 0; width: 100%; }
}
</style>
