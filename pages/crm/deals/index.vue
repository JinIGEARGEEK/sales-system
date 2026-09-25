<template>
  <div class="p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xl font-black">{{ t('crm.deals.index.heading') }}</h2>
      <div class="flex flex-wrap items-center gap-3">
        <CrmViewModeToggle v-model="viewMode" :kanban-label="t('crm.deals.index.viewKanban')" :list-label="t('crm.deals.index.viewList')" />

        <div class="flex items-center gap-2 border-l border-(--color-light-gray-2) pl-3">
          <ButtonPrimary
            v-if="canExport"
            outline
            fit-content
            :ui="{ base: 'h-9' }"
            :label="t('crm.deals.index.exportCsv')"
            icon="material-symbols:download"
            @click="onExport"
          />
          <ButtonPrimary
            :ui="{ base: 'h-9' }"
            :label="t('crm.deals.index.addDeal')"
            icon="material-symbols:add"
            @click="navigateTo('/crm/deals/create')"
          />
        </div>
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div class="flex-1 sm:min-w-48">
          <InputText v-model="search" :placeholder="t('crm.deals.index.searchPlaceholder')" name="search" />
        </div>
        <div class="w-full sm:w-56">
          <InputSelect v-model="assigneeFilter" :options="teamMembersStore.filterOptions" :placeholder="t('crm.deals.index.assigneePlaceholder')" name="assigneeFilter" />
        </div>
        <CrmMoreFilters :count="secondaryFilterCount">
          <div class="w-full sm:w-48">
            <InputSelect v-model="businessUnitFilter" :options="BUSINESS_UNIT_FILTER_OPTIONS" :placeholder="t('crm.dashboard.filterBusinessUnit')" name="businessUnitFilter" />
          </div>
          <div class="w-full sm:w-44">
            <InputSelect v-model="channelFilter" :options="channelFilterOptions" :placeholder="t('crm.dashboard.filterChannel')" name="channelFilter" />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect v-model="stageFilter" :options="stageFilterOptions" :placeholder="t('crm.dashboard.filterStage')" name="stageFilter" />
          </div>
        </CrmMoreFilters>
      </div>
    </UCard>

    <!-- Small, low-emphasis Admin-only shortcut to this board's stage
    config — sits just above the lanes it configures rather than in the
    header action row, so it reads as "settings for what's below" instead
    of competing with the primary Export/Add actions up top. -->
    <div v-if="viewMode === 'kanban' && hasRole('Admin')" class="mb-2">
      <AdminPipelineConfigShortcut tab="stages" :tooltip="t('crm.deals.index.manageStages')" />
    </div>

    <CrmPipelineBoard
      v-if="viewMode === 'kanban'"
      entity="deal"
      :columns="pipelineStagesStore.activeOptions"
      :items="pipelineItems"
      :column-counts="columnCounts"
      allow-quick-add
      @move="onMove"
      @select="onSelect"
      @add-in-column="onAddInColumn"
    >
      <template #column-footer="{ column }">
        <button
          v-if="hasMoreDeals(column.value)"
          type="button"
          class="mt-1 shrink-0 cursor-pointer rounded-md border border-dashed border-(--color-light-gray-2) py-1.5 text-xs text-(--color-gray) transition-colors hover:text-(--color-black) disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loadingMoreStage === column.value"
          @click="loadMoreDeals(column.value)"
        >
          {{ loadingMoreStage === column.value ? t('global.loading') : t('crm.deals.index.loadMoreDeals', { count: remainingDealsCount(column.value) }) }}
        </button>
      </template>
      <template #card="{ item }">
        <template v-if="item._type === 'deal'">
          <div>
            <p class="line-clamp-2 text-sm font-medium">{{ item.title }}</p>
            <p class="mt-1 truncate text-xs text-(--color-gray)">{{ companyLabel(item.company_id) }}</p>
          </div>
          <p class="mt-2 text-sm font-medium text-(--color-primary)">
            {{ t('global.currencySymbol') }}{{ priceFormatCompact(item.value) }}
          </p>
          <div class="mt-2 flex items-center gap-1.5 border-t border-(--color-light-gray-2) pt-2">
            <UIcon name="material-symbols:person" class="size-3.5 shrink-0 text-(--color-gray)" />
            <p class="truncate text-xs text-(--color-gray)">{{ teamMembersStore.nameById(item.assigned_to) }}</p>
          </div>
        </template>
        <template v-else>
          <div>
            <div class="flex items-center gap-1.5">
              <p class="line-clamp-2 text-sm font-medium">{{ item.name }}</p>
              <UBadge size="xs" color="neutral" variant="subtle">
                {{ item.status === 'Disqualified' ? t('crm.deals.index.disqualifiedLeadBadge') : item.status }}
              </UBadge>
              <UBadge v-if="item.classification === 'mql'" size="xs" color="info" variant="subtle">
                {{ t('crm.leads.index.mqlBadge') }}
              </UBadge>
              <UBadge v-else-if="item.classification === 'sql'" size="xs" color="success" variant="subtle">
                {{ t('crm.leads.index.sqlBadge') }}
              </UBadge>
            </div>
            <p class="mt-1 truncate text-xs text-(--color-gray)">{{ companyLabel(item.company_id) }}</p>
          </div>
          <div class="mt-2 flex items-center gap-1.5 border-t border-(--color-light-gray-2) pt-2">
            <UIcon name="material-symbols:person" class="size-3.5 shrink-0 text-(--color-gray)" />
            <p class="truncate text-xs text-(--color-gray)">{{ teamMembersStore.nameById(item.assigned_to) }}</p>
          </div>
        </template>
      </template>
    </CrmPipelineBoard>

    <CrmDealsTable
      v-else
      :search="search"
      :assignee-filter="assigneeFilter"
      :business-unit-filter="businessUnitFilter"
      :channel-filter="channelFilter"
      :stage-filter="stageFilter"
      :empty-title="t('crm.deals.index.emptyTitle')"
      :empty-description="t('crm.deals.index.emptyDescription')"
      empty-icon="material-symbols:handshake-outline"
      :empty-action-label="t('crm.deals.index.addDeal')"
      empty-action-to="/crm/deals/create"
      :filtered="hasActiveFilters"
      @clear-filters="clearFilters"
    />
    <CrmLostReasonModal v-model:open="lostReasonOpen" @confirm="onConfirmLostReason" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import {
  BUSINESS_UNIT_FILTER_OPTIONS,
  matchesAssigneeFilter,
} from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.deals.index.pageTitle') })

