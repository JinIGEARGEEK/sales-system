<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black">{{ t('crm.activities.index.heading') }}</h2>
          <p class="text-sm text-[var(--color-gray)]">{{ t('crm.activities.index.subheading') }}</p>
        </div>
        <ButtonPrimary
          :label="t('crm.activities.index.addActivity')"
          icon="material-symbols:add"
          @click="addActivityOpen = true"
        />
      </div>

      <UCard class="mb-4">
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText v-model="search" :placeholder="t('crm.activities.index.searchPlaceholder')" name="search" />
          </div>
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
        </div>
      </UCard>

      <TableData
        v-model:page="page"
        :columns="columns"
        :rows="rows"
        :total="filteredActivities.length"
        :total-page="totalPage"
        :per-page="perPage"
        :loading="loading"
        @change-page="onChangePage"
        @change-per-page="onChangePerPage"
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

const { t } = useI18n()

useHead({ title: t('crm.activities.index.pageTitle') })

// Matches SALES_PIPELINE_ROLES already used to gate this page's own nav
// entry (layouts/default.vue) — same guard pattern as pages/crm/tasks/index.vue.
const { canAccess, guardMounted } = usePageAccess(...SALES_PIPELINE_ROLES)

const { dateTimeFormat, toBadge } = useFormatter()
const { activityTypeOptions, activityTypeLabel, activityTypeBadgeColor } = useActivityTypeMeta()
const { fetchDealStageHistory } = useDealStageHistory()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const activitiesStore = useActivitiesStore()
const dealsStore = useDealsStore()
const contactsStore = useContactsStore()
const companiesStore = useCompaniesStore()
const prospectsStore = useProspectsStore()
const leadsStore = useLeadsStore()
const { resolveRelated } = useRelatedRecord()

const loading = ref(false)
// Deal pipeline stage-change history (audit log, read-only) — kept separate
// from activitiesStore.items (real logged Activities) since it's a
// different backend concept, then merged into one sorted/filtered/searched
// list below (combinedRows) so it shows up as reference context here rather
// than only in the Admin-only audit log viewer.
const stageHistory = ref<DealStageChangeEntry[]>([])

guardMounted(() => {
  loading.value = true
  activitiesStore.fetchAll().catch(notifyApiError).finally(() => { loading.value = false })
  fetchDealStageHistory().then((entries) => { stageHistory.value = entries }).catch(notifyApiError)
  // Preloaded so resolveRelated below can show a name instead of "-" for
  // most rows on first render, same reasoning as pages/crm/tasks/index.vue.
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  if (prospectsStore.items.length === 0) prospectsStore.fetchAll().catch(notifyApiError)
  if (leadsStore.items.length === 0) leadsStore.fetchAll().catch(notifyApiError)
})

// Query-synced (not a plain ref) so a search/filter set by hand survives a
// back-button return to this list — see useQuerySyncedRef's own doc comment.
const search = useQuerySyncedRef('search', '', 400)
const typeFilter = useQuerySyncedRef('type')
const relatedTypeFilter = useQuerySyncedRef('related_type')

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

// One shared row shape for both real Activities and stage-change entries —
// letting them share the same search/filter/sort/pagination pipeline below
// rather than running two independent ones and interleaving the results.
// typeBadge is built here (per source), not branched again in `rows` below,
// so a stage-change row's badge is never accidentally run through
// activityTypeLabel/activityTypeBadgeColor (which only know real
// ActivityType values) and `type` stays a plain filter-matching field.
interface DisplayRow {
  kind: 'activity' | 'stage_change'
  type: ActivityType | 'stage_change'
  subject: string
  created_by: string
  created_at: Date
  related_type: ActivityRelatedType
  relatedLabel: string
  path: string
  typeBadge: { title: string, color: string, isNoData: boolean }
}

const activityRows = computed<DisplayRow[]>(() => activitiesStore.items.map(activity => ({
  kind: 'activity',
  type: activity.type,
  subject: activity.subject,
  created_by: activity.created_by,
  created_at: activity.created_at,
  related_type: activity.related_type,
  typeBadge: toBadge(activityTypeLabel(activity.type), activityTypeBadgeColor(activity.type)),
  ...resolveRelated(activity.related_type, activity.related_id),
})))

