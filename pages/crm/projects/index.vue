<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('crm.projects.index.heading') }}</h2>
    </div>

    <UTabs v-model="activeTab" :items="tabItems" class="mb-4" />

    <div v-if="activeTab === 'projects'">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText v-model="search" :placeholder="t('crm.projects.index.searchPlaceholder')" name="search" />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect v-model="statusFilter" :options="statusFilterOptions" :placeholder="t('crm.projects.index.statusPlaceholder')" name="statusFilter" />
          </div>
          <ButtonPrimary
            v-if="canExport"
            outline
            :label="t('crm.projects.index.exportCsv')"
            icon="material-symbols:download"
            @click="onExportProjects"
          />
          <ButtonPrimary
            v-if="canManageProjects"
            :label="t('crm.projects.index.addProject')"
            icon="material-symbols:add"
            @click="openAddProject"
          />
        </div>
      </UCard>

      <TableData
        v-model:page="projectPage"
        :columns="projectColumns"
        :rows="projectRows"
        :total="projectRows.length"
        :total-page="projectTotalPage"
        :per-page="projectPerPage"
        :loading="projectsLoading"
        @change-page="onChangeProjectPage"
        @change-per-page="onChangeProjectPerPage"
        @view-detail="onViewCompany"
        @edit="openEditProject"
      />

      <CrmAddProjectModal
        v-model:open="addProjectOpen"
        :project="editingProject"
        :companies="companiesStore.items"
        @submit="onSaveProject"
      />
    </div>

    <div v-else-if="activeTab === 'products'">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText v-model="productSearch" :placeholder="t('admin.products.searchPlaceholder')" name="productSearch" />
          </div>
          <div class="w-full sm:w-48">
            <InputSelect v-model="productStatusFilter" :options="productStatusFilterOptions" :placeholder="t('admin.products.statusPlaceholder')" name="productStatusFilter" />
          </div>
          <ButtonPrimary
            v-if="canExport"
            outline
            :label="t('admin.products.exportCsv')"
            icon="material-symbols:download"
            @click="onExportProducts"
          />
          <ButtonPrimary
            :label="t('admin.products.addProduct')"
            icon="material-symbols:add"
            @click="openAddProduct"
          />
        </div>
      </UCard>

      <TableData
        v-model:page="productPage"
        :columns="productColumns"
        :rows="productRows"
        :total="productRows.length"
        :total-page="productTotalPage"
        :per-page="productPerPage"
        :loading="productsLoading"
        @change-page="onChangeProductPage"
        @change-per-page="onChangeProductPerPage"
        @edit="openEditProduct"
        @deactivate="requestDeactivate"
      />

      <CrmAddProductModal
        v-model:open="addProductOpen"
        :product="editingProduct"
        @submit="onSaveProduct"
      />

      <CrmConfirmDeleteModal
        v-model:open="deactivateOpen"
        :title="t('admin.products.deactivateModalTitle')"
        :body="deactivateTarget ? t('admin.products.deactivateModalBody', { name: deactivateTarget.name }) : ''"
        :confirm-label="t('admin.products.deactivate')"
        confirm-color="warning"
        @confirm="confirmDeactivate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MANAGER_ROLES } from '~/constants/roles'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { PROJECT_STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.projects.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const downloadCsvBlob = useDownloadCsvBlob()
const projectsStore = useProjectsStore()
const productsStore = useProductsStore()
const companiesStore = useCompaniesStore()
const dealsStore = useDealsStore()
const productCategoryOptionsStore = useProductCategoryOptionsStore()

// Matches the backend's Project Create RBAC (Admin/Sales Rep/Sales Manager,
// not Production) — same check as the company detail page's Projects tab.
const canManageProjects = computed(() => hasRole('Admin', 'Sales Rep', 'Sales Manager'))

// Matches the backend's /projects/export and /products/export RBAC (Admin/Sales Manager).
const canExport = computed(() => hasRole(...MANAGER_ROLES))
const onExportProjects = () => downloadCsvBlob('/projects/export', 'projects.csv')
const onExportProducts = () => downloadCsvBlob('/products/export', 'products.csv')

const projectsLoading = ref(false)
const productsLoading = ref(false)

