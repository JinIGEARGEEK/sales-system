<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black">{{ t('crm.prospects.index.heading') }}</h2>
      <div class="flex items-center gap-3">
        <!-- View switcher — mirrors pages/crm/deals/index.vue's Kanban/List toggle. -->
        <div class="flex items-center gap-0.5 rounded-full bg-[var(--color-light-gray-1)] p-1">
          <UTooltip :text="t('crm.prospects.index.viewKanban')">
            <button
              type="button"
              class="flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors"
              :class="viewMode === 'kanban' ? 'bg-[var(--color-primary)] shadow-sm' : 'text-[var(--color-gray)] hover:text-[var(--color-black)]'"
              :aria-label="t('crm.prospects.index.viewKanban')"
              @click="viewMode = 'kanban'"
            >
              <UIcon name="material-symbols:view-kanban-outline" class="size-4" />
            </button>
          </UTooltip>
          <UTooltip :text="t('crm.prospects.index.viewList')">
            <button
              type="button"
              class="flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors"
              :class="viewMode === 'list' ? 'bg-[var(--color-primary)] shadow-sm' : 'text-[var(--color-gray)] hover:text-[var(--color-black)]'"
              :aria-label="t('crm.prospects.index.viewList')"
              @click="viewMode = 'list'"
            >
              <UIcon name="material-symbols:view-list" class="size-4" />
            </button>
          </UTooltip>
        </div>

        <div class="flex items-center gap-2 border-l border-[var(--color-light-gray-2)] pl-3">
          <ButtonPrimary
            v-if="canBulkManage && viewMode === 'list'"
            outline
            :label="isSelectMode ? t('crm.components.tableSelect.cancelSelect') : t('crm.components.tableSelect.selectRows')"
            :disabled="!isSelectMode && rows.length === 0"
            @click="toggleSelectMode"
          />
          <ButtonPrimary
            :label="t('crm.prospects.index.addProspect')"
            icon="material-symbols:add"
            @click="navigateTo('/crm/prospects/create')"
          />
        </div>
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3">
        <CrmStatusPill v-if="viewMode === 'list'" v-model="statusFilter" :options="PROSPECT_STATUS_OPTIONS" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText v-model="search" :placeholder="t('crm.prospects.index.searchPlaceholder')" name="search" />
          </div>
          <div class="w-full sm:w-40">
            <InputSelect v-model="sourceFilter" :options="[{ label: t('crm.prospects.index.allSources'), value: 'all' }, ...leadSourcesStore.activeOptions]" :placeholder="t('crm.prospects.index.sourcePlaceholder')" name="sourceFilter" />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect v-model="assigneeFilter" :options="teamMembersStore.filterOptions" :placeholder="t('crm.prospects.index.assigneePlaceholder')" name="assigneeFilter" />
          </div>
        </div>
      </div>
    </UCard>

    <UAlert
      v-if="viewMode === 'kanban'"
      class="mb-4"
      color="neutral"
      variant="subtle"
      icon="material-symbols:info-outline"
      :description="t('crm.prospects.index.convertInfoBody')"
    />

    <CrmPipelineBoard
      v-if="viewMode === 'kanban'"
      :columns="PROSPECT_STATUS_FORM_OPTIONS"
      :items="pipelineItems"
      @move="onMove"
      @select="onSelect"
    >
      <template #card="{ item }">
        <div>
          <p class="line-clamp-2 text-sm font-medium">{{ item.name }}</p>
          <p class="mt-1 truncate text-xs text-[var(--color-gray)]">{{ companiesStore.nameById(item.company_id) }}</p>
        </div>
        <div class="mt-2 flex items-center gap-1.5 border-t border-[var(--color-light-gray-2)] pt-2">
          <UIcon name="material-symbols:person" class="size-3.5 shrink-0 text-[var(--color-gray)]" />
          <p class="truncate text-xs text-[var(--color-gray)]">{{ teamMembersStore.nameById(item.assigned_to) }}</p>
        </div>
      </template>
    </CrmPipelineBoard>

    <template v-else>
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
        @view-lead="onViewLead"
        @delete="requestDelete"
      />

      <CrmBulkActionBar
        v-if="selectedIds.length > 0"
        :selected-ids="selectedIds"
        :entity-label="t('crm.prospects.index.entityLabel')"
        @reassign="onBulkReassign"
        @tag="onBulkTag"
        @archive="onBulkArchive"
        @cancel="selected = []"
      />
    </template>

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
import { PROSPECT_STATUS_OPTIONS, PROSPECT_STATUS_FORM_OPTIONS, prospectStatusColor, matchesAssigneeFilter } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.prospects.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const prospectsStore = useProspectsStore()
const leadsStore = useLeadsStore()
const teamMembersStore = useTeamMembersStore()
const leadSourcesStore = useLeadSourcesStore()
const companiesStore = useCompaniesStore()