const { priceFormatCompact } = useFormatter()
const { companyName } = useCompanyName()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const downloadCsvBlob = useDownloadCsvBlob()
const companiesStore = useCompaniesStore()
const dealsStore = useDealsStore()
const leadsStore = useLeadsStore()
const teamMembersStore = useTeamMembersStore()
const pipelineStagesStore = usePipelineStagesStore()
const leadSourcesStore = useLeadSourcesStore()

// Admin-configurable stage/source lists (replaces the previously hardcoded
// DEAL_STAGE_OPTIONS/CHANNEL_OPTIONS constants) — the Kanban board's columns
// and this filter both read from the same store.
const channelFilterOptions = computed(() => [
  { label: 'All Channels', value: 'all' },
  ...leadSourcesStore.activeOptions,
])

// Matches the backend's /deals/export RBAC (Admin/Sales Manager) — same
// bulkRoles gate as the Deals bulk-action bar (components/Crm/DealsTable.vue).
const canExport = computed(() => hasRole(...MANAGER_ROLES))
const onExport = () => downloadCsvBlob('/deals/export', 'deals.csv')

// The Kanban board no longer loads Deals via dealsStore.fetchAll() (capped at
// per_page: 200 — would silently truncate columns once Deal volume exceeds
// that). Instead each active pipeline stage is fetched as its own bounded,
// paginated page via dealsStore.fetchList({ stage, ... }), which does NOT
// touch dealsStore.items/total — kept fully local to this page in
// `dealStageBuckets` below. Other pages/composables that read
// dealsStore.items (Deal detail, dropdowns, duplicate-deal checks, Global
// Search, dashboard, etc.) all guard with `if (dealsStore.items.length === 0)
// dealsStore.fetchAll()` themselves, so not populating it here doesn't break
// them — they simply fetch their own copy on demand.
const DEALS_PAGE_SIZE = 40

interface DealStageBucket {
  items: Deal[]
  total: number
  page: number
}

const dealStageBuckets = ref<Record<string, DealStageBucket>>({})
const loadingMoreStage = ref<string | null>(null)

