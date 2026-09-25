<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4">
        <h2 class="text-xl font-black">{{ t('admin.trash.title') }}</h2>
        <p class="text-sm text-(--color-gray)">{{ t('admin.trash.subtitle') }}</p>
      </div>

      <div ref="tabStripRef" class="mb-4 overflow-x-auto scrollbar-hide">
        <UTabs v-model="activeTab" :items="tabItems" :ui="{ list: 'w-max min-w-full', trigger: 'grow-0 shrink-0' }" />
      </div>

      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="max-w-sm">
          <InputText v-model="search" :placeholder="t('admin.trash.searchPlaceholder')" name="search" />
        </div>
      </UCard>

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
          v-bind="emptyStateProps"
          @clear-filters="search = ''"
          @change-page="onChangeDealsPage"
          @change-per-page="onChangeDealsPerPage"
          @restore="(row: Deal) => requestRestore({ entity: 'deal', row, name: row.title })"
        />
      </div>
      <div v-else-if="activeTab === 'prospects'">
        <TableData
          v-model:page="prospectsPage"
          :columns="prospectsColumns"
          :rows="prospectsRows"
          :total="prospectsStore.trashTotal"
          :total-page="prospectsTotalPage"
          :per-page="prospectsPerPage"
          :loading="prospectsLoading"
          server-paginated
          v-bind="emptyStateProps"
          @clear-filters="search = ''"
          @change-page="onChangeProspectsPage"
          @change-per-page="onChangeProspectsPerPage"
          @restore="(row: Prospect) => requestRestore({ entity: 'prospect', row, name: row.name })"
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
          v-bind="emptyStateProps"
          @clear-filters="search = ''"
          @change-page="onChangeLeadsPage"
          @change-per-page="onChangeLeadsPerPage"
          @restore="(row: Lead) => requestRestore({ entity: 'lead', row, name: row.name })"
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
          v-bind="emptyStateProps"
          @clear-filters="search = ''"
          @change-page="onChangeCompaniesPage"
          @change-per-page="onChangeCompaniesPerPage"
          @restore="(row: Company) => requestRestore({ entity: 'company', row, name: row.name })"
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
          v-bind="emptyStateProps"
          @clear-filters="search = ''"
          @change-page="onChangeContactsPage"
          @change-per-page="onChangeContactsPerPage"
          @restore="(row: Contact) => requestRestore({ entity: 'contact', row, name: row.name })"
        />
      </div>

      <CrmConfirmDeleteModal
        :open="restoreOpen"
        :title="t('admin.trash.confirmRestoreTitle')"
        :body="restoreTarget ? t('admin.trash.confirmRestoreBody', { name: restoreTarget.name }) : ''"
        :confirm-label="t('admin.trash.actions.restore')"
        confirm-color="success"
        @update:open="(value: boolean) => { if (!value) closeRestore() }"
        @confirm="onConfirmRestore"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { MANAGER_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.trash.title') })

const { dateFormat, priceFormatCompact } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const dealsStore = useDealsStore()
const prospectsStore = useProspectsStore()
const leadsStore = useLeadsStore()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()

// Trash is Admin/Sales Manager only, matching GET /deals/trash and /leads/trash RBAC.
const { canAccess, guardMounted } = usePageAccess(...MANAGER_ROLES)

// URL-synced (tab + search) so refresh and back/forward — e.g. returning
// from a restored record — land on the same tab with the same search.
const TRASH_TABS = ['deals', 'prospects', 'leads', 'companies', 'contacts']
const activeTab = useQuerySyncedRef('tab', 'deals', 0, TRASH_TABS)
// A refresh/back-forward onto a later tab would otherwise leave it scrolled
// out of sight in this horizontally-scrolling strip on mobile.
const tabStripRef = useTemplateRef<HTMLElement>('tabStripRef')
useScrollActiveTabIntoView(tabStripRef, activeTab)
// One search box shared across all tabs (rather than per-tab, since a
// rep hunting for a specific deleted record usually doesn't know which
// entity type it was) — each fetchXTrash below reads this by closure.
const search = useQuerySyncedRef('search', '', 400)
const tabItems = computed(() => [
  { label: t('admin.trash.tabs.deals'), value: 'deals' },
  { label: t('admin.trash.tabs.prospects'), value: 'prospects' },
  { label: t('admin.trash.tabs.leads'), value: 'leads' },
  { label: t('admin.trash.tabs.companies'), value: 'companies' },
  { label: t('admin.trash.tabs.contacts'), value: 'contacts' },
])

const emptyStateProps = computed(() => ({
  emptyTitle: t('admin.trash.emptyTitle'),
  emptyDescription: t('admin.trash.emptyDescription'),
  emptyIcon: 'material-symbols:delete-outline',
  filtered: search.value !== '',
}))

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
  (page, perPage) => dealsStore.fetchTrash(page, perPage, search.value),
  () => dealsStore.trashTotal,
)

