<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black">{{ t('crm.contacts.index.heading') }}</h2>
      <div class="flex gap-2">
        <ButtonPrimary
          v-if="canExport"
          :label="t('crm.contacts.index.exportCsv')"
          icon="material-symbols:download"
          outline
          @click="onExport"
        />
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
      <div class="flex flex-col gap-3">
        <CrmStatusPill v-model="statusFilter" :options="COMPANY_STATUS_OPTIONS" />
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
              v-model="tagFilter"
              :options="[{ label: t('crm.contacts.index.allTags'), value: 'all' }, ...tagOptions]"
              :placeholder="t('crm.contacts.index.tagPlaceholder')"
              name="tagFilter"
            />
          </div>
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      server-paginated
      :columns="columns"
      :rows="displayContacts"
      :total="total"
      :total-page="totalPage"
      :per-page="perPage"
      :loading="loading"
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

    <LazyCrmImportContactsModal
      v-model:open="showImport"
      @imported="onImported"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { COMPANY_STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.contacts.index.pageTitle') })

const { toBadge, phoneFormat } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const downloadCsvBlob = useDownloadCsvBlob()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()

// Matches the backend's /contacts/export RBAC (Admin/Sales Manager).
const canExport = computed(() => hasRole(...MANAGER_ROLES))

onMounted(() => {
  fetch()
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  // A full (up to 200) fetch is kept purely to derive the tag filter's option
  // list below — there's no "distinct tags" endpoint, so this stays separate
  // from the server-paginated `rows` that the table itself renders.
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
})

const search = ref('')
const companyFilter = ref('all')
const statusFilter = ref('all')
const tagFilter = ref('all')
const showImport = ref(false)

const onExport = () => downloadCsvBlob('/contacts/export', 'contacts.csv')

const companyOptions = computed(() => companiesStore.items.map(c => ({ label: c.name, value: String(c.id) })))
const tagOptions = computed(() => [...new Set(contactsStore.items.flatMap(c => c.tags))].sort().map(tag => ({ label: tag, value: tag })))

// Maps a TableData column field to the `sort` query param GET /contacts
// understands (created_at/name/email, plus the join-backed company_name).
const SORT_FIELD_MAP: Record<string, string> = { companyName: 'company_name' }

const sortField = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')

const onSort = (field: string, direction: 'asc' | 'desc') => {
  sortField.value = field
  sortDir.value = direction
  refetchFromStart()
}

const buildParams = () => ({
  search: search.value || undefined,
  company_id: companyFilter.value !== 'all' ? companyFilter.value : undefined,
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
  tag: tagFilter.value !== 'all' ? tagFilter.value : undefined,
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
} = useServerListPage<Contact>(params => contactsStore.fetchList(params), buildParams)

watch(search, () => refetchDebounced())
watch([companyFilter, statusFilter, tagFilter], () => refetchFromStart())

const displayContacts = computed(() => rows.value.map(contact => ({
  ...contact,
  companyName: companiesStore.nameById(contact.company_id),
  phone: contact.phone ? phoneFormat(contact.phone) : contact.phone,
  statusBadge: contact.status === 'active'
    ? toBadge(t('crm.contacts.index.statusActive'), 'success')
    : toBadge(t('crm.contacts.index.statusArchived')),
})))

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
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.contacts.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.contacts.index.actions.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('crm.contacts.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

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
      await fetch()
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDelete()
}

const onImported = ({ companies: companyCount, contacts: contactCount }: { companies: number, contacts: number }) => {
  success(t('crm.contacts.index.importSuccess', { companies: companyCount, contacts: contactCount }))
  fetch()
}
</script>
