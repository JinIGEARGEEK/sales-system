<template>
  <div class="p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xl font-black">{{ t('crm.companies.index.heading') }}</h2>
      <div class="flex flex-wrap gap-2">
        <ButtonPrimary
          outline
          :label="isSelectMode ? t('crm.components.tableSelect.cancelSelect') : t('crm.components.tableSelect.selectRows')"
          :disabled="!isSelectMode && displayCompanies.length === 0"
          data-cy="companies-select-mode-toggle"
          @click="toggleSelectMode"
        />
        <ButtonPrimary
          v-if="canExport"
          :label="t('crm.companies.index.exportCsv')"
          icon="material-symbols:download"
          outline
          @click="onExport"
        />
        <ButtonPrimary
          :label="t('crm.companies.index.import')"
          icon="material-symbols:upload-file-outline"
          outline
          @click="showImport = true"
        />
        <ButtonPrimary
          :label="t('crm.companies.index.addCompany')"
          icon="material-symbols:add"
          @click="navigateTo('/crm/companies/create')"
        />
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3">
        <CrmStatusPill v-model="statusFilter" :options="COMPANY_STATUS_OPTIONS" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText
              v-model="search"
              :placeholder="t('crm.companies.index.searchPlaceholder')"
              name="search"
            />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect
              v-model="industryFilter"
              :options="[{ label: t('crm.companies.index.allIndustries'), value: 'all' }, ...industryOptionsStore.activeOptions]"
              :placeholder="t('crm.companies.index.industryPlaceholder')"
              name="industryFilter"
            />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect
              v-model="tagFilter"
              :options="[{ label: t('crm.companies.index.allTags'), value: 'all' }, ...tagOptions]"
              :placeholder="t('crm.companies.index.tagPlaceholder')"
              name="tagFilter"
            />
          </div>
          <div class="w-full sm:w-56">
            <InputSelect
              v-model="staleDaysFilter"
              :options="STALE_DAYS_OPTIONS"
              :placeholder="t('crm.companies.index.staleDaysPlaceholder')"
              name="staleDaysFilter"
            />
          </div>
          <div class="w-full sm:w-56">
            <InputSelect
              v-model="hasWonDealFilter"
              :options="HAS_WON_DEAL_OPTIONS"
              :placeholder="t('crm.companies.index.hasWonDealPlaceholder')"
              name="hasWonDealFilter"
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
      :rows="displayCompanies"
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

    <CrmCampaignBulkActionBar
      v-if="selectedIds.length > 0"
      :selected-ids="selectedIds"
      @create-campaign="createCampaignOpen = true"
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
      :company-count="selectedIds.length"
      @submit="onCreateCampaign"
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