const fetchStageDeals = async (stageName: string, page = 1) => {
  const result = await dealsStore.fetchList({ stage: stageName, search: search.value || undefined, per_page: DEALS_PAGE_SIZE, page, sort: 'position' })
  const bucket = dealStageBuckets.value[stageName] ?? { items: [], total: 0, page: 0 }
  bucket.items = page === 1 ? result.items : [...bucket.items, ...result.items]
  bucket.total = result.total
  bucket.page = result.page
  dealStageBuckets.value[stageName] = bucket
  return result
}

const loadAllStageDeals = async () => {
  await Promise.all(pipelineStagesStore.activeOptions.map(option => fetchStageDeals(option.value as string, 1)))
}

// Re-fetches every page currently loaded for a stage (1..bucket.page), not
// just page 1 — a plain `fetchStageDeals(stage, 1)` would silently overwrite
// `bucket.items` with only that first page, discarding any "Load more" pages
// a user had already fetched for that column. Used after a move/conversion,
// where we need the column's contents to stay correct without losing state
// the user had already paged into. Pages are independent requests, fetched
// in parallel rather than one at a time — order is preserved by `Promise.all`
// resolving in input order regardless of completion order.
const refetchStageDeals = async (stageName: string) => {
  const pagesToRefetch = Math.max(dealStageBuckets.value[stageName]?.page ?? 0, 1)
  const pages = Array.from({ length: pagesToRefetch }, (_, i) => i + 1)
  const results = await Promise.all(
    pages.map(page => dealsStore.fetchList({ stage: stageName, search: search.value || undefined, per_page: DEALS_PAGE_SIZE, page, sort: 'position' })),
  )
  dealStageBuckets.value[stageName] = {
    items: results.flatMap(result => result.items),
    total: results.at(-1)?.total ?? 0,
    page: pagesToRefetch,
  }
}

const hasMoreDeals = (stageName: string) => {
  const bucket = dealStageBuckets.value[stageName]
  return !!bucket && bucket.items.length < bucket.total
}

const remainingDealsCount = (stageName: string) => {
  const bucket = dealStageBuckets.value[stageName]
  return bucket ? bucket.total - bucket.items.length : 0
}

const loadMoreDeals = async (stageName: string) => {
  const bucket = dealStageBuckets.value[stageName]
  if (!bucket || loadingMoreStage.value) return
  loadingMoreStage.value = stageName
  try {
    await fetchStageDeals(stageName, bucket.page + 1)
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    loadingMoreStage.value = null
  }
}

onMounted(async () => {
  try {
    if (pipelineStagesStore.items.length === 0) await pipelineStagesStore.fetchAll()
    await loadAllStageDeals()
  } catch (err) {
    notifyApiError(err)
  }
  leadsStore.fetchAll({ exclude_converted: true }).catch(notifyApiError)
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll().catch(notifyApiError)
})

// URL-synced (useQuerySyncedRef): Dashboard cards/breakdown rows (e.g. Team
// Performance's per-rep rows, Pipeline by Stage's bars) deep-link here via
// these same query params, and a filter/search/view picked by hand is
// written back so refresh and back/forward restore it too.
const search = useQuerySyncedRef('search', '', 400)
const assigneeFilter = useQuerySyncedRef('assigned_to')
const businessUnitFilter = useQuerySyncedRef('business_unit')
const channelFilter = useQuerySyncedRef('channel')
const stageFilter = useQuerySyncedRef('stage')

// The Kanban board shows every stage side by side, so a single-stage/assignee
// deep link reads better landing on the List view. List becomes the *default*
// then (not a one-off override), so a hand-picked Kanban is written to the URL
// as ?view=kanban and survives a refresh.
const hasDeepLinkFilter = assigneeFilter.value !== 'all' || businessUnitFilter.value !== 'all' || channelFilter.value !== 'all' || stageFilter.value !== 'all'
const viewMode = useQuerySyncedRef<'kanban' | 'list'>('view', hasDeepLinkFilter ? 'list' : 'kanban', 0, ['kanban', 'list'])

// Business unit/channel/stage collapse behind "More filters" below md
// (CrmMoreFilters); search + assignee stay visible.
const secondaryFilterCount = computed(() => [businessUnitFilter, channelFilter, stageFilter].filter(f => f.value !== 'all').length)
const hasActiveFilters = computed(() => search.value !== '' || assigneeFilter.value !== 'all' || secondaryFilterCount.value > 0)
const clearFilters = () => {
  search.value = ''
  assigneeFilter.value = 'all'
  businessUnitFilter.value = 'all'
  channelFilter.value = 'all'
  stageFilter.value = 'all'
}

