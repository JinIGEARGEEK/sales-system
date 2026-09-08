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

guardMounted(() => {
  loading.value = true
  activitiesStore.fetchAll().catch(notifyApiError).finally(() => { loading.value = false })
  // Preloaded so resolveRelated below can show a name instead of "-" for
  // most rows on first render, same reasoning as pages/crm/tasks/index.vue.
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  if (prospectsStore.items.length === 0) prospectsStore.fetchAll().catch(notifyApiError)
  if (leadsStore.items.length === 0) leadsStore.fetchAll().catch(notifyApiError)
})

const search = ref('')
const typeFilter = ref('all')
const relatedTypeFilter = ref('all')

const typeFilterOptions = computed<Select[]>(() => [
  { label: t('crm.activities.index.allTypes'), value: 'all' },
  { label: t('crm.activities.index.typeCall'), value: 'call' },
  { label: t('crm.activities.index.typeEmail'), value: 'email' },
  { label: t('crm.activities.index.typeMeeting'), value: 'meeting' },
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

// Single source of truth for how each ActivityType renders as a badge —
// was two parallel switch statements (label, color) before this merge.
const typeBadge = (type: ActivityType) => {
  switch (type) {
    case 'call':
      return toBadge(t('crm.activities.index.typeCall'), 'info')
    case 'email':
      return toBadge(t('crm.activities.index.typeEmail'), 'warning')
    case 'meeting':
      return toBadge(t('crm.activities.index.typeMeeting'), 'success')
  }
}

const filteredActivities = computed(() => activitiesStore.items
  .map(activity => ({ ...activity, ...resolveRelated(activity.related_type, activity.related_id) }))
  .filter((activity) => {
    const matchesSearch = !search.value
      || activity.subject.toLowerCase().includes(search.value.toLowerCase())
      || activity.relatedLabel.toLowerCase().includes(search.value.toLowerCase())
    const matchesType = typeFilter.value === 'all' || activity.type === typeFilter.value
    const matchesRelatedType = relatedTypeFilter.value === 'all' || activity.related_type === relatedTypeFilter.value
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

const rows = computed(() => filteredActivities.value.map(activity => ({
  ...activity,
  typeBadge: typeBadge(activity.type),
  relatedLink: { label: activity.relatedLabel, path: activity.path },
  createdAtDisplay: dateTimeFormat(activity.created_at.toISOString()),
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
