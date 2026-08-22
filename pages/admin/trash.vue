<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4">
        <h2 class="text-xl font-black">{{ t('admin.trash.title') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('admin.trash.subtitle') }}</p>
      </div>

      <UTabs v-model="activeTab" :items="tabItems" class="mb-4" />

      <div v-if="activeTab === 'deals'">
        <TableData
          v-model:page="dealsPage"
          :columns="dealsColumns"
          :rows="dealsRows"
          :total="dealsStore.trashTotal"
          :total-page="dealsTotalPage"
          :per-page="dealsPerPage"
          :loading="dealsLoading"
          server-paginated
          @change-page="onChangeDealsPage"
          @change-per-page="onChangeDealsPerPage"
          @restore="onRestoreDeal"
        />
      </div>
      <div v-else-if="activeTab === 'leads'">
        <TableData
          v-model:page="leadsPage"
          :columns="leadsColumns"
          :rows="leadsRows"
          :total="leadsStore.trashTotal"
          :total-page="leadsTotalPage"
          :per-page="leadsPerPage"
          :loading="leadsLoading"
          server-paginated
          @change-page="onChangeLeadsPage"
          @change-per-page="onChangeLeadsPerPage"
          @restore="onRestoreLead"
        />
      </div>
      <div v-else-if="activeTab === 'companies'">
        <TableData
          v-model:page="companiesPage"
          :columns="companiesColumns"
          :rows="companiesRows"
          :total="companiesStore.trashTotal"
          :total-page="companiesTotalPage"
          :per-page="companiesPerPage"
          :loading="companiesLoading"
          server-paginated
          @change-page="onChangeCompaniesPage"
          @change-per-page="onChangeCompaniesPerPage"
          @restore="onRestoreCompany"
        />
      </div>
      <div v-else-if="activeTab === 'contacts'">
        <TableData
          v-model:page="contactsPage"
          :columns="contactsColumns"
          :rows="contactsRows"
          :total="contactsStore.trashTotal"
          :total-page="contactsTotalPage"
          :per-page="contactsPerPage"
          :loading="contactsLoading"
          server-paginated
          @change-page="onChangeContactsPage"
          @change-per-page="onChangeContactsPerPage"
          @restore="onRestoreContact"
        />
      </div>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { MANAGER_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('admin.trash.title') })

const { dateFormat, priceFormatCompact } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const dealsStore = useDealsStore()
const leadsStore = useLeadsStore()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()

// Trash is Admin/Sales Manager only, matching GET /deals/trash and /leads/trash RBAC.
const { canAccess, guardMounted } = usePageAccess(...MANAGER_ROLES)

const activeTab = ref('deals')
const tabItems = computed(() => [
  { label: t('admin.trash.tabs.deals'), value: 'deals' },
  { label: t('admin.trash.tabs.leads'), value: 'leads' },
  { label: t('admin.trash.tabs.companies'), value: 'companies' },
  { label: t('admin.trash.tabs.contacts'), value: 'contacts' },
])

// Shared "one tab's trash pagination" plumbing — the Deals and Leads tabs are
// identical here (server-paginated fetchTrash(page, perPage) + a loading flag
// that re-fetches on page/per-page change), differing only in which store's
// fetchTrash/trashTotal they read from.
const useTrashTab = <T,>(fetchTrash: (page: number, perPage: number) => Promise<T[]>, getTotal: () => number) => {
  const loading = ref(false)
  const page = ref(1)
  const perPage = ref(10)
  const totalPage = computed(() => Math.max(1, Math.ceil(getTotal() / perPage.value)))

  // No canAccess check needed here: guardMounted() below only calls this once
  // access is confirmed, and onChangePage/onChangePerPage are only reachable
  // through UI that <AccessGate> already hides otherwise.
  const fetch = async () => {
    loading.value = true
    try {
      await fetchTrash(page.value, perPage.value)
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    } finally {
      loading.value = false
    }
  }

  const onChangePage = (value: number) => {
    page.value = value
    fetch()
  }
  const onChangePerPage = (value: number) => {
    page.value = 1
    perPage.value = value
    fetch()
  }

  return { loading, page, perPage, totalPage, fetch, onChangePage, onChangePerPage }
}

const {
  loading: dealsLoading,
  page: dealsPage,
  perPage: dealsPerPage,
  totalPage: dealsTotalPage,
  fetch: fetchDealsTrash,
  onChangePage: onChangeDealsPage,
  onChangePerPage: onChangeDealsPerPage,
} = useTrashTab<Deal>(
  (page, perPage) => dealsStore.fetchTrash(page, perPage),
  () => dealsStore.trashTotal,
)

const dealsRows = computed(() => dealsStore.trashItems.map(deal => ({
  ...deal,
  companyName: companiesStore.nameById(deal.company_id),
  valueDisplay: `${t('global.currencySymbol')}${priceFormatCompact(deal.value)}`,
  deletedAtDisplay: deal.deleted_at ? dateFormat(deal.deleted_at) : '-',
})))

const dealsColumns: TableDataColumn[] = [
  { label: t('admin.trash.columns.deals.title'), align: 'left', field: 'title' },
  { label: t('admin.trash.columns.deals.company'), align: 'left', field: 'companyName' },
  { label: t('admin.trash.columns.deals.value'), align: 'left', field: 'valueDisplay' },
  { label: t('admin.trash.columns.deals.deletedAt'), align: 'left', field: 'deletedAtDisplay' },
  {
    label: t('admin.trash.columns.deals.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.trash.actions.restore'), emitName: 'restore', isBorderBottom: false },
    ],
  },
]

