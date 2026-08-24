<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black">{{ t('crm.deals.index.heading') }}</h2>
      <div class="flex items-center gap-3">
        <!-- View switcher: one joined segmented control, not two standalone
             buttons — kept visually distinct from the Export/Add actions so
             it doesn't read as a third/fourth action in the row. -->
        <div class="flex items-center gap-0.5 rounded-full bg-[var(--color-light-gray-1)] p-1">
          <UTooltip :text="t('crm.deals.index.viewKanban')">
            <button
              type="button"
              class="flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors"
              :class="viewMode === 'kanban' ? 'bg-[var(--color-primary)] shadow-sm' : 'text-[var(--color-gray)] hover:text-[var(--color-black)]'"
              :aria-label="t('crm.deals.index.viewKanban')"
              @click="viewMode = 'kanban'"
            >
              <UIcon name="material-symbols:view-kanban-outline" class="size-4" />
            </button>
          </UTooltip>
          <UTooltip :text="t('crm.deals.index.viewList')">
            <button
              type="button"
              class="flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors"
              :class="viewMode === 'list' ? 'bg-[var(--color-primary)] shadow-sm' : 'text-[var(--color-gray)] hover:text-[var(--color-black)]'"
              :aria-label="t('crm.deals.index.viewList')"
              @click="viewMode = 'list'"
            >
              <UIcon name="material-symbols:view-list" class="size-4" />
            </button>
          </UTooltip>
        </div>

        <div class="flex items-center gap-2 border-l border-[var(--color-light-gray-2)] pl-3">
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
        <div class="w-full sm:w-40">
          <InputSelect v-model="businessUnitFilter" :options="BUSINESS_UNIT_FILTER_OPTIONS" :placeholder="t('crm.dashboard.filterBusinessUnit')" name="businessUnitFilter" />
        </div>
        <div class="w-full sm:w-36">
          <InputSelect v-model="channelFilter" :options="channelFilterOptions" :placeholder="t('crm.dashboard.filterChannel')" name="channelFilter" />
        </div>
      </div>
    </UCard>

    <CrmPipelineBoard
      v-if="viewMode === 'kanban'"
      :columns="pipelineStagesStore.activeOptions"
      :items="pipelineItems"
      :column-counts="columnCounts"
      @move="onMove"
      @select="onSelect"
    >
      <template #column-footer="{ column }">
        <button
          v-if="hasMoreDeals(column.value)"
          type="button"
          class="mt-1 shrink-0 cursor-pointer rounded-md border border-dashed border-[var(--color-light-gray-2)] py-1.5 text-xs text-[var(--color-gray)] transition-colors hover:text-[var(--color-black)] disabled:cursor-not-allowed disabled:opacity-60"
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
            <p class="mt-1 truncate text-xs text-[var(--color-gray)]">{{ companiesStore.nameById(item.company_id) }}</p>
          </div>
          <p class="mt-2 text-sm font-medium text-[var(--color-primary)]">
            {{ t('global.currencySymbol') }}{{ priceFormatCompact(item.value) }}
          </p>
          <div class="mt-2 flex items-center gap-1.5 border-t border-[var(--color-light-gray-2)] pt-2">
            <UIcon name="material-symbols:person" class="size-3.5 shrink-0 text-[var(--color-gray)]" />
            <p class="truncate text-xs text-[var(--color-gray)]">{{ teamMembersStore.nameById(item.assigned_to) }}</p>
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
            <p class="mt-1 truncate text-xs text-[var(--color-gray)]">{{ companiesStore.nameById(item.company_id) }}</p>
          </div>
          <div class="mt-2 flex items-center gap-1.5 border-t border-[var(--color-light-gray-2)] pt-2">
            <UIcon name="material-symbols:person" class="size-3.5 shrink-0 text-[var(--color-gray)]" />
            <p class="truncate text-xs text-[var(--color-gray)]">{{ teamMembersStore.nameById(item.assigned_to) }}</p>
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
    />
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
  const result = await dealsStore.fetchList({ stage: stageName, per_page: DEALS_PAGE_SIZE, page })
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
// the user had already paged into.
const refetchStageDeals = async (stageName: string) => {
  const pagesToRefetch = Math.max(dealStageBuckets.value[stageName]?.page ?? 0, 1)
  let items: Deal[] = []
  let total = 0
  for (let page = 1; page <= pagesToRefetch; page++) {
    const result = await dealsStore.fetchList({ stage: stageName, per_page: DEALS_PAGE_SIZE, page })
    items = [...items, ...result.items]
    total = result.total
  }
  dealStageBuckets.value[stageName] = { items, total, page: pagesToRefetch }
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

const viewMode = ref<'kanban' | 'list'>('kanban')

const search = ref('')
const assigneeFilter = ref('all')
const businessUnitFilter = ref('all')
const channelFilter = ref('all')

// Flattens the currently-loaded pages across every stage bucket — this is
// what actually renders on the board, so a column only ever shows up to
// `DEALS_PAGE_SIZE` (+ any "Load more" pages fetched) Deals at once, never the
// column's full total.
const loadedDeals = computed(() => Object.values(dealStageBuckets.value).flatMap(bucket => bucket.items))

const filteredDeals = computed(() => {
  return loadedDeals.value.filter((deal) => {
    const matchSearch = !search.value
      || deal.title.toLowerCase().includes(search.value.toLowerCase())
      || companiesStore.nameById(deal.company_id).toLowerCase().includes(search.value.toLowerCase())
    const matchAssignee = matchesAssigneeFilter(deal.assigned_to, assigneeFilter.value)
    if (businessUnitFilter.value !== 'all' && deal.business_unit !== businessUnitFilter.value) return false
    const matchChannel = channelFilter.value === 'all' || deal.channel === channelFilter.value
    return matchSearch && matchAssignee && matchChannel
  })
})

// Leads have no business_unit/channel, so only search and assignee apply here.
const filteredLeads = computed(() => {
  return leadsStore.items.filter((lead) => {
    const matchSearch = !search.value
      || lead.name.toLowerCase().includes(search.value.toLowerCase())
      || companiesStore.nameById(lead.company_id).toLowerCase().includes(search.value.toLowerCase())
    const matchAssignee = matchesAssigneeFilter(lead.assigned_to, assigneeFilter.value)
    return matchSearch && matchAssignee
  })
})

// A Lead has no `stage` — this maps its status onto the board's DealStage lanes:
// New/Contacted share the "Lead" column, Qualified gets its own column, and
// Disqualified lands in the lost-flagged column alongside real lost Deals (see
// the card badge). The "Lost" column is resolved through the PipelineStage
// row's is_lost_stage flag (via pipelineStagesStore.lostStageName, same store
// added for the Mark Won fix) instead of the literal name "Lost", since an
// Admin can rename that stage. "Lead" has no equivalent flag on PipelineStage
// (only is_won_stage/is_lost_stage exist) so it stays the literal default
// stage name — same for the `lead.status === 'Qualified'` comparisons below,
// which check the fixed (non-admin-configurable) Lead.Status enum, not a Deal
// pipeline stage; it's coincidence, not a lookup, that the enum value and the
// default "Qualified" stage name are spelled the same.
const leadLane = (lead: Lead): string => {
  if (lead.status === 'Disqualified') return pipelineStagesStore.lostStageName
  if (lead.status === 'Qualified') return 'Qualified'
  return 'Lead'
}

// Status a Lead should take when dropped directly on one of its own lanes.
// Dropping past "Qualified" (Proposal Sent/Negotiation/Won) instead triggers
// a real conversion — see the `else` branch of onMove below. Keyed by the
// same lane values leadLane() returns, so the lost-flagged column's key must
// also track pipelineStagesStore.lostStageName rather than a hardcoded "Lost".
const LEAD_STATUS_FOR_LANE = computed<Record<string, LeadStatus>>(() => ({
  Lead: 'New',
  Qualified: 'Qualified',
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

const onMove = async (item: (Deal & { _type: 'deal' }) | (Lead & { _type: 'lead' }), newStage: string) => {
  if (item._type === 'deal') {
    const originStage = item.stage
    if (originStage === newStage) return
    try {
      await dealsStore.updateStage(item.id, newStage as DealStage)
      success(t('crm.deals.index.dealMovedTo', { stage: newStage }))
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
      error(getApiErrorMessage(err, t('global.genericError')))
    }
    return
  }

  const lead = leadsStore.items.find(l => l.id === item.id)
  if (!lead) return

  const newStatus = LEAD_STATUS_FOR_LANE.value[newStage]
  if (newStatus) {
    if (lead.status === newStatus) return
    try {
      await leadsStore.update(lead.id, { status: newStatus })
      success(t('crm.deals.index.leadStatusUpdated', { status: newStatus }))
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
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onSelect = (item: (Deal & { _type: 'deal' }) | (Lead & { _type: 'lead' })) => {
  navigateTo(item._type === 'deal' ? `/crm/deals/${item.id}` : `/crm/leads/${item.id}`)
}
</script>
