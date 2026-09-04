<template>
  <div class="p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xl font-black">{{ t('crm.contacts.index.heading') }}</h2>
      <div class="flex flex-wrap gap-2">
        <ButtonPrimary
          outline
          :label="isSelectMode ? t('crm.components.tableSelect.cancelSelect') : t('crm.components.tableSelect.selectRows')"
          :disabled="!isSelectMode && displayContacts.length === 0"
          data-cy="contacts-select-mode-toggle"
          @click="toggleSelectMode"
        />
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
            <USelectMenu
              v-model="companyFilter"
              v-model:search-term="companySearchTerm"
              :items="[{ label: t('crm.contacts.index.allCompanies'), value: 'all' }, ...companyOptions]"
              ignore-filter
              value-key="value"
              label-key="label"
              :loading="companySearching"
              :placeholder="t('crm.contacts.index.companyPlaceholder')"
              class="w-full"
            />
          </div>
          <div class="w-full sm:w-48">
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
      v-model:select-value="selected"
      server-paginated
      :columns="columns"
      :rows="displayContacts"
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
      @add-to-campaign="(row: Contact) => openCampaignModal([row])"
      @delete="requestDelete"
    />

    <CrmCampaignBulkActionBar
      v-if="selectedIds.length > 0"
      :selected-ids="selectedIds"
      :entity-label="t('crm.contacts.index.entityLabel')"
      @create-campaign="openCampaignModal(selected)"
      @cancel="clearSelection"
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

    <CrmCreateCampaignModal
      v-model:open="createCampaignOpen"
      :targets="campaignTargets"
      :type-options="['new_channel']"
      @submit="onSubmitCampaign"
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
const campaignsStore = useCampaignsStore()

// Matches the backend's /contacts/export RBAC (Admin/Sales Manager).
const canExport = computed(() => hasRole(...MANAGER_ROLES))

onMounted(() => {
  fetch()
  // A full (up to 200) fetch is kept purely to derive the tag filter's option
  // list below — there's no "distinct tags" endpoint, so this stays separate
  // from the server-paginated `rows` that the table itself renders.
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
  runCompanySearch('')
})

const search = ref('')
const companyFilter = ref('all')
const statusFilter = ref('all')
const tagFilter = ref('all')
const showImport = ref(false)

const onExport = () => downloadCsvBlob('/contacts/export', 'contacts.csv')

// The Company filter searches the server as the rep types instead of
// filtering a capped preloaded list (companiesStore.fetchAll() is capped at
// 200 rows, newest-first, and can miss an older Company entirely — see
// stores/companies.ts's fetchAll doc for the full explanation) — same
// pattern as components/Input/CompanySelect.vue, just inlined here since
// this is a filter (with an "All Companies" sentinel option) rather than a
// plain Company picker.
const {
  term: companySearchTerm,
  loading: companySearching,
  results: companySearchResults,
  run: runCompanySearch,
} = useDebouncedSearch(async (term: string) => {
  const { items } = await companiesStore.fetchList({ search: term || undefined, per_page: 20, sort: 'name' })
  return items
})
const companyOptions = computed<Select[]>(() => companySearchResults.value.map(c => ({ label: c.name, value: String(c.id) })))

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
// Selection is scoped to the currently visible page — a page/filter/sort
// change invalidates whatever was selected before it (same as
// Companies'/Leads' own list pages).
watch([page, () => buildParams()], () => { selected.value = [] })

// Companies aren't broadly preloaded anymore (see the filter's own comment
// above), so the Company column needs each visible page's Contacts' own
// companies fetched on demand — otherwise nameById would show "-" for any
// Company outside whatever the filter search happened to load.
watch(rows, (visibleContacts) => {
  for (const contact of visibleContacts) {
    if (!companiesStore.items.some(c => c.id === contact.company_id)) {
      companiesStore.fetchOne(contact.company_id).catch(notifyApiError)
    }
  }
})

const displayContacts = computed(() => rows.value.map(contact => ({
  ...contact,
  companyName: companiesStore.nameById(contact.company_id),
  phone: contact.phone ? phoneFormat(contact.phone) : contact.phone,
  statusBadge: contact.status === 'active'
    ? toBadge(t('crm.contacts.index.statusActive'), 'success')
    : toBadge(t('crm.contacts.index.statusArchived')),
})))

const { isSelectMode, selected, selectedIds, toggleSelectMode, clearSelection } = useBulkSelection<Contact>()

const columns = computed<TableDataColumn[]>(() => [
  ...(isSelectMode.value ? [{ label: '', align: 'left' as const, field: 'select', type: TABLE_CARD_TYPE.SELECTED }] : []),
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
      { label: t('crm.contacts.index.actions.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('crm.contacts.index.actions.addToCampaign'), emitName: 'addToCampaign', isBorderBottom: true },
      { label: t('crm.contacts.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
])

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

const createCampaignOpen = ref(false)
const campaignTargets = ref<CampaignTarget[]>([])

const openCampaignModal = (contacts: Contact[]) => {
  campaignTargets.value = contacts.map(contact => ({ type: 'contact', id: contact.id, name: contact.name }))
  createCampaignOpen.value = true
}

const onSubmitCampaign = async (payload: CampaignTaskSetupSubmitPayload) => {
  try {
    const campaign = await campaignsStore.submitCampaignTasks(campaignTargets.value, payload)
    success(t(payload.mode === 'existing' ? 'crm.contacts.index.campaignAddSuccess' : 'crm.contacts.index.campaignCreateSuccess', { name: campaign.name, count: campaignTargets.value.length }))
    clearSelection()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