// Kanban's own board fetch (fetchStageDeals) needs a re-fetch whenever
// `search` changes while Kanban is showing (debounced, same 400ms as List
// view's own independent useServerListPage.refetchDebounced), and an
// immediate resync when switching List -> Kanban (List's own debounce only
// refetches its own table, not Kanban's buckets, so a search typed while on
// List would otherwise leave Kanban's buckets stale until the next edit).
// One watcher covers both: always clears any pending timer first so a
// view-mode switch can't race a still-armed debounce into a duplicate fetch.
let kanbanRefreshDebounce: ReturnType<typeof setTimeout> | undefined
watch([search, viewMode], ([, mode], previous) => {
  clearTimeout(kanbanRefreshDebounce)
  if (mode !== 'kanban') return
  const modeJustChanged = mode !== previous?.[1]
  if (modeJustChanged) {
    loadAllStageDeals().catch(notifyApiError)
  } else {
    kanbanRefreshDebounce = setTimeout(() => {
      loadAllStageDeals().catch(notifyApiError)
    }, 400)
  }
})

// nameById's own '-' stays for a Company not loaded yet (or no Company at
// all — Lead cards); a loaded Company with a blank name (created by
// converting a company-less Prospect) gets the "(Unnamed company)"
// placeholder instead.
const companyLabel = (id: number | null | undefined) => {
  const company = id ? companiesStore.items.find(c => c.id === id) : undefined
  return company ? companyName(company.name) : '-'
}

const stageFilterOptions = computed(() => [
  { label: t('crm.dashboard.allStages'), value: 'all' },
  ...pipelineStagesStore.activeOptions,
])

// Flattens the currently-loaded pages across every stage bucket — this is
// what actually renders on the board, so a column only ever shows up to
// `DEALS_PAGE_SIZE` (+ any "Load more" pages fetched) Deals at once, never the
// column's full total.
const loadedDeals = computed(() => Object.values(dealStageBuckets.value).flatMap(bucket => bucket.items))

// `search` is already applied server-side per stage (see fetchStageDeals) —
// matching it again here client-side would only re-narrow an already-search-
// filtered bucket, which is harmless but redundant; left out so this mirrors
// exactly what the server returned.
const filteredDeals = computed(() => {
  return loadedDeals.value.filter((deal) => {
    const matchAssignee = matchesAssigneeFilter(deal.assigned_to, assigneeFilter.value)
    if (businessUnitFilter.value !== 'all' && deal.business_unit !== businessUnitFilter.value) return false
    const matchChannel = channelFilter.value === 'all' || deal.channel === channelFilter.value
    const matchStage = stageFilter.value === 'all' || deal.stage === stageFilter.value
    return matchAssignee && matchChannel && matchStage
  })
})

// Leads gained their own business_unit tag alongside Deal's (2026-09-03) —
// honor the same Business Unit filter here now. Leads have no channel field
// though, so channelFilter still only applies to filteredDeals above.
const filteredLeads = computed(() => {
  return leadsStore.items.filter((lead) => {
    const matchSearch = !search.value
      || lead.name.toLowerCase().includes(search.value.toLowerCase())
      || companiesStore.nameById(lead.company_id).toLowerCase().includes(search.value.toLowerCase())
    const matchAssignee = matchesAssigneeFilter(lead.assigned_to, assigneeFilter.value)
    if (businessUnitFilter.value !== 'all' && lead.business_unit !== businessUnitFilter.value) return false
    return matchSearch && matchAssignee
  })
})

// A Lead has no `stage` — this maps its status onto the board's DealStage lanes:
// New/Contacted share the "Lead" column, Qualified gets its own column, and
// Disqualified lands in the lost-flagged column alongside real lost Deals (see
// the card badge). The "Lost" column is resolved through the PipelineStage
// row's is_lost_stage flag (via pipelineStagesStore.lostStageName, same store
// added for the Mark Won fix) instead of the literal name "Lost", since an
// Admin can rename that stage. New/Contacted Leads go in the first open stage
// by sort order (pipelineStagesStore.firstOpenStageName — seeded "Lead", but
// renameable, so not the literal name). A Qualified Lead goes in the stage
// named "Qualified" when it exists, else the first open stage too. The
// `lead.status === 'Qualified'` checks compare the fixed Lead.Status enum,
// not a Deal stage; it's coincidence that the default stage shares the name.
const qualifiedLane = computed(() => (pipelineStagesStore.activeOptions.some(o => o.value === 'Qualified')
  ? 'Qualified'
  : pipelineStagesStore.firstOpenStageName))
