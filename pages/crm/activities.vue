<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-xl font-black">{{ t('crm.activities.index.heading') }}</h2>
          <p class="text-sm text-(--color-gray)">{{ t('crm.activities.index.subheading') }}</p>
        </div>
        <ButtonPrimary
          :label="t('crm.activities.index.addActivity')"
          icon="material-symbols:add"
          @click="addActivityOpen = true"
        />
      </div>

      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div class="flex-1 sm:min-w-56">
            <InputText v-model="search" :placeholder="t('crm.activities.index.searchPlaceholder')" name="search" />
          </div>
          <CrmMoreFilters :count="secondaryFilterCount">
            <div class="w-full sm:w-48">
              <InputSelect
                v-model="typeFilter"
                :options="typeFilterOptions"
                :placeholder="t('crm.activities.index.filterType')"
                name="typeFilter"
              />
            </div>
            <div class="w-full sm:w-48">
              <InputSelect
                v-model="relatedTypeFilter"
                :options="relatedTypeFilterOptions"
                :placeholder="t('crm.activities.index.filterRelatedType')"
                name="relatedTypeFilter"
              />
            </div>
          </CrmMoreFilters>
          <UButton
            v-if="hasActiveFilters"
            class="self-start"
            icon="material-symbols:filter-alt-off-outline"
            variant="outline"
            color="neutral"
            :label="t('crm.activities.index.clearFilters')"
            data-cy="activities-clear-filters"
            @click="clearFilters"
          />
        </div>
      </UCard>

      <TableData
        v-model:page="page"
        server-paginated
        :columns="columns"
        :rows="displayRows"
        :total="total"
        :total-page="totalPage"
        :per-page="perPage"
        :loading="loading"
        :filtered="hasActiveFilters"
        :empty-title="hasActiveFilters ? t('crm.activities.index.emptyFilteredTitle') : t('crm.activities.index.emptyTitle')"
        :empty-description="hasActiveFilters ? t('crm.activities.index.emptyFilteredDescription') : t('crm.activities.index.emptyDescription')"
        empty-icon="material-symbols:history"
        :empty-action-label="t('crm.activities.index.addActivity')"
        @change-page="onChangePage"
        @change-per-page="onChangePerPage"
        @empty-action="addActivityOpen = true"
        @clear-filters="clearFilters"
      />

      <CrmAddActivityModal
        v-model:open="addActivityOpen"
        show-related-picker
        @submit="onSubmitActivity"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'
import type { ActivityFeedItem } from '~/stores/activities'

const { t } = useI18n()

useHead({ title: t('crm.activities.index.pageTitle') })

// Matches SALES_PIPELINE_ROLES already used to gate this page's own nav
// entry (layouts/default.vue) — same guard pattern as pages/crm/tasks/index.vue.
const { canAccess, guardMounted } = usePageAccess(...SALES_PIPELINE_ROLES)

const { dateTimeFormat, toBadge } = useFormatter()
const { activityTypeOptions, activityTypeLabel, activityTypeBadgeColor } = useActivityTypeMeta()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const activitiesStore = useActivitiesStore()
const dealsStore = useDealsStore()
const contactsStore = useContactsStore()
const companiesStore = useCompaniesStore()
const prospectsStore = useProspectsStore()
const leadsStore = useLeadsStore()
const { resolveRelated } = useRelatedRecord()

// Query-synced (not a plain ref) so a search/filter set by hand survives a
// back-button return to this list — see useQuerySyncedRef's own doc comment.
const search = useQuerySyncedRef('search', '', 400)
const typeFilter = useQuerySyncedRef('type')
const relatedTypeFilter = useQuerySyncedRef('related_type')

const secondaryFilterCount = computed(() => [typeFilter, relatedTypeFilter].filter(f => f.value !== 'all').length)
const hasActiveFilters = computed(() => Boolean(search.value) || secondaryFilterCount.value > 0)
const clearFilters = () => {
  search.value = ''
  typeFilter.value = 'all'
  relatedTypeFilter.value = 'all'
}

const typeFilterOptions = computed<Select[]>(() => [
  { label: t('crm.activities.index.allTypes'), value: 'all' },
  ...activityTypeOptions.value,
  { label: t('crm.activities.index.stageChangeType'), value: 'stage_change' },
])

