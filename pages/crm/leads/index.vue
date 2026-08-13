<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.leads.index.heading') }}</h2>
      <ButtonPrimary
        :label="t('crm.leads.index.addLead')"
        icon="material-symbols:add"
        @click="navigateTo('/crm/leads/create')"
      />
    </div>

    <UCard class="mb-4">
      <div class="flex flex-col gap-3">
        <CrmStatusPill v-model="statusFilter" :options="LEAD_STATUS_OPTIONS" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText v-model="search" :placeholder="t('crm.leads.index.searchPlaceholder')" name="search" />
          </div>
          <div class="w-full sm:w-40">
            <InputSelect v-model="sourceFilter" :options="[{ label: t('crm.leads.index.allSources'), value: 'all' }, ...LEAD_SOURCE_OPTIONS]" :placeholder="t('crm.leads.index.sourcePlaceholder')" name="sourceFilter" />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect v-model="assigneeFilter" :options="TEAM_MEMBER_FILTER_OPTIONS" :placeholder="t('crm.leads.index.assigneePlaceholder')" name="assigneeFilter" />
          </div>
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      :columns="columns"
      :rows="filteredLeads"
      :total="filteredLeads.length"
      :total-page="totalPage"
      :per-page="perPage"
      @change-page="onChangePage"
      @change-per-page="onChangePerPage"
      @view-detail="onViewDetail"
      @edit="onEdit"
      @convert="onConvert"
      @delete="requestDelete"
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
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { MOCK_LEADS, LEAD_STATUS_OPTIONS, LEAD_SOURCE_OPTIONS, TEAM_MEMBER_FILTER_OPTIONS, teamMemberNameById, matchesAssigneeFilter } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.leads.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { success } = useNotify()

const search = ref('')
const statusFilter = ref('all')
const sourceFilter = ref('all')
const assigneeFilter = ref('all')

const leads = ref<Lead[]>([...MOCK_LEADS])

const filteredLeads = computed(() => {
  return leads.value.filter((lead) => {
    const matchSearch = !search.value
      || lead.name.toLowerCase().includes(search.value.toLowerCase())
      || lead.company_name.toLowerCase().includes(search.value.toLowerCase())
      || lead.email.toLowerCase().includes(search.value.toLowerCase())
    const matchStatus = statusFilter.value === 'all' || lead.status === statusFilter.value
    const matchSource = sourceFilter.value === 'all' || lead.source === sourceFilter.value
    const matchAssignee = matchesAssigneeFilter(lead.assigned_to, assigneeFilter.value)
    return matchSearch && matchStatus && matchSource && matchAssignee
  }).map(lead => ({
    ...lead,
    statusBadge: toBadge(lead.status, leadStatusColor(lead.status)),
    createdDate: dateFormat(lead.created_at.toISOString()),
    assignedToName: teamMemberNameById(lead.assigned_to),
  }))
})

const leadStatusColor = (status: LeadStatus) => {
  if (status === 'Qualified') return 'success'
  if (status === 'Disqualified') return 'error'
  if (status === 'Contacted') return 'info'
  return 'neutral'
}

const columns: TableDataColumn[] = [
  { label: t('crm.leads.index.columns.name'), align: 'left', field: 'name' },
  { label: t('crm.leads.index.columns.company'), align: 'left', field: 'company_name' },
  { label: t('crm.leads.index.columns.source'), align: 'left', field: 'source' },
  { label: t('crm.leads.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.leads.index.columns.assignedTo'), align: 'left', field: 'assignedToName' },
  { label: t('crm.leads.index.columns.created'), align: 'left', field: 'createdDate' },
  {
    label: t('crm.leads.index.columns.action'),
    align: 'left',
    field: 'action',
    width: 120,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.leads.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.leads.index.actions.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('crm.leads.index.actions.convert'), emitName: 'convert', isBorderBottom: false },
      { label: t('crm.leads.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

const onViewDetail = (row: Lead) => {
  navigateTo(`/crm/leads/${row.id}`)
}

const onEdit = (row: Lead) => {
  navigateTo(`/crm/leads/${row.id}`)
}

const onConvert = (row: Lead) => {
  navigateTo(`/crm/deals/create?lead_id=${row.id}`)
}

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => filteredLeads.value.length)
const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Lead>()

const confirmDelete = () => {
  if (target.value) {
    leads.value = leads.value.filter(l => l.id !== target.value!.id)
    success(t('crm.leads.index.deleteSuccess'))
  }
  closeDelete()
}
</script>