// Bulk reassign/tag/archive endpoints are Admin/Sales Manager only on the
// backend, same as Leads' — Marketing itself has no bulk access.
const canBulkManage = computed(() => hasRole(...MANAGER_ROLES))

const viewMode = ref<'kanban' | 'list'>('kanban')

const search = ref('')
const statusFilter = ref('all')
const sourceFilter = ref('all')
const assigneeFilter = ref('all')

// ── Kanban ─────────────────────────────────────────────────────────────
// Prospect volume doesn't warrant Deals' per-stage server-paginated bucket
// machinery — a single fetchAll (capped 200, newest-first, same as Lead
// cards on the Deals board) is enough; Prospect.status IS the column value
// directly, no lane-mapping needed (unlike Lead's leadLane() on that board).

onMounted(() => {
  prospectsStore.fetchAll({ exclude_converted: true }).catch(notifyApiError)
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll().catch(notifyApiError)
})

const filteredProspects = computed(() => prospectsStore.items.filter((prospect) => {
  const matchSearch = !search.value
    || prospect.name.toLowerCase().includes(search.value.toLowerCase())
    || companiesStore.nameById(prospect.company_id).toLowerCase().includes(search.value.toLowerCase())
  const matchSource = sourceFilter.value === 'all' || prospect.source === sourceFilter.value
  const matchAssignee = matchesAssigneeFilter(prospect.assigned_to, assigneeFilter.value)
  return matchSearch && matchSource && matchAssignee
}))

const pipelineItems = computed(() => filteredProspects.value.map(prospect => ({ ...prospect, _type: 'prospect' as const, _lane: prospect.status })))

// companiesStore.fetchAll() above is a capped, point-in-time snapshot — it
// can miss a Prospect's Company outright, same class of gap fixed on every
// other list/board page. Prospect.company_id is nullable, so skip items with
// none rather than fetchOne(null).
watch(pipelineItems, (items) => {
  for (const item of items) {
    if (item.company_id && !companiesStore.items.some(c => c.id === item.company_id)) {
      companiesStore.fetchOne(item.company_id).catch(notifyApiError)
    }
  }
})

