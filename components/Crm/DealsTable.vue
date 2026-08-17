<template>
  <div>
    <div v-if="canBulkManage" class="mb-3 flex justify-end">
      <ButtonPrimary
        outline
        small
        fit-content
        :label="isSelectMode ? t('crm.components.tableSelect.cancelSelect') : t('crm.components.tableSelect.selectRows')"
        @click="toggleSelectMode"
      />
    </div>

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
      @delete="requestDelete"
    />

    <CrmBulkActionBar
      v-if="selectedIds.length > 0"
      :selected-ids="selectedIds"
      :entity-label="t('crm.deals.index.entityLabel')"
      @reassign="onBulkReassign"
      @tag="onBulkTag"
      @archive="onBulkArchive"
      @cancel="selected = []"
    />

    <CrmConfirmDeleteModal
      v-model:open="open"
      :name="target?.title || ''"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

// Filters are owned by the parent (pages/crm/deals/index.vue) so the same
// search/assignee/business-unit/channel inputs drive both this list view and
// the Kanban board's client-side filtering — this table just turns them into
// server query params for its own paginated fetch.
const props = defineProps<{
  search: string
  assigneeFilter: string
  businessUnitFilter: string
  channelFilter: string
}>()

const { t } = useI18n()
const { priceFormat, dateFormat, toBadge } = useFormatter()
const { success, error } = useNotify()
const { hasRole } = useRole()
const dealsStore = useDealsStore()
const companiesStore = useCompaniesStore()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  fetch()
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll()
})

// Bulk reassign/tag/archive endpoints are Admin/Sales Manager only on the backend.
const canBulkManage = computed(() => hasRole('Admin', 'Sales Manager'))

const { isSelectMode, selected, selectedIds, toggleSelectMode } = useBulkSelection<Deal>()

const { stageBadgeColor } = useDealStageColor()

// Maps a TableData column field to the `sort` query param GET /deals
// understands (created_at/title/value, plus the join-backed company_name).
const SORT_FIELD_MAP: Record<string, string> = { createdDate: 'created_at' }

const sortField = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')

const onSort = (field: string, direction: 'asc' | 'desc') => {
  sortField.value = field
  sortDir.value = direction
  refetchFromStart()
}

const buildParams = () => ({
  search: props.search || undefined,
  assigned_to: props.assigneeFilter !== 'all' ? props.assigneeFilter : undefined,
  business_unit: props.businessUnitFilter !== 'all' ? props.businessUnitFilter : undefined,
  channel: props.channelFilter !== 'all' ? props.channelFilter : undefined,
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
} = useServerListPage<Deal>(params => dealsStore.fetchList(params), buildParams)

watch(() => props.search, () => refetchDebounced())
watch([() => props.assigneeFilter, () => props.businessUnitFilter, () => props.channelFilter], () => refetchFromStart())
// Selection is scoped to the currently visible page — a page/filter/sort
// change invalidates whatever was selected before it.
watch([page, () => buildParams()], () => { selected.value = [] })

const displayRows = computed(() => rows.value.map(deal => ({
  ...deal,
  companyName: companiesStore.nameById(deal.company_id),
  valueDisplay: priceFormat(deal.value),
  stageBadge: toBadge(deal.stage, stageBadgeColor(deal.stage)),
  assignedToName: teamMembersStore.nameById(deal.assigned_to),
  createdDate: dateFormat(deal.created_at.toISOString()),
})))

const columns = computed<TableDataColumn[]>(() => [
  ...(isSelectMode.value ? [{ label: '', align: 'left', field: 'select', type: TABLE_CARD_TYPE.SELECTED }] : []),
  { label: t('crm.deals.table.columns.title'), align: 'left', field: 'title', isSort: true },
  { label: t('crm.deals.table.columns.company'), align: 'left', field: 'companyName', isSort: true },
  { label: t('crm.deals.table.columns.value'), align: 'left', field: 'valueDisplay' },
  { label: t('crm.deals.table.columns.stage'), align: 'left', field: 'stageBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.deals.table.columns.assignedTo'), align: 'left', field: 'assignedToName' },
  { label: t('crm.deals.table.columns.created'), align: 'left', field: 'createdDate', isSort: true },
  {
    label: t('crm.deals.table.columns.action'),
    align: 'left',
    field: 'action',
    width: 120,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.deals.table.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.deals.table.actions.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('crm.deals.table.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
])

const onViewDetail = (row: Deal) => {
  navigateTo(`/crm/deals/${row.id}`)
}

const onEdit = (row: Deal) => {
  navigateTo(`/crm/deals/${row.id}`)
}

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Deal>()

const confirmDelete = async () => {
  if (target.value) {
    try {
      await dealsStore.remove(target.value.id)
      success(t('crm.deals.table.deleteSuccess'))
      await fetch()
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDelete()
}

const onBulkReassign = async (assignedTo: number | null) => {
  try {
    await dealsStore.bulkReassign(selectedIds.value, assignedTo)
    success(t('crm.components.bulkActionBar.reassignSuccess', { count: selectedIds.value.length, entity: t('crm.deals.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onBulkTag = async ({ tags, mode }: { tags: string[], mode: 'add' | 'set' }) => {
  try {
    await dealsStore.bulkTag(selectedIds.value, tags, mode)
    success(t('crm.components.bulkActionBar.tagSuccess', { count: selectedIds.value.length, entity: t('crm.deals.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onBulkArchive = async () => {
  try {
    await dealsStore.bulkArchive(selectedIds.value)
    success(t('crm.components.bulkActionBar.archiveSuccess', { count: selectedIds.value.length, entity: t('crm.deals.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