const onRestoreDeal = async (row: Deal) => {
  try {
    await dealsStore.restore(row.id)
    success(t('admin.trash.restoreSuccess', { entity: t('admin.trash.tabs.deals') }))
  } catch (err) {
    error(getApiErrorMessage(err, t('admin.trash.restoreError')))
  }
}

const {
  loading: leadsLoading,
  page: leadsPage,
  perPage: leadsPerPage,
  totalPage: leadsTotalPage,
  fetch: fetchLeadsTrash,
  onChangePage: onChangeLeadsPage,
  onChangePerPage: onChangeLeadsPerPage,
} = useTrashTab<Lead>(
  (page, perPage) => leadsStore.fetchTrash(page, perPage),
  () => leadsStore.trashTotal,
)

const leadsRows = computed(() => leadsStore.trashItems.map(lead => ({
  ...lead,
  deletedAtDisplay: lead.deleted_at ? dateFormat(lead.deleted_at) : '-',
})))

const leadsColumns: TableDataColumn[] = [
  { label: t('admin.trash.columns.leads.name'), align: 'left', field: 'name' },
  { label: t('admin.trash.columns.leads.company'), align: 'left', field: 'company_name' },
  { label: t('admin.trash.columns.leads.source'), align: 'left', field: 'source' },
  { label: t('admin.trash.columns.leads.deletedAt'), align: 'left', field: 'deletedAtDisplay' },
  {
    label: t('admin.trash.columns.leads.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.trash.actions.restore'), emitName: 'restore', isBorderBottom: false },
    ],
  },
]

const onRestoreLead = async (row: Lead) => {
  try {
    await leadsStore.restore(row.id)
    success(t('admin.trash.restoreSuccess', { entity: t('admin.trash.tabs.leads') }))
  } catch (err) {
    error(getApiErrorMessage(err, t('admin.trash.restoreError')))
  }
}

const {
  loading: companiesLoading,
  page: companiesPage,
  perPage: companiesPerPage,
  totalPage: companiesTotalPage,
  fetch: fetchCompaniesTrash,
  onChangePage: onChangeCompaniesPage,
  onChangePerPage: onChangeCompaniesPerPage,
} = useTrashTab<Company>(
  (page, perPage) => companiesStore.fetchTrash(page, perPage),
  () => companiesStore.trashTotal,
)

const companiesRows = computed(() => companiesStore.trashItems.map(company => ({
  ...company,
  deletedAtDisplay: company.deleted_at ? dateFormat(company.deleted_at) : '-',
})))

const companiesColumns: TableDataColumn[] = [
  { label: t('admin.trash.columns.companies.name'), align: 'left', field: 'name' },
  { label: t('admin.trash.columns.companies.industry'), align: 'left', field: 'industry' },
  { label: t('admin.trash.columns.companies.deletedAt'), align: 'left', field: 'deletedAtDisplay' },
  {
    label: t('admin.trash.columns.companies.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.trash.actions.restore'), emitName: 'restore', isBorderBottom: false },
    ],
  },
]

const onRestoreCompany = async (row: Company) => {
  try {
    await companiesStore.restore(row.id)
    success(t('admin.trash.restoreSuccess', { entity: t('admin.trash.tabs.companies') }))
  } catch (err) {
    error(getApiErrorMessage(err, t('admin.trash.restoreError')))
  }
}

const {
  loading: contactsLoading,
  page: contactsPage,
  perPage: contactsPerPage,
  totalPage: contactsTotalPage,
  fetch: fetchContactsTrash,
  onChangePage: onChangeContactsPage,
  onChangePerPage: onChangeContactsPerPage,
} = useTrashTab<Contact>(
  (page, perPage) => contactsStore.fetchTrash(page, perPage),
  () => contactsStore.trashTotal,
)

const contactsRows = computed(() => contactsStore.trashItems.map(contact => ({
  ...contact,
  companyName: companiesStore.nameById(contact.company_id),
  deletedAtDisplay: contact.deleted_at ? dateFormat(contact.deleted_at) : '-',
})))

const contactsColumns: TableDataColumn[] = [
  { label: t('admin.trash.columns.contacts.name'), align: 'left', field: 'name' },
  { label: t('admin.trash.columns.contacts.company'), align: 'left', field: 'companyName' },
  { label: t('admin.trash.columns.contacts.email'), align: 'left', field: 'email' },
  { label: t('admin.trash.columns.contacts.deletedAt'), align: 'left', field: 'deletedAtDisplay' },
  {
    label: t('admin.trash.columns.contacts.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.trash.actions.restore'), emitName: 'restore', isBorderBottom: false },
    ],
  },
]

const onRestoreContact = async (row: Contact) => {
  try {
    await contactsStore.restore(row.id)
    success(t('admin.trash.restoreSuccess', { entity: t('admin.trash.tabs.contacts') }))
  } catch (err) {
    error(getApiErrorMessage(err, t('admin.trash.restoreError')))
  }
}

guardMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  fetchDealsTrash()
  fetchLeadsTrash()
  fetchCompaniesTrash()
  fetchContactsTrash()
})
</script>
