<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.projects.index.heading') }}</h2>
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
            :label="t('admin.products.addProduct')"
            icon="material-symbols:add"
            @click="addProductOpen = true"
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
        @change-page="onChangeProductPage"
        @change-per-page="onChangeProductPerPage"
        @deactivate="requestDeactivate"
      />

      <CrmAddProductModal
        v-model:open="addProductOpen"
        @submit="onAddProduct"
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
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { PROJECT_STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('crm.projects.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { success, error } = useNotify()
const { hasRole } = useRole()
const projectsStore = useProjectsStore()
const productsStore = useProductsStore()
const companiesStore = useCompaniesStore()

// Matches the backend's Project Create RBAC (Admin/Sales Rep/Sales Manager,
// not Production) — same check as the company detail page's Projects tab.
const canManageProjects = computed(() => hasRole('Admin', 'Sales Rep', 'Sales Manager'))

onMounted(() => {
  if (projectsStore.items.length === 0) projectsStore.fetchAll()
  if (productsStore.items.length === 0) productsStore.fetchAll()
  if (canManageProjects.value && companiesStore.items.length === 0) companiesStore.fetchAll()
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
})))

const projectColumns: TableDataColumn[] = [
  { label: t('crm.projects.index.columns.name'), align: 'left', field: 'name' },
  { label: t('crm.projects.index.columns.company'), align: 'left', field: 'company_name' },
  { label: t('crm.projects.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('crm.projects.index.columns.targetEndDate'), align: 'left', field: 'targetEndDateDisplay' },
  {
    label: t('crm.projects.index.columns.action'),
    align: 'left',
    field: 'action',
    width: 100,
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

const addProjectOpen = ref(false)
const editingProject = ref<Project | null>(null)

const openAddProject = () => {
  editingProject.value = null
  addProjectOpen.value = true
}

const openEditProject = (row: Project) => {
  editingProject.value = row
  addProjectOpen.value = true
}

const onSaveProject = async (payload: { status: ProjectStatus, production_reference: string | null, name?: string, target_end_date?: Date | null, notes?: string, company_id?: number }) => {
  try {
    if (editingProject.value) {
      // A Production-role edit only carries status/production_reference (CrmAddProjectModal
      // hides the rest) — spreading the full payload as-is keeps that subset intact.
      await projectsStore.update(editingProject.value.id, payload)
      success(t('crm.projects.index.updateProjectSuccess'))
    } else {
      await projectsStore.add(payload.company_id!, {
        deal_id: null,
        start_date: new Date(),
        name: payload.name!,
        target_end_date: payload.target_end_date ?? null,
        notes: payload.notes ?? '',
        status: payload.status,
        production_reference: payload.production_reference,
      })
      success(t('crm.projects.index.addProjectSuccess'))
    }
  } catch {
    error(t('global.genericError'))
  }
}

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
    width: 100,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
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

const onAddProduct = async (product: { name: string, category: string, description: string }) => {
  try {
    await productsStore.add(product)
    success(t('admin.products.addSuccess'))
  } catch {
    error(t('global.genericError'))
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
    } catch {
      error(t('global.genericError'))
    }
  }
  closeDeactivate()
}
</script>
