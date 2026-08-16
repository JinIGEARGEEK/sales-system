<template>
  <div class="p-5">
    <div v-if="!canAccess" class="p-10 text-center text-sm text-[var(--color-gray)]">
      {{ t('admin.trash.noAccess') }}
    </div>
    <template v-else>
      <div class="mb-4">
        <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('admin.trash.title') }}</h2>
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
          @change-page="onChangeLeadsPage"
          @change-per-page="onChangeLeadsPerPage"
          @restore="onRestoreLead"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'

const { t } = useI18n()

useHead({ title: t('admin.trash.title') })

const { dateFormat, priceFormat } = useFormatter()
const { success, error } = useNotify()
const { hasRole } = useRole()
const dealsStore = useDealsStore()
const leadsStore = useLeadsStore()
const companiesStore = useCompaniesStore()

// Trash is Admin/Sales Manager only, matching GET /deals/trash and /leads/trash RBAC.
const canAccess = computed(() => hasRole('Admin', 'Sales Manager'))

const activeTab = ref('deals')
const tabItems = computed(() => [
  { label: t('admin.trash.tabs.deals'), value: 'deals' },
  { label: t('admin.trash.tabs.leads'), value: 'leads' },
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

  const fetch = async () => {
    if (!canAccess.value) return
    loading.value = true
    try {
      await fetchTrash(page.value, perPage.value)
    } catch {
      error(t('global.genericError'))
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
  valueDisplay: priceFormat(deal.value),
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
    width: 100,
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
  } catch {
    error(t('admin.trash.restoreError'))
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
    width: 100,
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
  } catch {
    error(t('admin.trash.restoreError'))
  }
}

onMounted(() => {
  if (!canAccess.value) return
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  fetchDealsTrash()
  fetchLeadsTrash()
})
</script>