const leadLane = (lead: Lead): string => {
  if (lead.status === 'Disqualified') return pipelineStagesStore.lostStageName
  if (lead.status === 'Qualified') return qualifiedLane.value
  return pipelineStagesStore.firstOpenStageName
}

// Status a Lead should take when dropped directly on one of its own lanes.
// Dropping past "Qualified" (Proposal Sent/Negotiation/Won) instead triggers
// a real conversion — see the `else` branch of onMove below. Keyed by the
// same lane values leadLane() returns, so the lost-flagged column's key must
// also track pipelineStagesStore.lostStageName rather than a hardcoded "Lost".
const LEAD_STATUS_FOR_LANE = computed<Record<string, LeadStatus>>(() => ({
  [pipelineStagesStore.firstOpenStageName]: 'New',
  [qualifiedLane.value]: 'Qualified',
  [pipelineStagesStore.lostStageName]: 'Disqualified',
}))

const pipelineItems = computed(() => [
  ...filteredDeals.value.map(deal => ({ ...deal, _type: 'deal' as const, _lane: deal.stage })),
  ...filteredLeads.value.map(lead => ({ ...lead, _type: 'lead' as const, _lane: leadLane(lead) })),
])

// companiesStore.fetchAll() above is a capped, point-in-time snapshot (see
// its own doc in stores/companies.ts) — it can miss a Deal/Lead's Company
// outright (past the 200-newest cutoff) or simply run before that Company
// existed. Without this, every companiesStore.nameById(...) call on this page
// (both the Kanban cards' company label above and the search filter
// predicates in filteredDeals/filteredLeads) silently renders/matches "-" for
// any such row even though company_id is correctly set — same class of bug
// fixed for Contacts/Leads' own list pages. Leads' company_id is nullable, so
// skip items with none rather than fetchOne(null).
watch(pipelineItems, (items) => {
  for (const item of items) {
    if (item.company_id && !companiesStore.items.some(c => c.id === item.company_id)) {
      companiesStore.fetchOne(item.company_id).catch(notifyApiError)
    }
  }
})

// Real per-column count for the board header, even though only up to
// DEALS_PAGE_SIZE (+ any loaded "more" pages) Deals are actually rendered:
// stage's server-reported `total` (from the paginated fetch) plus however
// many Leads are currently sharing that lane (Leads are fully loaded via
// fetchAll, so filteredLeads is already a complete count, unlike Deals).
const columnCounts = computed(() => {
  const result: Record<string, number> = {}
  for (const option of pipelineStagesStore.activeOptions) {
    const stageName = option.value as string
    const dealTotal = dealStageBuckets.value[stageName]?.total ?? 0
    const leadCount = filteredLeads.value.filter(lead => leadLane(lead) === stageName).length
    result[stageName] = dealTotal + leadCount
  }
  return result
})

// Dragging (or, on phones, picking) a Deal into the Lost stage asks why
// first, same as the Overview Pipeline's side panel; the move only happens
// once a reason is chosen, and cancelling leaves the card where it was.
const lostReasonOpen = ref(false)
const pendingLostMove = ref<{ item: Deal & { _type: 'deal' }, newStage: string, position?: number } | null>(null)
const onConfirmLostReason = (reason: LostReason) => {
  const pending = pendingLostMove.value
  pendingLostMove.value = null
  if (pending) moveDeal(pending.item, pending.newStage, pending.position, reason)
}

const onMove = async (item: (Deal & { _type: 'deal' }) | (Lead & { _type: 'lead' }), newStage: string, position?: number) => {
  if (item._type === 'deal') {
    if (item.stage !== newStage && newStage === pipelineStagesStore.lostStageName) {
      pendingLostMove.value = { item, newStage, position }
      lostReasonOpen.value = true
      return
    }
    await moveDeal(item, newStage, position)
    return
  }
  await moveLead(item, newStage, position)
}

