<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.contacts.index.heading') }}</h2>
      <div class="flex gap-2">
        <ButtonPrimary
          :label="t('crm.contacts.index.import')"
          icon="material-symbols:upload-file-outline"
          outline
          @click="showImport = true"
        />
        <ButtonPrimary
          :label="t('crm.contacts.index.addContact')"
          icon="material-symbols:add"
          @click="navigateTo('/crm/contacts/create')"
        />
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div class="flex-1 sm:min-w-48">
          <InputText
            v-model="search"
            :placeholder="t('crm.contacts.index.searchPlaceholder')"
            name="search"
          />
        </div>
        <div class="w-full sm:w-48">
          <InputSelect
            v-model="companyFilter"
            :options="[{ label: t('crm.contacts.index.allCompanies'), value: 'all' }, ...companyOptions]"
            :placeholder="t('crm.contacts.index.companyPlaceholder')"
            name="companyFilter"
          />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect
            v-model="statusFilter"
            :options="COMPANY_STATUS_OPTIONS"
            :placeholder="t('crm.contacts.index.statusPlaceholder')"
            name="statusFilter"
          />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect
            v-model="tagFilter"
            :options="[{ label: t('crm.contacts.index.allTags'), value: 'all' }, ...tagOptions]"
            :placeholder="t('crm.contacts.index.tagPlaceholder')"
            name="tagFilter"
          />
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      :columns="columns"
      :rows="filteredContacts"
      :total="filteredContacts.length"
      :total-page="totalPage"
      :per-page="perPage"
      @change-page="onChangePage"
      @change-per-page="onChangePerPage"
      @sort="onSort"
      @view-detail="onViewDetail"
      @edit="onEdit"
      @delete="requestDelete"
    />

    <CrmConfirmDeleteModal
      v-model:open="open"
      :name="target?.name || ''"
      @confirm="confirmDelete"
    />

    <CrmImportContactsModal
      v-model:open="showImport"
      @imported="onImported"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { COMPANY_STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.contacts.index.pageTitle') })

const { toBadge } = useFormatter()
const { success, error } = useNotify()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()

onMounted(() => {
  contactsStore.fetchAll()
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
})

const search = ref('')
const companyFilter = ref('all')
const statusFilter = ref('all')
const tagFilter = ref('all')
const showImport = ref(false)

const contacts = computed(() => contactsStore.items)

const companyOptions = computed(() => companiesStore.items.map(c => ({ label: c.name, value: String(c.id) })))
const tagOptions = computed(() => [...new Set(contacts.value.flatMap(c => c.tags))].sort().map(tag => ({ label: tag, value: tag })))

const { onSort, sortRows } = useSortableRows()

const filteredContacts = computed(() => {
  const filtered = contacts.value.filter((contact) => {
    const matchSearch = !search.value
      || contact.name.toLowerCase().includes(search.value.toLowerCase())
      || contact.email.toLowerCase().includes(search.value.toLowerCase())
    const matchCompany = companyFilter.value === 'all' || String(contact.company_id) === companyFilter.value
    const matchStatus = statusFilter.value === 'all' || contact.status === statusFilter.value
    const matchTag = tagFilter.value === 'all' || contact.tags.includes(tagFilter.value)
    return matchSearch && matchCompany && matchStatus && matchTag
  }).map(contact => ({
    ...contact,
    companyName: companiesStore.nameById(contact.company_id),
    statusBadge: contact.status === 'active'
      ? toBadge(t('crm.contacts.index.statusActive'), 'success')
      : toBadge(t('crm.contacts.index.statusArchived')),
  }))
  return sortRows(filtered)
})

const columns: TableDataColumn[] = [
  { label: t('crm.contacts.index.columns.name'), align: 'left', field: 'name', isSort: true },
  { label: t('crm.contacts.index.columns.company'), align: 'left', field: 'companyName', isSort: true },
  { label: t('crm.contacts.index.columns.role'), align: 'left', field: 'role_title' },
  { label: t('crm.contacts.index.columns.email'), align: 'left', field: 'email', isSort: true },
  { label: t('crm.contacts.index.columns.phone'), align: 'left', field: 'phone' },
  { label: t('crm.contacts.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('crm.contacts.index.columns.action'),
    align: 'left',
    field: 'action',
    width: 100,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.contacts.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.contacts.index.actions.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('crm.contacts.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => filteredContacts.value.length)
const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Contact>()

const onViewDetail = (row: Contact) => {
  navigateTo(`/crm/contacts/${row.id}`)
}

const onEdit = (row: Contact) => {
  navigateTo(`/crm/contacts/${row.id}`)
}

const confirmDelete = async () => {
  if (target.value) {
    try {
      await contactsStore.remove(target.value.id)
      success(t('crm.contacts.index.deleteSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDelete()
}

const onImported = ({ companies: companyCount, contacts: contactCount }: { companies: number, contacts: number }) => {
  success(t('crm.contacts.index.importSuccess', { companies: companyCount, contacts: contactCount }))
}
</script>
