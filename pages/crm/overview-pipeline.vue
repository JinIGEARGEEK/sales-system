<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="overview-screen flex flex-col gap-4">
        <!-- Same header layout as the Kanban pages (Deals/Leads/Prospects):
        heading left, actions right. -->
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-xl font-black">{{ t('crm.overviewPipeline.heading') }}</h2>
          <div class="flex flex-wrap items-center gap-2">
            <span v-if="fetchedAtLabel" class="text-xs text-(--color-gray)">{{ fetchedAtLabel }}</span>
            <UTooltip :text="t('crm.overviewPipeline.refresh')">
              <UButton
                color="neutral"
                variant="outline"
                icon="material-symbols:refresh"
                :loading="loading"
                :aria-label="t('crm.overviewPipeline.refresh')"
                @click="refresh"
              />
            </UTooltip>
            <UTooltip :text="t('crm.overviewPipeline.exportPdfHint')">
              <ButtonPrimary
                outline
                icon="material-symbols:picture-as-pdf-outline"
                :label="t('crm.overviewPipeline.exportPdf')"
                :disabled="!overview"
                @click="onExportPdf"
              />
            </UTooltip>
          </div>
        </div>

        <UAlert
          color="info"
          variant="subtle"
          icon="material-symbols:info-outline"
          :description="t('crm.overviewPipeline.subheading')"
          :ui="{ root: 'p-2', icon: 'size-4', description: 'text-xs text-(--color-black)' }"
        />

        <UCard :ui="GLASS_PANEL_UI">
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
              <CrmStatusPill v-model="period" :options="periodOptions" class="flex-wrap [&>button]:whitespace-nowrap" data-cy="overview-period" />
              <span class="flex items-center gap-1 text-xs text-(--color-dark-gray)">
                <UIcon name="material-symbols:calendar-month-outline" class="size-4 text-(--color-gray)" />
                {{ t('crm.overviewPipeline.periodContext', { range: periodRangeLabel, days: periodDays }) }}
              </span>
            </div>
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
              <UButton v-if="hasFilters" color="neutral" variant="link" icon="material-symbols:filter-alt-off-outline" :label="t('crm.overviewPipeline.filters.clear')" @click="clearFilters" />
            </div>
          </div>
        </UCard>

        <template v-if="overview">
          <div class="flex flex-col gap-4 transition-opacity" :class="loading ? 'opacity-60' : ''" :aria-busy="loading">
            <CrmOverviewPipelineSummaryStrip :summary="overview.summary" />

            <CrmOverviewPipelineStaleBanner
              v-if="counts.stale_deals > 0 && highlight !== 'stale'"
              :count="counts.stale_deals"
              :value="counts.stale_deal_value"
              @highlight="highlightStaleDeals"
            />

            <div v-if="isEmpty" class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-(--color-card-border) bg-white px-6 py-12 text-center">
              <UIcon name="material-symbols:filter-list-off" class="size-8 text-(--color-gray)" />
              <p class="font-medium">{{ t('crm.overviewPipeline.empty.title') }}</p>
              <p class="text-sm text-(--color-gray)">{{ t('crm.overviewPipeline.empty.body') }}</p>
              <ButtonPrimary v-if="hasFilters" outline class="mt-2" :label="t('crm.overviewPipeline.filters.clear')" @click="clearFilters" />
            </div>
            <template v-else>
              <CrmOverviewPipelineToolbar
                v-model:highlight="highlight"
                :zones="overview.zones"
                :counts="counts"
                :period="periodRange"
                @jump="onJump"
              />
              <CrmOverviewPipelineBoard
                ref="board"
                :zones="overview.zones"
                :period="periodRange"
                :collapsed="collapsed"
                :selected-key="selectedKey"
                :highlight="highlight"
                @select="onSelect"
                @toggle-collapse="toggleCollapse"
              />
            </template>
          </div>
        </template>
        <div v-else class="flex flex-col gap-4">
          <USkeleton class="h-28 w-full rounded-xl" />
          <USkeleton class="h-7 w-96 max-w-full" />
          <div class="flex gap-3 overflow-hidden">
            <USkeleton v-for="n in 5" :key="n" class="h-72 w-60 shrink-0 rounded-lg" />
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
  overviewPeriodLength,
  overviewPeriodRange,
  type OverviewHighlight,
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
const pipelineStagesStore = usePipelineStagesStore()
const prospectStagesStore = useProspectStagesStore()

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
const fetchedAtLabel = computed(() => {
  const at = overviewStore.fetchedAt
  if (!at) return ''
  return t('crm.overviewPipeline.updatedAt', { time: `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}` })
})
const isEmpty = computed(() => !!overview.value && overview.value.zones.every(z => z.lanes.every(l => l.count === 0)))

// Highlight dims every card that doesn't match, client-side over the cards
// already loaded — a reviewer's "what needs a question?" pass, without
// another request (the counts beside each mode are the API's exact totals).
// Reset when the data underneath changes shape (period or filters), since
// the matching set is different then.
const highlight = ref<OverviewHighlight>('all')
// Exact, board-wide counts from the API — not a tally of the loaded cards,
// which are capped per lane.
const counts = computed(() => overview.value?.highlight ?? { stale: 0, moved: 0, slipped: 0, stale_deals: 0, stale_deal_value: 0 })
watch([periodPreset, assigneeFilter, sourceFilter, businessUnitFilter, tagFilter, search], () => { highlight.value = 'all' })

const board = useTemplateRef<{ jumpTo: (zone: PipelineOverviewZoneKey) => void }>('board')
const onJump = (zone: PipelineOverviewZoneKey) => {
  if (collapsed.value[zone]) toggleCollapse(zone)
  nextTick(() => board.value?.jumpTo(zone))
}
const highlightStaleDeals = () => {
  highlight.value = 'stale'
  onJump('deal')
}

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
  // Lane colors/descriptions come from the stage configs, same as the
  // Kanban boards (usePipelineStageColors), so custom stages match there.
  if (pipelineStagesStore.items.length === 0) pipelineStagesStore.fetchAll().catch(notifyApiError)
  if (prospectStagesStore.items.length === 0) prospectStagesStore.fetchAll().catch(notifyApiError)
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

// The open panel follows its record across refetches: after a stage move the
// card sits in a different lane object, so the selection is re-resolved from
// fresh data by zone + id. If the record is no longer on the board (e.g. moved
// into a terminal lane outside the period), the panel keeps the last snapshot
// rather than blanking.
const panelOpen = ref(false)
const selection = ref<PipelineOverviewSelection | null>(null)
const selectedKey = computed(() => (panelOpen.value && selection.value ? `${selection.value.zone}:${selection.value.card.id}` : null))
const selectionZoneLanes = computed(() => overview.value?.zones.find(z => z.key === selection.value?.zone)?.lanes ?? [])
watch(overview, (data) => {
  const current = selection.value
  if (!data || !current) return
  for (const lane of data.zones.find(z => z.key === current.zone)?.lanes ?? []) {
    const card = lane.cards.find(c => c.id === current.card.id)
    if (card) {
      selection.value = { zone: current.zone, lane, card }
      return
    }
  }
})
const onSelect = (payload: PipelineOverviewSelection) => {
  selection.value = payload
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