const dealsRows = computed(() => dealsStore.trashItems.map(deal => ({
  ...deal,
  companyName: companiesStore.nameById(deal.company_id),
  valueDisplay: `${t('global.currencySymbol')}${priceFormatCompact(deal.value)}`,
  deletedAtDisplay: deal.deleted_at ? dateFormat(deal.deleted_at) : '-',
})))

const dealsColumns = computed<TableDataColumn[]>(() => [
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
])

// companiesStore.fetchAll() (guardMounted below) is a capped, point-in-time
// snapshot (see its own doc in stores/companies.ts) — trashed Deals are
// typically *older* records, so they're statistically more likely than
// average to fall outside that "200 newest" cutoff, silently rendering "-"
// for companyName even though company_id is correctly set. Same class of bug
// fixed for Contacts/Leads/Deals' own live list pages.
watch(() => dealsStore.trashItems, (items) => {
  for (const deal of items) {
    if (!companiesStore.items.some(c => c.id === deal.company_id)) {
      companiesStore.fetchOne(deal.company_id).catch(notifyApiError)
    }
  }
})

const {
  loading: prospectsLoading,
  page: prospectsPage,
  perPage: prospectsPerPage,
  totalPage: prospectsTotalPage,
  fetch: fetchProspectsTrash,
  onChangePage: onChangeProspectsPage,
  onChangePerPage: onChangeProspectsPerPage,
} = useTrashTab<Prospect>(
  (page, perPage) => prospectsStore.fetchTrash(page, perPage, search.value),
  () => prospectsStore.trashTotal,
)

const prospectsRows = computed(() => prospectsStore.trashItems.map(prospect => ({
  ...prospect,
  companyName: companiesStore.nameById(prospect.company_id),
  deletedAtDisplay: prospect.deleted_at ? dateFormat(prospect.deleted_at) : '-',
})))

// Same fetchOne fallback as the Leads tab below (company_id is nullable here too).
watch(() => prospectsStore.trashItems, (items) => {
  for (const prospect of items) {
    if (prospect.company_id && !companiesStore.items.some(c => c.id === prospect.company_id)) {
      companiesStore.fetchOne(prospect.company_id).catch(notifyApiError)
    }
  }
})

const prospectsColumns = computed<TableDataColumn[]>(() => [
  { label: t('admin.trash.columns.prospects.name'), align: 'left', field: 'name' },
  { label: t('admin.trash.columns.prospects.company'), align: 'left', field: 'companyName' },
  { label: t('admin.trash.columns.prospects.source'), align: 'left', field: 'source' },
  { label: t('admin.trash.columns.prospects.deletedAt'), align: 'left', field: 'deletedAtDisplay' },
  {
    label: t('admin.trash.columns.prospects.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.trash.actions.restore'), emitName: 'restore', isBorderBottom: false },
    ],
  },
])

const {
  loading: leadsLoading,
  page: leadsPage,
  perPage: leadsPerPage,
  totalPage: leadsTotalPage,
  fetch: fetchLeadsTrash,
  onChangePage: onChangeLeadsPage,
  onChangePerPage: onChangeLeadsPerPage,
} = useTrashTab<Lead>(
  (page, perPage) => leadsStore.fetchTrash(page, perPage, search.value),
  () => leadsStore.trashTotal,
)

const leadsRows = computed(() => leadsStore.trashItems.map(lead => ({
  ...lead,
  companyName: companiesStore.nameById(lead.company_id),
  deletedAtDisplay: lead.deleted_at ? dateFormat(lead.deleted_at) : '-',
})))

// Same fetchOne fallback as dealsStore/contactsStore.trashItems above.
// lead.company_id is nullable (unlike Deal/Contact's), so skip rows with no
// Company rather than fetchOne(null).
watch(() => leadsStore.trashItems, (items) => {
  for (const lead of items) {
    if (lead.company_id && !companiesStore.items.some(c => c.id === lead.company_id)) {
      companiesStore.fetchOne(lead.company_id).catch(notifyApiError)
    }
  }
})