// Ordered by funnel stage (Prospect -> Lead -> Deal) rather than alphabetically,
// so the options a rep reaches for most while triaging follow-ups (the earlier
// funnel stages) sort first, with the two reference-only record types
// (Company/Contact — never a funnel stage themselves) trailing after.
const relatedTypeFilterOptions = computed<Select[]>(() => [
  { label: t('crm.activities.index.allRelatedTypes'), value: 'all' },
  { label: t('crm.activities.index.relatedTypeProspect'), value: 'prospect' },
  { label: t('crm.activities.index.relatedTypeLead'), value: 'lead' },
  { label: t('crm.activities.index.relatedTypeDeal'), value: 'deal' },
  { label: t('crm.activities.index.relatedTypeCompany'), value: 'company' },
  { label: t('crm.activities.index.relatedTypeContact'), value: 'contact' },
])

// Server-side paging/filtering/search (GET /activities?include_stage_changes=true):
// real Activities and Deal stage-change history (audit log) come back as one
// interleaved, newest-first feed — previously both were pulled whole (capped
// at 200 each) and merged/filtered/paged client-side.
const buildParams = () => ({
  search: search.value || undefined,
  type: typeFilter.value !== 'all' ? typeFilter.value : undefined,
  related_type: relatedTypeFilter.value !== 'all' ? relatedTypeFilter.value : undefined,
})

const {
  rows,
  total,
  totalPage,
  page,
  perPage,
  loading,
  fetch,
  refetchFromStart,
  refetchDebounced,
  onChangePage,
  onChangePerPage,
} = useServerListPage<ActivityFeedItem>(params => activitiesStore.fetchFeed(params), buildParams)

watch(search, () => refetchDebounced())
watch([typeFilter, relatedTypeFilter], () => refetchFromStart())

guardMounted(() => {
  fetch()
  // Preloaded so resolveRelated below can show a name instead of "-" for
  // most rows on first render, same reasoning as pages/crm/tasks/index.vue.
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  if (prospectsStore.items.length === 0) prospectsStore.fetchAll().catch(notifyApiError)
  if (leadsStore.items.length === 0) leadsStore.fetchAll().catch(notifyApiError)
})

// A stage-change row with no known stage on either side (shouldn't happen
// since the audit-log `action` fix, but older/foreign rows could) reads
// "Stage changed" rather than a dangling "Stage set:" with nothing after it.
const stageChangeSubject = (row: ActivityFeedItem) => {
  if (row.from_stage && row.to_stage) return t('crm.activities.index.stageChangeSubject', { from: row.from_stage, to: row.to_stage })
  if (row.to_stage) return t('crm.activities.index.stageChangeSubjectNoFrom', { to: row.to_stage })
  return t('crm.activities.index.stageChangeSubjectUnknown')
}

const displayRows = computed(() => rows.value.map((row) => {
  const related = resolveRelated(row.related_type, row.related_id)
  const isStageChange = row.kind === 'stage_change'
  return {
    ...row,
    subject: isStageChange ? stageChangeSubject(row) : row.subject,
    // Distinct neutral "Stage Change" badge — never shares a color/label
    // with a real ActivityType — so these read as system-recorded history.
    typeBadge: isStageChange
      ? toBadge(t('crm.activities.index.stageChangeType'), 'neutral')
      : toBadge(activityTypeLabel(row.type as ActivityType), activityTypeBadgeColor(row.type as ActivityType)),
    // A stage change's "Pipeline History" lives on the Deal's Activity tab.
    relatedLink: { label: related.relatedLabel, path: isStageChange ? `${related.path}/activity` : related.path },
    createdAtDisplay: dateTimeFormat(row.created_at.toISOString()),
  }
}))

// computed (not a plain const) so column labels stay correct across the
// TH/EN switcher in the header.
const columns = computed<TableDataColumn[]>(() => [
  { label: t('crm.activities.index.columns.type'), align: 'left', field: 'typeBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.activities.index.columns.subject'), align: 'left', field: 'subject' },
  { label: t('crm.activities.index.columns.related'), align: 'left', field: 'relatedLink', type: TABLE_CARD_TYPE.LINK },
  { label: t('crm.activities.index.columns.createdBy'), align: 'left', field: 'created_by' },
  { label: t('crm.activities.index.columns.createdAt'), align: 'left', field: 'createdAtDisplay' },
])

// AddActivityModal's showRelatedPicker mode supplies related_type/related_id
// itself, so this calls activitiesStore.add() directly.
const addActivityOpen = ref(false)
const onSubmitActivity = async (payload: { type: ActivityType, subject: string, notes: string, created_at?: string, related_type?: ActivityRelatedType, related_id?: number }) => {
  if (!payload.related_type || !payload.related_id) return
  try {
    await activitiesStore.add({
      type: payload.type,
      subject: payload.subject,
      notes: payload.notes,
      created_at: payload.created_at,
      related_type: payload.related_type,
      related_id: payload.related_id,
    })
    success(t('crm.activities.index.addActivitySuccess'))
    await fetch()
  } catch (err) {
    notifyApiError(err)
  }
}
</script>