// Distinct neutral "Stage Change" badge — never shares a color/label with a
// real ActivityType — so these read as system-recorded history, not
// something a rep logged, the visual distinction called out when this
// feature was scoped.
const stageChangeRows = computed<DisplayRow[]>(() => stageHistory.value.map((entry) => {
  const deal = resolveRelated('deal', entry.dealId)
  return {
    kind: 'stage_change',
    type: 'stage_change',
    subject: entry.fromStage
      ? t('crm.activities.index.stageChangeSubject', { from: entry.fromStage, to: entry.toStage })
      : t('crm.activities.index.stageChangeSubjectNoFrom', { to: entry.toStage }),
    created_by: entry.actorName,
    created_at: entry.created_at,
    related_type: 'deal',
    typeBadge: toBadge(t('crm.activities.index.stageChangeType'), 'neutral'),
    relatedLabel: deal.relatedLabel,
    // resolveRelated's deal path always points at the Overview tab (shared
    // with Tasks, which has its own reason to land there) — the "Pipeline
    // History" this row actually describes lives on the Deal's Activity
    // tab, so send the click straight there instead of making the rep find
    // it themselves after an extra click.
    path: `${deal.path}/activity`,
  }
}))

const filteredActivities = computed(() => [...activityRows.value, ...stageChangeRows.value]
  .filter((row) => {
    const matchesSearch = !search.value
      || row.subject.toLowerCase().includes(search.value.toLowerCase())
      || row.relatedLabel.toLowerCase().includes(search.value.toLowerCase())
    const matchesType = typeFilter.value === 'all' || row.type === typeFilter.value
    const matchesRelatedType = relatedTypeFilter.value === 'all' || row.related_type === relatedTypeFilter.value
    return matchesSearch && matchesType && matchesRelatedType
  })
  // fetchAll() sorts server-side (-created_at), but a newly logged activity
  // is appended to activitiesStore.items by store.add() rather than
  // re-sorted — sort client-side (same as CrmActivityTimeline) so it's not
  // stuck at the bottom of the list until the next full reload.
  .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()))

// useTablePagination's own watch(getTotal) already resets to page 1 whenever
// a search/filter change alters filteredActivities.length — no separate
// watch on the filters themselves needed.
const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => filteredActivities.value.length)

const rows = computed(() => filteredActivities.value.map(row => ({
  ...row,
  relatedLink: { label: row.relatedLabel, path: row.path },
  createdAtDisplay: dateTimeFormat(row.created_at.toISOString()),
})))

// computed (not a plain const) so column labels stay correct across the
// TH/EN switcher in the header, matching pages/crm/companies/index.vue —
// not pages/admin/activity-log.vue's plain-const columns, which goes stale
// on a locale switch until the page is reloaded.
const columns = computed<TableDataColumn[]>(() => [
  { label: t('crm.activities.index.columns.type'), align: 'left', field: 'typeBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.activities.index.columns.subject'), align: 'left', field: 'subject' },
  { label: t('crm.activities.index.columns.related'), align: 'left', field: 'relatedLink', type: TABLE_CARD_TYPE.LINK },
  { label: t('crm.activities.index.columns.createdBy'), align: 'left', field: 'created_by' },
  { label: t('crm.activities.index.columns.createdAt'), align: 'left', field: 'createdAtDisplay' },
])

// No single record already in context here (unlike the Company/Contact
// detail pages' own Activity section, which use useActivityList instead) —
// AddActivityModal's showRelatedPicker mode supplies related_type/related_id
// itself, so this calls activitiesStore.add() directly rather than going
// through that composable.
const addActivityOpen = ref(false)
const onSubmitActivity = async (payload: { type: ActivityType, subject: string, notes: string, related_type?: ActivityRelatedType, related_id?: number }) => {
  if (!payload.related_type || !payload.related_id) return
  try {
    await activitiesStore.add({
      type: payload.type,
      subject: payload.subject,
      notes: payload.notes,
      related_type: payload.related_type,
      related_id: payload.related_id,
    })
    success(t('crm.activities.index.addActivitySuccess'))
  } catch (err) {
    notifyApiError(err)
  }
}
</script>