useHead({ title: t('crm.companies.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { lastContactInfo, CONTACT_STALE_TIER_DAYS } = useLastContact()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const downloadCsvBlob = useDownloadCsvBlob()
const companiesStore = useCompaniesStore()
const industryOptionsStore = useIndustryOptionsStore()
const campaignsStore = useCampaignsStore()

// Matches the backend's /companies/export RBAC (Admin/Sales Manager).
const canExport = computed(() => hasRole(...MANAGER_ROLES))

const search = ref('')
const industryFilter = ref('all')
const statusFilter = ref('all')
const tagFilter = ref('all')
// Reuses the same 60/90/120 tiers as useLastContact's CONTACT_STALE_TIER_DAYS
// (dormant-company/upsell targeting, FR-CRM-108) rather than inventing a
// separate set of thresholds for this filter.
const STALE_DAYS_OPTIONS: Select[] = [
  { label: t('crm.companies.index.staleDaysAny'), value: 'all' },
  { label: t('crm.companies.index.staleDays60'), value: String(CONTACT_STALE_TIER_DAYS.tier1) },
  { label: t('crm.companies.index.staleDays90'), value: String(CONTACT_STALE_TIER_DAYS.tier2) },
  { label: t('crm.companies.index.staleDays120'), value: String(CONTACT_STALE_TIER_DAYS.tier3) },
]
const staleDaysFilter = ref('all')
const HAS_WON_DEAL_OPTIONS: Select[] = [
  { label: t('crm.companies.index.hasWonDealAny'), value: 'all' },
  { label: t('crm.companies.index.hasWonDealYes'), value: 'true' },
]
const hasWonDealFilter = ref('all')
const showImport = ref(false)

const onExport = () => downloadCsvBlob('/companies/export', 'companies.csv')

onMounted(() => {
  fetch()
  // A full (up to 200) fetch is kept purely to derive the tag filter's option
  // list below — there's no "distinct tags" endpoint, so this stays separate
  // from the server-paginated `rows` that the table itself renders.
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  if (industryOptionsStore.items.length === 0) industryOptionsStore.fetchAll().catch(notifyApiError)
})

const tagOptions = computed(() => [...new Set(companiesStore.items.flatMap(c => c.tags))].sort().map(tag => ({ label: tag, value: tag })))

// Maps a TableData column field to the `sort` query param GET /companies
// understands (created_at/name/industry).
const SORT_FIELD_MAP: Record<string, string> = { createdDate: 'created_at' }

const sortField = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')

const onSort = (field: string, direction: 'asc' | 'desc') => {
  sortField.value = field
  sortDir.value = direction
  refetchFromStart()
}

const buildParams = () => ({
  search: search.value || undefined,
  industry: industryFilter.value !== 'all' ? industryFilter.value : undefined,
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
  tag: tagFilter.value !== 'all' ? tagFilter.value : undefined,
  stale_days: staleDaysFilter.value !== 'all' ? staleDaysFilter.value : undefined,
  has_won_deal: hasWonDealFilter.value !== 'all' ? hasWonDealFilter.value : undefined,
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
} = useServerListPage<Company>(params => companiesStore.fetchList(params), buildParams)

watch(search, () => refetchDebounced())
watch([industryFilter, statusFilter, tagFilter, staleDaysFilter, hasWonDealFilter], () => refetchFromStart())
// Selection is scoped to the currently visible page — a page/filter/sort
// change invalidates whatever was selected before it (same as Leads' own
// list page).
watch([page, () => buildParams()], () => { selected.value = [] })

const displayCompanies = computed(() => rows.value.map((company) => {
  // Server-computed last_activity_at (most recent company-scoped Activity's
  // created_at, or null) — authoritative list-wide, unlike the previous
  // client-cache-derived version which only reflected activity already
  // cached from visiting a company's detail page.
  const contact = lastContactInfo(company.last_activity_at ? new Date(company.last_activity_at) : null)
  return {
    ...company,
    tagsDisplay: company.tags.join(', ') || '-',
    statusBadge: company.status === 'active'
      ? toBadge(t('crm.companies.index.statusActive'), 'success')
      : toBadge(t('crm.companies.index.statusArchived')),
    createdDate: dateFormat(company.created_at.toISOString()),
    lastContactBadge: toBadge(contact.label, contact.color),
  }
}))

const { isSelectMode, selected, selectedIds, toggleSelectMode, clearSelection } = useBulkSelection<Company>()

const createCampaignOpen = ref(false)

const onCreateCampaign = async (payload: { name: string, title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }) => {
  try {
    const campaign = await campaignsStore.create({ name: payload.name, type: 'win_back' })
    await campaignsStore.bulkCreateTasks(campaign.id, {
      company_ids: selectedIds.value,
      title: payload.title,
      description: payload.description,
      due_date: payload.due_date,
      priority: payload.priority,
      assigned_to: payload.assigned_to,
    })
    success(t('crm.companies.index.campaignCreateSuccess', { name: campaign.name, count: selectedIds.value.length }))
    clearSelection()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const columns = computed<TableDataColumn[]>(() => [
  ...(isSelectMode.value ? [{ label: '', align: 'left' as const, field: 'select', type: TABLE_CARD_TYPE.SELECTED }] : []),
  { label: t('crm.companies.index.columns.name'), align: 'left', field: 'name', isSort: true },
  { label: t('crm.companies.index.columns.industry'), align: 'left', field: 'industry', isSort: true },
  { label: t('crm.companies.index.columns.size'), align: 'left', field: 'size' },
  { label: t('crm.companies.index.columns.tags'), align: 'left', field: 'tagsDisplay' },
  { label: t('crm.companies.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.companies.index.columns.created'), align: 'left', field: 'createdDate', isSort: true },
  { label: t('crm.companies.index.columns.lastContact'), align: 'left', field: 'lastContactBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('crm.companies.index.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.companies.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.companies.index.actions.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('crm.companies.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
])

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Company>()

const onViewDetail = (row: Company) => {
  navigateTo(`/crm/companies/${row.id}`)
}

const onEdit = (row: Company) => {
  navigateTo(`/crm/companies/${row.id}`)
}

const confirmDelete = async () => {
  if (target.value) {
    try {
      await companiesStore.remove(target.value.id)
      success(t('crm.companies.index.deleteSuccess'))
      await fetch()
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDelete()
}

const onImported = ({ companies: companyCount, contacts: contactCount }: { companies: number, contacts: number }) => {
  success(t('crm.companies.index.importSuccess', { companies: companyCount, contacts: contactCount }))
  fetch()
}
</script>