const moveDeal = async (item: Deal & { _type: 'deal' }, newStage: string, position?: number, lostReason?: LostReason) => {
  const originStage = item.stage
  const stageChanged = originStage !== newStage
  if (!stageChanged && position === undefined) return
  try {
    await dealsStore.updateStage(item.id, newStage as DealStage, position, lostReason)
    // A same-stage drop is just a within-lane reorder — no stage actually
    // changed, so skip the "moved to X" toast (misleading when nothing
    // moved between columns) and only refetch the one affected bucket.
    if (stageChanged) success(t('crm.deals.index.dealMovedTo', { stage: newStage }))
    // Board state for Deals lives in `dealStageBuckets`, keyed per stage —
    // simplest/safest way to keep both columns correct (including their
    // header totals) after a move is to refetch each affected stage rather
    // than hand-splice the moved card between local arrays. Origin and
    // destination may be the same bucket in edge cases (e.g. two rapid
    // drops), Promise.all still resolves both fine.
    await Promise.all([
      refetchStageDeals(originStage),
      refetchStageDeals(newStage),
    ])
  } catch (err) {
    // Nothing was mutated optimistically, so there's nothing to roll back —
    // the card simply stays put in its origin column.
    if (apiErrorHasFieldCode(err, 'stage', 'requires_signed_contract')) {
      error(t('crm.deals.detail.contractRequiredToast'))
    } else {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
}

const moveLead = async (item: Lead & { _type: 'lead' }, newStage: string, position?: number) => {
  const lead = leadsStore.items.find(l => l.id === item.id)
  if (!lead) return

  const newStatus = LEAD_STATUS_FOR_LANE.value[newStage]
  if (newStatus) {
    const statusChanged = lead.status !== newStatus
    if (!statusChanged && position === undefined) return
    try {
      // PATCH /leads/:id/status only ever touches status/position, unlike
      // the full-record PUT /leads/:id — no risk of blanking the rest of the
      // record on a drag-move (see leadsStore.updateStatus's own doc).
      await leadsStore.updateStatus(lead.id, newStatus, position)
      if (statusChanged) success(t('crm.deals.index.leadStatusUpdated', { status: newStatus }))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
    return
  }

  try {
    const { deal } = await leadsStore.convert(lead.id, {
      // company_id is deliberately omitted — the backend's Convert handler
      // already falls back to the Lead's own company_id when it's absent
      // (internal/handlers/leads.go), unlike assigned_to/channel below,
      // which it takes as-is from this request with no such fallback.
      deal: {
        title: lead.name,
        value: 0,
        stage: newStage as DealStage,
        assigned_to: lead.assigned_to,
        channel: lead.source,
      },
    })
    const index = leadsStore.items.findIndex(l => l.id === lead.id)
    if (index !== -1) leadsStore.items.splice(index, 1)
    dealsStore.receiveConverted(deal)
    // The newly-converted Deal needs to land in this page's own per-stage
    // bucket (dealsStore.receiveConverted only pushes to the global
    // dealsStore.items cache, which the board no longer reads from) — refetch
    // that stage (preserving any already-loaded pages) so it appears with a
    // correct total.
    await refetchStageDeals(deal.stage)
    success(t('crm.deals.index.leadConvertedToDeal'))
    // Unlike the manual "Convert to Deal" button (which routes to
    // /crm/deals/create?lead_id=... and makes value/expected_close_date
    // required before the Deal even exists), a drag-convert creates the Deal
    // immediately with a placeholder value: 0 — there's no form in the way of
    // the drag gesture. Land the rep straight on the new Deal's own edit page
    // right after, where value is a required field front and center, instead
    // of leaving a $0 Deal sitting unnoticed on the board.
    navigateTo(`/crm/deals/${deal.id}`)
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onSelect = (item: (Deal & { _type: 'deal' }) | (Lead & { _type: 'lead' })) => {
  navigateTo(item._type === 'deal' ? `/crm/deals/${item.id}` : `/crm/leads/${item.id}`)
}

// Clicking a lane's own blank space always creates a Deal at that stage
// (never a Lead, even though the lane may currently hold Lead cards too) —
// see pages/crm/deals/create.vue reading `?stage=` off the route query.
const onAddInColumn = (stage: string) => {
  navigateTo({ path: '/crm/deals/create', query: { stage } })
}
</script>