onMounted(async () => {
  if (projectsStore.items.length === 0) {
    projectsLoading.value = true
    projectsStore.fetchAll().catch(notifyApiError).finally(() => { projectsLoading.value = false })
  }
  if (productsStore.items.length === 0) {
    productsLoading.value = true
    productsStore.fetchAll().catch(notifyApiError).finally(() => { productsLoading.value = false })
  }
  if (canManageProjects.value && companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  // Needed both for CrmAddProjectModal's optional Deal picker once a Company
  // is chosen, and to resolve each row's own linked-Deal display below —
  // fetched regardless of canManageProjects so Production (which can view
  // but not manage) still sees a resolved Deal name, not a raw id/blank.
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  // Needed for CrmAddProductModal's category picker.
  if (productCategoryOptionsStore.items.length === 0) productCategoryOptionsStore.fetchAll().catch(notifyApiError)
})

const activeTab = ref('projects')
const tabItems = computed(() => [
  { label: t('crm.projects.index.tabs.projects'), value: 'projects' },
  { label: t('crm.projects.index.tabs.products'), value: 'products' },
])

// ── Projects tab ──────────────────────────────────────────────

const search = ref('')
const statusFilter = ref('all')

const statusFilterOptions = computed(() => [
  { label: t('crm.projects.index.allStatuses'), value: 'all' },
  ...PROJECT_STATUS_OPTIONS,
])

const filteredProjects = computed(() => {
  return projectsStore.items.filter((project) => {
    const matchSearch = !search.value
      || project.name.toLowerCase().includes(search.value.toLowerCase())
      || (project.company_name || '').toLowerCase().includes(search.value.toLowerCase())
    const matchStatus = statusFilter.value === 'all' || project.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

const projectRows = computed(() => filteredProjects.value.map(project => ({
  ...project,
  statusBadge: toBadge(project.status),
  targetEndDateDisplay: project.target_end_date ? dateFormat(project.target_end_date.toISOString()) : '-',
  // deal_id is settable at creation (AddProjectModal's optional Deal picker)
  // but was previously never surfaced anywhere afterward — resolve it here
  // so the list is the one place a rep can see which Deal a Project came from.
  dealName: project.deal_id ? (dealsStore.items.find(d => d.id === project.deal_id)?.title ?? `#${project.deal_id}`) : '-',
})))

const projectColumns: TableDataColumn[] = [
  { label: t('crm.projects.index.columns.name'), align: 'left', field: 'name' },
  { label: t('crm.projects.index.columns.company'), align: 'left', field: 'company_name' },
  { label: t('crm.projects.index.columns.deal'), align: 'left', field: 'dealName' },
  { label: t('crm.projects.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.projects.index.columns.targetEndDate'), align: 'left', field: 'targetEndDateDisplay' },
  {
    label: t('crm.projects.index.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('crm.projects.index.viewCompany'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('crm.projects.index.edit'), emitName: 'edit', isBorderBottom: false },
    ],
  },
]

const onViewCompany = (row: Project) => {
  navigateTo(`/crm/companies/${row.company_id}`)
}

const {
  open: addProjectOpen,
  editing: editingProject,
  openAdd: openAddProject,
  openEdit: openEditProject,
  onSave: onSaveProject,
} = useProjectModal(null, 'crm.projects.index.addProjectSuccess', 'crm.projects.index.updateProjectSuccess')

const {
  page: projectPage,
  perPage: projectPerPage,
  totalPage: projectTotalPage,
  onChangePage: onChangeProjectPage,
  onChangePerPage: onChangeProjectPerPage,
} = useTablePagination(() => filteredProjects.value.length)

// ── Products tab ──────────────────────────────────────────────

const productSearch = ref('')
const productStatusFilter = ref('all')

const productStatusFilterOptions = computed(() => [
  { label: t('admin.products.allStatuses'), value: 'all' },
  { label: t('admin.products.statusActive'), value: 'active' },
  { label: t('admin.products.statusInactive'), value: 'inactive' },
])

const filteredProducts = computed(() => {
  return productsStore.items.filter((product) => {
    const matchSearch = !productSearch.value
      || product.name.toLowerCase().includes(productSearch.value.toLowerCase())
      || product.category.toLowerCase().includes(productSearch.value.toLowerCase())
    const matchStatus = productStatusFilter.value === 'all'
      || (productStatusFilter.value === 'active' && product.is_active)
      || (productStatusFilter.value === 'inactive' && !product.is_active)
    return matchSearch && matchStatus
  })
})

const productRows = computed(() => filteredProducts.value.map(product => ({
  ...product,
  statusBadge: toBadge(
    product.is_active ? t('admin.products.statusActive') : t('admin.products.statusInactive'),
    product.is_active ? 'success' : 'neutral',
  ),
})))

const productColumns: TableDataColumn[] = [
  { label: t('admin.products.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.products.columns.category'), align: 'left', field: 'category' },
  { label: t('admin.products.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.products.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.products.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.products.deactivate'), emitName: 'deactivate', isBorderBottom: false },
    ],
  },
]

const {
  page: productPage,
  perPage: productPerPage,
  totalPage: productTotalPage,
  onChangePage: onChangeProductPage,
  onChangePerPage: onChangeProductPerPage,
} = useTablePagination(() => filteredProducts.value.length)

const addProductOpen = ref(false)
const editingProduct = ref<Product | null>(null)

const openAddProduct = () => {
  editingProduct.value = null
  addProductOpen.value = true
}

const openEditProduct = (product: Product) => {
  editingProduct.value = product
  addProductOpen.value = true
}

const onSaveProduct = async (product: { name: string, category: string, description: string, price: number }) => {
  try {
    if (editingProduct.value) {
      await productsStore.update(editingProduct.value.id, product)
      success(t('admin.products.updateSuccess'))
    } else {
      await productsStore.add(product)
      success(t('admin.products.addSuccess'))
    }
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const {
  open: deactivateOpen,
  target: deactivateTarget,
  requestDelete: requestDeactivate,
  closeDelete: closeDeactivate,
} = useDeleteConfirm<Product>()

const confirmDeactivate = async () => {
  if (deactivateTarget.value) {
    try {
      await productsStore.deactivate(deactivateTarget.value.id)
      success(t('admin.products.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivate()
}
</script>