const leadsColumns = computed<TableDataColumn[]>(() => [
  { label: t('admin.trash.columns.leads.name'), align: 'left', field: 'name' },
  { label: t('admin.trash.columns.leads.company'), align: 'left', field: 'companyName' },
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
])

const {
  loading: companiesLoading,
  page: companiesPage,
  perPage: companiesPerPage,
  totalPage: companiesTotalPage,
  fetch: fetchCompaniesTrash,
  onChangePage: onChangeCompaniesPage,
  onChangePerPage: onChangeCompaniesPerPage,
} = useTrashTab<Company>(
  (page, perPage) => companiesStore.fetchTrash(page, perPage, search.value),
  () => companiesStore.trashTotal,
)

const companiesRows = computed(() => companiesStore.trashItems.map(company => ({
  ...company,
  deletedAtDisplay: company.deleted_at ? dateFormat(company.deleted_at) : '-',
})))

const companiesColumns = computed<TableDataColumn[]>(() => [
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
])

const {
  loading: contactsLoading,
  page: contactsPage,
  perPage: contactsPerPage,
  totalPage: contactsTotalPage,
  fetch: fetchContactsTrash,
  onChangePage: onChangeContactsPage,
  onChangePerPage: onChangeContactsPerPage,
} = useTrashTab<Contact>(
  (page, perPage) => contactsStore.fetchTrash(page, perPage, search.value),
  () => contactsStore.trashTotal,
)

const contactsRows = computed(() => contactsStore.trashItems.map(contact => ({
  ...contact,
  companyName: companiesStore.nameById(contact.company_id),
  deletedAtDisplay: contact.deleted_at ? dateFormat(contact.deleted_at) : '-',
})))

const contactsColumns = computed<TableDataColumn[]>(() => [
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
])

// Same fetchOne fallback as dealsStore.trashItems above, for the same
// "trashed rows skew older than the cached 200-newest companies" reason.
watch(() => contactsStore.trashItems, (items) => {
  for (const contact of items) {
    if (!companiesStore.items.some(c => c.id === contact.company_id)) {
      companiesStore.fetchOne(contact.company_id).catch(notifyApiError)
    }
  }
})

type TrashEntity = 'deal' | 'prospect' | 'lead' | 'company' | 'contact'
type TrashRow = Deal | Prospect | Lead | Company | Contact
type RestoreTarget = { entity: TrashEntity, row: TrashRow, name: string }

const { open: restoreOpen, target: restoreTarget, requestDelete: requestRestore, closeDelete: closeRestore } = useDeleteConfirm<RestoreTarget>()

const RESTORE_HANDLERS: Record<TrashEntity, (id: number) => Promise<unknown>> = {
  deal: id => dealsStore.restore(id),
  prospect: id => prospectsStore.restore(id),
  lead: id => leadsStore.restore(id),
  company: id => companiesStore.restore(id),
  contact: id => contactsStore.restore(id),
}

// Every entity's trash tab is named by its plain plural except "company" —
// the only one whose plural isn't just "+s".
const tabKeyForEntity = (entity: TrashEntity) => (entity === 'company' ? 'companies' : `${entity}s`)

const onConfirmRestore = async () => {
  if (!restoreTarget.value) return
  const { entity, row } = restoreTarget.value
  try {
    await RESTORE_HANDLERS[entity](row.id)
    success(t('admin.trash.restoreSuccess', { entity: t(`admin.trash.tabs.${tabKeyForEntity(entity)}`) }))
  } catch (err) {
    error(getApiErrorMessage(err, t('admin.trash.restoreError')))
  } finally {
    closeRestore()
  }
}

guardMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  fetchDealsTrash()
  fetchProspectsTrash()
  fetchLeadsTrash()
  fetchCompaniesTrash()
  fetchContactsTrash()
})

// Refetches every tab together (not just the active one) — each is a
// small, cheap trash list, and doing them all keeps the other tabs from
// showing stale results if the rep switches tabs right after searching.
let searchDebounce: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    dealsPage.value = 1
    prospectsPage.value = 1
    leadsPage.value = 1
    companiesPage.value = 1
    contactsPage.value = 1
    fetchDealsTrash()
    fetchProspectsTrash()
    fetchLeadsTrash()
    fetchCompaniesTrash()
    fetchContactsTrash()
  }, 400)
})
</script>
