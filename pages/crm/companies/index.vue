<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.companies.index.heading') }}</h2>
      <div class="flex gap-2">
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
            :options="[{ label: t('crm.companies.index.allIndustries'), value: 'all' }, ...INDUSTRY_OPTIONS]"
            :placeholder="t('crm.companies.index.industryPlaceholder')"
            name="industryFilter"
          />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect
            v-model="statusFilter"
            :options="COMPANY_STATUS_OPTIONS"
            :placeholder="t('crm.companies.index.statusPlaceholder')"
            name="statusFilter"
          />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect
            v-model="tagFilter"
            :options="[{ label: t('crm.companies.index.allTags'), value: 'all' }, ...tagOptions]"
            :placeholder="t('crm.companies.index.tagPlaceholder')"
            name="tagFilter"
          />
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      :columns="columns"
      :rows="filteredCompanies"
      :total="filteredCompanies.length"
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
import { INDUSTRY_OPTIONS, COMPANY_STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.companies.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { lastContactInfo } = useLastContact()
const { success, error } = useNotify()
const companiesStore = useCompaniesStore()
const activitiesStore = useActivitiesStore()

const search = ref('')
const industryFilter = ref('all')
const statusFilter = ref('all')
const tagFilter = ref('all')
const showImport = ref(false)

onMounted(() => {
  companiesStore.fetchAll()
})

const companies = computed(() => companiesStore.items)

const tagOptions = computed(() => [...new Set(companies.value.flatMap(c => c.tags))].sort().map(tag => ({ label: tag, value: tag })))

const { onSort, sortRows } = useSortableRows()

const filteredCompanies = computed(() => {
  const filtered = companies.value.filter((company) => {
    const matchSearch = !search.value
      || company.name.toLowerCase().includes(search.value.toLowerCase())
      || company.website.toLowerCase().includes(search.value.toLowerCase())
    const matchIndustry = industryFilter.value === 'all' || company.industry === industryFilter.value
    const matchStatus = statusFilter.value === 'all' || company.status === statusFilter.value
    const matchTag = tagFilter.value === 'all' || company.tags.includes(tagFilter.value)
    return matchSearch && matchIndustry && matchStatus && matchTag
  }).map((company) => {
    // Only reflects activity already cached from visiting the company's detail page —
    // there's no bulk "activities for these companies" endpoint to fetch this list-wide.
    const activityDates = activitiesStore.forRelated('company', company.id).map(a => a.created_at)
    const lastContactDate = activityDates.length ? new Date(Math.max(...activityDates.map(d => d.getTime()))) : null
    const contact = lastContactInfo(lastContactDate)
    return {
      ...company,
      tagsDisplay: company.tags.join(', ') || '-',
      statusBadge: company.status === 'active'
        ? toBadge(t('crm.companies.index.statusActive'), 'success')
        : toBadge(t('crm.companies.index.statusArchived')),
      createdDate: dateFormat(company.created_at.toISOString()),
      lastContactBadge: toBadge(contact.label, contact.color),
    }
  })
  return sortRows(filtered, { createdDate: 'created_at' })
})

const columns: TableDataColumn[] = [
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
    width: 100,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.companies.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.companies.index.actions.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('crm.companies.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => filteredCompanies.value.length)
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
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDelete()
}

const onImported = ({ companies: companyCount, contacts: contactCount }: { companies: number, contacts: number }) => {
  success(t('crm.companies.index.importSuccess', { companies: companyCount, contacts: contactCount }))
}
</script>
