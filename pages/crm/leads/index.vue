<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black">{{ t('crm.leads.index.heading') }}</h2>
      <div class="flex items-center gap-2">
        <ButtonPrimary
          v-if="canBulkManage"
          outline
          :label="isSelectMode ? t('crm.components.tableSelect.cancelSelect') : t('crm.components.tableSelect.selectRows')"
          :disabled="!isSelectMode && displayRows.length === 0"
          @click="toggleSelectMode"
        />
        <ButtonPrimary
          :label="t('crm.leads.index.addLead')"
          icon="material-symbols:add"
          @click="navigateTo('/crm/leads/create')"
        />
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3">
        <CrmStatusPill v-model="statusFilter" :options="LEAD_STATUS_OPTIONS" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText v-model="search" :placeholder="t('crm.leads.index.searchPlaceholder')" name="search" />
          </div>
          <div class="w-full sm:w-40">
            <InputSelect v-model="sourceFilter" :options="[{ label: t('crm.leads.index.allSources'), value: 'all' }, ...leadSourcesStore.activeOptions]" :placeholder="t('crm.leads.index.sourcePlaceholder')" name="sourceFilter" />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect v-model="assigneeFilter" :options="teamMembersStore.filterOptions" :placeholder="t('crm.leads.index.assigneePlaceholder')" name="assigneeFilter" />
          </div>
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      v-model:select-value="selected"
      server-paginated
      :columns="columns"
      :rows="displayRows"
      :total="total"
      :total-page="totalPage"
      :per-page="perPage"
      :loading="loading"
      :is-show-select="isSelectMode"
      @change-page="onChangePage"
      @change-per-page="onChangePerPage"
      @sort="onSort"
      @view-detail="onViewDetail"
      @edit="onEdit"
      @convert="onConvert"
      @view-deal="onViewDeal"
      @delete="requestDelete"
    />

    <CrmBulkActionBar
      v-if="selectedIds.length > 0"
      :selected-ids="selectedIds"
      :entity-label="t('crm.leads.index.entityLabel')"
      @reassign="onBulkReassign"
      @tag="onBulkTag"
      @archive="onBulkArchive"
      @cancel="selected = []"
    />

    <CrmConfirmDeleteModal
      v-model:open="open"
      :name="target?.name || ''"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { LEAD_STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.leads.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const leadsStore = useLeadsStore()
const teamMembersStore = useTeamMembersStore()
const leadSourcesStore = useLeadSourcesStore()
const companiesStore = useCompaniesStore()

// Bulk reassign/tag/archive endpoints are Admin/Sales Manager only on the backend.
const canBulkManage = computed(() => hasRole(...MANAGER_ROLES))

const search = ref('')
const statusFilter = ref('all')
const sourceFilter = ref('all')
const assigneeFilter = ref('all')

// Maps a TableData column field to the `sort` query param the backend
// understands (see GET /leads: created_at/name plain columns, company_name
// a join-based special case since Lead.company_id replaced the free-text
// column it used to be — same join pattern as Deal/Contact's own
// company_name sort).
const SORT_FIELD_MAP: Record<string, string> = { createdDate: 'created_at', companyName: 'company_name' }

const sortField = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')

const onSort = (field: string, direction: 'asc' | 'desc') => {
  sortField.value = field
  sortDir.value = direction
  refetchFromStart()
}

const buildParams = () => ({
  search: search.value || undefined,
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
  source: sourceFilter.value !== 'all' ? sourceFilter.value : undefined,
  assigned_to: assigneeFilter.value !== 'all' ? assigneeFilter.value : undefined,
  sort: sortField.value ? `${sortDir.value === 'desc' ? '-' : ''}${SORT_FIELD_MAP[sortField.value] || sortField.value}` : undefined,
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
} = useServerListPage<Lead>(params => leadsStore.fetchList(params), buildParams)

onMounted(() => {
  fetch()
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll().catch(notifyApiError)
  // Resolves each row's company_id to a display name below (companyName).
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
})

watch(search, () => refetchDebounced())
watch([statusFilter, sourceFilter, assigneeFilter], () => refetchFromStart())
// Selection is scoped to the currently visible page — a page/filter/sort
// change invalidates whatever was selected before it.
watch([page, () => buildParams()], () => { selected.value = [] })

const displayRows = computed(() => rows.value.map(lead => ({
  ...lead,
  statusBadge: toBadge(lead.status, leadStatusColor(lead.status)),
  classificationBadge: classificationBadge(lead.classification),
  createdDate: dateFormat(lead.created_at.toISOString()),
  assignedToName: teamMembersStore.nameById(lead.assigned_to),
  companyName: companiesStore.nameById(lead.company_id),
})))

// Lead Scoring (FR-CRM-006/007) — renders as "-" for 'none', matching
// TableData's Card/Status.vue isNoData convention for other empty cells.
// Badges built once here rather than per-row inside classificationBadge()
// below, since there are only ever two distinct translated strings on this
// whole page regardless of how many Lead rows are displayed.
const mqlBadge = computed(() => toBadge(t('crm.leads.index.mqlBadge'), 'info'))
const sqlBadge = computed(() => toBadge(t('crm.leads.index.sqlBadge'), 'success'))
const classificationBadge = (classification: LeadClassification) => {
  if (classification === 'mql') return mqlBadge.value
  if (classification === 'sql') return sqlBadge.value
  return { title: '', color: 'neutral', isNoData: true }
}

const leadStatusColor = (status: LeadStatus) => {
  if (status === 'Qualified') return 'success'
  if (status === 'Disqualified') return 'error'
  if (status === 'Contacted') return 'info'
  return 'neutral'
}

const { isSelectMode, selected, selectedIds, toggleSelectMode } = useBulkSelection<Lead>()

const columns = computed<TableDataColumn[]>(() => [
  ...(isSelectMode.value ? [{ label: '', align: 'left', field: 'select', type: TABLE_CARD_TYPE.SELECTED }] : []),
  { label: t('crm.leads.index.columns.name'), align: 'left', field: 'name', isSort: true },
  { label: t('crm.leads.index.columns.company'), align: 'left', field: 'companyName', isSort: true },
  { label: t('crm.leads.index.columns.source'), align: 'left', field: 'source' },
  { label: t('crm.leads.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.leads.index.columns.classification'), align: 'left', field: 'classificationBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.leads.index.columns.assignedTo'), align: 'left', field: 'assignedToName' },
  { label: t('crm.leads.index.columns.created'), align: 'left', field: 'createdDate', isSort: true },
  {
    label: t('crm.leads.index.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.leads.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.leads.index.actions.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('crm.leads.index.actions.convert'), emitName: 'convert', isBorderBottom: true, hideIf: row => !!row.converted_deal_id },
      { label: t('crm.leads.index.actions.viewDeal'), emitName: 'viewDeal', isBorderBottom: true, hideIf: row => !row.converted_deal_id },
      { label: t('crm.leads.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
])

const onViewDetail = (row: Lead) => {
  navigateTo(`/crm/leads/${row.id}`)
}

const onEdit = (row: Lead) => {
  navigateTo(`/crm/leads/${row.id}`)
}

const onConvert = (row: Lead) => {
  navigateTo(`/crm/deals/create?lead_id=${row.id}`)
}

const onViewDeal = (row: Lead) => {
  navigateTo(`/crm/deals/${row.converted_deal_id}`)
}

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Lead>()

const confirmDelete = async () => {
  if (target.value) {
    try {
      await leadsStore.remove(target.value.id)
      success(t('crm.leads.index.deleteSuccess'))
      await fetch()
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDelete()
}

const onBulkReassign = async (assignedTo: number | null) => {
  try {
    await leadsStore.bulkReassign(selectedIds.value, assignedTo)
    success(t('crm.components.bulkActionBar.reassignSuccess', { count: selectedIds.value.length, entity: t('crm.leads.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onBulkTag = async ({ tags, mode }: { tags: string[], mode: 'add' | 'set' }) => {
  try {
    await leadsStore.bulkTag(selectedIds.value, tags, mode)
    success(t('crm.components.bulkActionBar.tagSuccess', { count: selectedIds.value.length, entity: t('crm.leads.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onBulkArchive = async () => {
  try {
    await leadsStore.bulkArchive(selectedIds.value)
    success(t('crm.components.bulkActionBar.archiveSuccess', { count: selectedIds.value.length, entity: t('crm.leads.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
