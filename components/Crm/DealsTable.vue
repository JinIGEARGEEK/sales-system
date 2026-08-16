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
      :columns="columns"
      :rows="displayRows"
      :total="displayRows.length"
      :total-page="totalPage"
      :per-page="perPage"
      :is-show-select="isSelectMode"
      @change-page="onChangePage"
      @change-per-page="onChangePerPage"
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

const props = defineProps<{
  rows: Deal[]
}>()

const { t } = useI18n()
const { priceFormat, dateFormat, toBadge } = useFormatter()
const { success, error } = useNotify()
const { hasRole } = useRole()
const dealsStore = useDealsStore()
const companiesStore = useCompaniesStore()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll()
})

// Bulk reassign/tag/archive endpoints are Admin/Sales Manager only on the backend.
const canBulkManage = computed(() => hasRole('Admin', 'Sales Manager'))

const { isSelectMode, selected, selectedIds, toggleSelectMode } = useBulkSelection<Deal>()

const stageBadgeColor = (stage: DealStage) => {
  if (stage === 'Won') return 'success'
  if (stage === 'Lost') return 'error'
  return 'neutral'
}

const displayRows = computed(() => props.rows.map(deal => ({
  ...deal,
  companyName: companiesStore.nameById(deal.company_id),
  valueDisplay: priceFormat(deal.value),
  stageBadge: toBadge(deal.stage, stageBadgeColor(deal.stage)),
  assignedToName: teamMembersStore.nameById(deal.assigned_to),
  createdDate: dateFormat(deal.created_at.toISOString()),
})))

const columns = computed<TableDataColumn[]>(() => [
  ...(isSelectMode.value ? [{ label: '', align: 'left', field: 'select', type: TABLE_CARD_TYPE.SELECTED }] : []),
  { label: t('crm.deals.table.columns.title'), align: 'left', field: 'title' },
  { label: t('crm.deals.table.columns.company'), align: 'left', field: 'companyName' },
  { label: t('crm.deals.table.columns.value'), align: 'left', field: 'valueDisplay' },
  { label: t('crm.deals.table.columns.stage'), align: 'left', field: 'stageBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.deals.table.columns.assignedTo'), align: 'left', field: 'assignedToName' },
  { label: t('crm.deals.table.columns.created'), align: 'left', field: 'createdDate' },
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

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => displayRows.value.length)
const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Deal>()

const confirmDelete = async () => {
  if (target.value) {
    try {
      await dealsStore.remove(target.value.id)
      success(t('crm.deals.table.deleteSuccess'))
    } catch {
      error(t('global.genericError'))
    }
  }
  closeDelete()
}

const onBulkReassign = async (assignedTo: number | null) => {
  try {
    await dealsStore.bulkReassign(selectedIds.value, assignedTo)
    success(t('crm.components.bulkActionBar.reassignSuccess', { count: selectedIds.value.length, entity: t('crm.deals.index.entityLabel') }))
    selected.value = []
  } catch {
    error(t('global.genericError'))
  }
}

const onBulkTag = async ({ tags, mode }: { tags: string[], mode: 'add' | 'set' }) => {
  try {
    await dealsStore.bulkTag(selectedIds.value, tags, mode)
    success(t('crm.components.bulkActionBar.tagSuccess', { count: selectedIds.value.length, entity: t('crm.deals.index.entityLabel') }))
    selected.value = []
  } catch {
    error(t('global.genericError'))
  }
}

const onBulkArchive = async () => {
  try {
    await dealsStore.bulkArchive(selectedIds.value)
    success(t('crm.components.bulkActionBar.archiveSuccess', { count: selectedIds.value.length, entity: t('crm.deals.index.entityLabel') }))
    selected.value = []
  } catch {
    error(t('global.genericError'))
  }
}
</script>