const onMove = async (item: Prospect & { _type: 'prospect' }, newStatus: string) => {
  if (item.status === newStatus) return
  try {
    await prospectsStore.update(item.id, { status: newStatus as ProspectStatus })
    success(t('crm.prospects.index.prospectStatusUpdated', { status: newStatus }))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onSelect = (item: Prospect & { _type: 'prospect' }) => {
  navigateTo(`/crm/prospects/${item.id}`)
}

// ── List ───────────────────────────────────────────────────────────────

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
} = useServerListPage<Prospect>(params => prospectsStore.fetchList(params), buildParams)

watch(viewMode, (mode) => {
  if (mode === 'list' && rows.value.length === 0) fetch()
})

watch(rows, (visibleProspects) => {
  for (const prospect of visibleProspects) {
    if (prospect.company_id && !companiesStore.items.some(c => c.id === prospect.company_id)) {
      companiesStore.fetchOne(prospect.company_id).catch(notifyApiError)
    }
  }
})

watch(search, () => { if (viewMode.value === 'list') refetchDebounced() })
watch([statusFilter, sourceFilter, assigneeFilter], () => { if (viewMode.value === 'list') refetchFromStart() })
watch([page, () => buildParams()], () => { selected.value = [] })

const displayRows = computed(() => rows.value.map(prospect => ({
  ...prospect,
  statusBadge: toBadge(prospect.status, prospectStatusColor(prospect.status)),
  createdDate: dateFormat(prospect.created_at.toISOString()),
  assignedToName: teamMembersStore.nameById(prospect.assigned_to),
  companyName: companiesStore.nameById(prospect.company_id),
})))

const { isSelectMode, selected, selectedIds, toggleSelectMode } = useBulkSelection<Prospect>()

const columns = computed<TableDataColumn[]>(() => [
  ...(isSelectMode.value ? [{ label: '', align: 'left', field: 'select', type: TABLE_CARD_TYPE.SELECTED }] : []),
  { label: t('crm.prospects.index.columns.name'), align: 'left', field: 'name', isSort: true },
  { label: t('crm.prospects.index.columns.company'), align: 'left', field: 'companyName', isSort: true },
  { label: t('crm.prospects.index.columns.source'), align: 'left', field: 'source' },
  { label: t('crm.prospects.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.prospects.index.columns.assignedTo'), align: 'left', field: 'assignedToName' },
  { label: t('crm.prospects.index.columns.created'), align: 'left', field: 'createdDate', isSort: true },
  {
    label: t('crm.prospects.index.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.prospects.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.prospects.index.actions.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('crm.prospects.index.actions.convert'), emitName: 'convert', isBorderBottom: true, hideIf: row => !!row.converted_lead_id || row.status === 'Disqualified' },
      { label: t('crm.prospects.index.actions.viewLead'), emitName: 'viewLead', isBorderBottom: true, hideIf: row => !row.converted_lead_id },
      { label: t('crm.prospects.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
])

const onViewDetail = (row: Prospect) => {
  navigateTo(`/crm/prospects/${row.id}`)
}

const onEdit = (row: Prospect) => {
  navigateTo(`/crm/prospects/${row.id}`)
}

const onConvert = async (row: Prospect) => {
  try {
    const { lead } = await prospectsStore.convert(row.id, {})
    row.converted_lead_id = lead.id
    leadsStore.receiveConverted(lead)
    success(t('crm.prospects.index.prospectConvertedToLead'))
    navigateTo(`/crm/leads/${lead.id}`)
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onViewLead = (row: Prospect) => {
  navigateTo(`/crm/leads/${row.converted_lead_id}`)
}

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Prospect>()

const confirmDelete = async () => {
  if (target.value) {
    try {
      await prospectsStore.remove(target.value.id)
      success(t('crm.prospects.index.deleteSuccess'))
      await fetch()
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDelete()
}

const onBulkReassign = async (assignedTo: number | null) => {
  try {
    await prospectsStore.bulkReassign(selectedIds.value, assignedTo)
    success(t('crm.components.bulkActionBar.reassignSuccess', { count: selectedIds.value.length, entity: t('crm.prospects.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onBulkTag = async ({ tags, mode }: { tags: string[], mode: 'add' | 'set' }) => {
  try {
    await prospectsStore.bulkTag(selectedIds.value, tags, mode)
    success(t('crm.components.bulkActionBar.tagSuccess', { count: selectedIds.value.length, entity: t('crm.prospects.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onBulkArchive = async () => {
  try {
    await prospectsStore.bulkArchive(selectedIds.value)
    success(t('crm.components.bulkActionBar.archiveSuccess', { count: selectedIds.value.length, entity: t('crm.prospects.index.entityLabel') }))
    selected.value = []
    await fetch()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
