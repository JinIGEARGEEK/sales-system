<template>
  <div class="p-5">
    <div v-if="company">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UButton
            icon="material-symbols:arrow-back"
            variant="ghost"
            color="neutral"
            class="cursor-pointer p-0 hover:bg-transparent"
            @click="navigateTo('/crm/companies')"
          />
          <h2 class="text-xl font-black">{{ company.name }}</h2>
          <UBadge :color="company.status === 'active' ? 'success' : 'neutral'" variant="subtle">
            {{ company.status === 'active' ? t('crm.companies.detail.statusActive') : t('crm.companies.detail.statusArchived') }}
          </UBadge>
          <UBadge v-for="tag in company.tags" :key="tag" color="neutral" variant="outline">{{ tag }}</UBadge>
        </div>
        <ButtonPrimary :label="t('crm.companies.detail.saveChanges')" outline icon="material-symbols:edit-outline" :loading="loading" @click="onSave" />
      </div>

      <UTabs v-model="activeTab" :items="tabItems" class="mb-4" />

      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <ContainerTemplate>
            <Form @submit="onSave">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputText v-model="form.name" :label="t('crm.companies.detail.companyName')" name="name" rules="required" />
                <InputSelect v-model="form.industry" :options="INDUSTRY_OPTIONS" :label="t('crm.companies.detail.industry')" name="industry" rules="required" />
                <InputText v-model="form.size" :label="t('crm.companies.detail.companySize')" name="size" />
                <InputText v-model="form.website" :label="t('crm.companies.detail.website')" name="website" />
                <InputText v-model="form.tags" :label="t('crm.companies.detail.tags')" :placeholder="t('crm.companies.detail.tagsPlaceholder')" name="tags" />
                <InputSelect
                  v-model="form.status"
                  :options="COMPANY_STATUS_FORM_OPTIONS"
                  :label="t('crm.companies.detail.status')"
                  name="status"
                  rules="required"
                />
                <InputText v-model="form.legal_name" :label="t('crm.companies.detail.legalName')" name="legal_name" />
                <InputText v-model="form.tax_id" :label="t('crm.companies.detail.taxId')" name="tax_id" />
                <div class="md:col-span-2">
                  <InputTextarea v-model="form.address" :label="t('crm.companies.detail.address')" name="address" />
                </div>
                <div class="md:col-span-2">
                  <InputTextarea v-model="form.notes" :label="t('crm.companies.detail.notes')" name="notes" />
                </div>
              </div>
            </Form>
          </ContainerTemplate>
        </div>

        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <h3 class="text-base font-semibold">{{ t('crm.companies.detail.summary') }}</h3>
            </template>
            <div class="flex flex-col gap-3 text-sm">
              <div class="flex justify-between"><span class="text-[var(--color-gray)]">{{ t('crm.companies.detail.contactsLabel') }}</span><span>{{ companyContacts.length }}</span></div>
              <div class="flex justify-between"><span class="text-[var(--color-gray)]">{{ t('crm.companies.detail.openDeals') }}</span><span>{{ openDeals.length }}</span></div>
              <div class="flex justify-between"><span class="text-[var(--color-gray)]">{{ t('crm.companies.detail.pipelineValue') }}</span><span>{{ priceFormat(openDealsValue) }}</span></div>
              <div class="flex justify-between">
                <span class="text-[var(--color-gray)]">{{ t('crm.companies.detail.lastContact') }}</span>
                <UBadge :color="lastContact.color" variant="subtle">{{ lastContact.label }}</UBadge>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <div v-else-if="activeTab === 'contacts'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.companies.detail.contactsHeading') }}</h3>
            <ButtonPrimary :label="t('crm.companies.detail.addContact')" icon="material-symbols:add" small @click="navigateTo(`/crm/contacts/create?company_id=${company.id}`)" />
          </div>
          <div v-if="companyContacts.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.companies.detail.noContacts') }}
          </div>
          <div v-else class="flex flex-col gap-2">
            <NuxtLink
              v-for="contact in companyContacts"
              :key="contact.id"
              :to="`/crm/contacts/${contact.id}`"
              class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
            >
              <div>
                <p class="text-sm font-medium">{{ contact.name }}</p>
                <p class="text-xs text-[var(--color-gray)]">{{ contact.role_title }} · {{ contact.email }}</p>
              </div>
              <UIcon name="material-symbols:chevron-right" class="size-5 text-[var(--color-gray)]" />
            </NuxtLink>
          </div>
        </ContainerTemplate>
      </div>

      <div v-else-if="activeTab === 'deals'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.companies.detail.dealsHeading') }}</h3>
            <ButtonPrimary :label="t('crm.companies.detail.addDeal')" icon="material-symbols:add" small @click="navigateTo(`/crm/deals/create?company_id=${company.id}`)" />
          </div>
          <div v-if="companyDeals.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.companies.detail.noDeals') }}
          </div>
          <div v-else class="flex flex-col gap-2">
            <NuxtLink
              v-for="deal in companyDeals"
              :key="deal.id"
              :to="`/crm/deals/${deal.id}`"
              class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
            >
              <div>
                <p class="text-sm font-medium">{{ deal.title }}</p>
                <p class="text-xs text-[var(--color-gray)]">{{ deal.stage }} · {{ priceFormat(deal.value) }}</p>
              </div>
              <UIcon name="material-symbols:chevron-right" class="size-5 text-[var(--color-gray)]" />
            </NuxtLink>
          </div>
        </ContainerTemplate>
      </div>

      <div v-else-if="activeTab === 'products'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.companies.detail.productsHeading') }}</h3>
            <ButtonPrimary :label="t('crm.companies.detail.addProduct')" icon="material-symbols:add" small @click="openAddCustomerProduct" />
          </div>
          <div v-if="companyProducts.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.companies.detail.noProducts') }}
          </div>
          <div v-else class="flex flex-col gap-2">
            <button
              v-for="record in companyProducts"
              :key="record.id"
              type="button"
              class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 text-left hover:bg-[var(--color-light-gray-1)]"
              @click="openEditCustomerProduct(record)"
            >
              <div>
                <p class="text-sm font-medium">{{ record.product.name }}</p>
                <p class="text-xs text-[var(--color-gray)]">{{ record.product.category || '-' }}</p>
              </div>
              <UBadge color="neutral" variant="subtle">{{ record.status }}</UBadge>
            </button>
          </div>
        </ContainerTemplate>

        <CrmAddCustomerProductModal
          v-model:open="addCustomerProductOpen"
          :products="activeProducts"
          :record="editingCustomerProduct"
          @submit="onAddCustomerProduct"
          @update="onUpdateCustomerProduct"
        />
      </div>

      <div v-else-if="activeTab === 'projects'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.companies.detail.projectsHeading') }}</h3>
            <ButtonPrimary v-if="canManageProjects" :label="t('crm.companies.detail.addProject')" icon="material-symbols:add" small @click="openAddProject" />
          </div>
          <div v-if="companyProjects.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.companies.detail.noProjects') }}
          </div>
          <div v-else class="flex flex-col gap-2">
            <button
              v-for="project in companyProjects"
              :key="project.id"
              type="button"
              class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 text-left hover:bg-[var(--color-light-gray-1)]"
              @click="openEditProject(project)"
            >
              <div>
                <p class="text-sm font-medium">{{ project.name }}</p>
                <p class="text-xs text-[var(--color-gray)]">
                  {{ project.target_end_date ? t('crm.companies.detail.projectTargetEndDate', { date: dateFormat(project.target_end_date.toISOString()) }) : '-' }}
                </p>
              </div>
              <UBadge color="neutral" variant="subtle">{{ project.status }}</UBadge>
            </button>
          </div>
        </ContainerTemplate>

        <CrmAddProjectModal
          v-model:open="addProjectOpen"
          :project="editingProject"
          :company-id="companyId"
          @submit="onSaveProject"
        />
      </div>

      <div v-else-if="activeTab === 'activity'">
        <ContainerTemplate>
          <h3 class="mb-4 text-base font-semibold">{{ t('crm.companies.detail.activityFeed') }}</h3>
          <CrmActivityTimeline :items="companyActivity" />
        </ContainerTemplate>
      </div>

      <div v-else-if="activeTab === 'tasks'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.companies.detail.tasksTitle') }}</h3>
            <ButtonPrimary
              :label="t('crm.companies.detail.addTask')"
              icon="material-symbols:add"
              small
              @click="openAddTask"
            />
          </div>
          <CrmTaskList :tasks="companyTasks" @toggle="onToggleTask" @remove="onRemoveTask" />
        </ContainerTemplate>

        <CrmAddTaskModal
          v-model:open="addTaskOpen"
          @submit="onSubmitTask"
        />
      </div>

      <div v-else-if="activeTab === 'attachments'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.companies.detail.attachmentsHeading') }}</h3>
            <ButtonPrimary
              v-if="canManageAttachments"
              :label="t('crm.companies.detail.addAttachment')"
              icon="material-symbols:add"
              small
              @click="addAttachmentOpen = true"
            />
          </div>
          <CrmAttachmentList :attachments="companyAttachments" @remove="onRemoveAttachment" />
        </ContainerTemplate>

        <CrmAddAttachmentModal
          v-model:open="addAttachmentOpen"
          @submit="onAddAttachment"
        />
      </div>
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.companies.detail.companyNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { INDUSTRY_OPTIONS, COMPANY_STATUS_FORM_OPTIONS, isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.companies.detail.pageTitle') })

const route = useRoute()
const { priceFormat, parseTags, dateFormat } = useFormatter()
const { lastContactInfo } = useLastContact()
const { success, error } = useNotify()
const { hasRole } = useRole()
// Matches the backend's Project Create RBAC (Admin/Sales Rep/Sales Manager,
// not Production) — internal/routes/routes.go's companies.Post("/:companyId/projects", ...).
const canManageProjects = computed(() => hasRole('Admin', 'Sales Rep', 'Sales Manager'))
// Matches the backend's POST /attachments RBAC — same role set as Projects,
// coincidentally, but a separate backend rule, so kept as its own computed.
const canManageAttachments = computed(() => hasRole('Admin', 'Sales Rep', 'Sales Manager'))
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const dealsStore = useDealsStore()
const activitiesStore = useActivitiesStore()
const productsStore = useProductsStore()
const customerProductsStore = useCustomerProductsStore()
const projectsStore = useProjectsStore()
const attachmentsStore = useAttachmentsStore()

const companyId = Number(route.params.id)
const company = computed(() => companiesStore.items.find(c => c.id === companyId))

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (contactsStore.items.length === 0) contactsStore.fetchAll()
  if (dealsStore.items.length === 0) dealsStore.fetchAll()
  if (productsStore.items.length === 0) productsStore.fetchAll()
  activitiesStore.fetchForRelated('company', companyId)
  customerProductsStore.fetchForCompany(companyId)
  projectsStore.fetchForCompany(companyId)
  attachmentsStore.fetchForRelated('company', companyId)
})

const activeTab = ref('overview')
const companyOverdueTaskCount = computed(() => companyTasks.value.filter(task => isTaskOverdue(task)).length)
const tabItems = computed(() => [
  { label: t('crm.companies.detail.tabs.overview'), value: 'overview' },
  { label: t('crm.companies.detail.tabs.contacts'), value: 'contacts' },
  { label: t('crm.companies.detail.tabs.deals'), value: 'deals' },
  { label: t('crm.companies.detail.tabs.products'), value: 'products' },
  { label: t('crm.companies.detail.tabs.projects'), value: 'projects' },
  { label: t('crm.companies.detail.tabs.activity'), value: 'activity' },
  { label: companyOverdueTaskCount.value > 0 ? `${t('crm.companies.detail.tabs.tasks')} (${companyOverdueTaskCount.value})` : t('crm.companies.detail.tabs.tasks'), value: 'tasks' },
  { label: t('crm.companies.detail.tabs.attachments'), value: 'attachments' },
])

const companyContacts = computed(() => contactsStore.byCompany(companyId))
const companyDeals = computed(() => dealsStore.items.filter(d => d.company_id === companyId))
const { openDeals, openValue: openDealsValue } = useDealMetrics(() => companyDeals.value)
const companyActivity = computed(() => activitiesStore.forRelated('company', companyId))
const lastContact = computed(() => {
  const dates = companyActivity.value.map(a => a.created_at)
  const latest = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
  return lastContactInfo(latest)
})

const { tasks: companyTasks, addTaskOpen, openAddTask, onSubmitTask, onToggleTask, onRemoveTask } = useTaskList('company', companyId, 'crm.companies.detail.addTaskSuccess')

const companyProducts = computed(() => customerProductsStore.forCompany(companyId))
const activeProducts = computed(() => productsStore.items.filter(p => p.is_active))
const addCustomerProductOpen = ref(false)
const editingCustomerProduct = ref<CustomerProduct | null>(null)

const openAddCustomerProduct = () => {
  editingCustomerProduct.value = null
  addCustomerProductOpen.value = true
}

const openEditCustomerProduct = (record: CustomerProduct) => {
  editingCustomerProduct.value = record
  addCustomerProductOpen.value = true
}

const onAddCustomerProduct = async (payload: { product_id: number, status: CustomerProductStatus }, product: Product) => {
  try {
    await customerProductsStore.add(companyId, payload, product)
    success(t('crm.companies.detail.addProductSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onUpdateCustomerProduct = async (payload: { status: CustomerProductStatus, end_date: Date | null }) => {
  if (!editingCustomerProduct.value) return
  try {
    await customerProductsStore.update(editingCustomerProduct.value.id, payload)
    success(t('crm.companies.detail.updateProductSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const companyProjects = computed(() => projectsStore.forCompany(companyId))
const {
  open: addProjectOpen,
  editing: editingProject,
  openAdd: openAddProject,
  openEdit: openEditProject,
  onSave: onSaveProject,
} = useProjectModal(companyId, 'crm.companies.detail.addProjectSuccess', 'crm.companies.detail.updateProjectSuccess')

const form = reactive({
  name: company.value?.name || '',
  industry: company.value?.industry || '',
  size: company.value?.size || '',
  website: company.value?.website || '',
  tags: company.value?.tags.join(', ') || '',
  status: company.value?.status || 'active',
  legal_name: company.value?.legal_name || '',
  address: company.value?.address || '',
  tax_id: company.value?.tax_id || '',
  notes: company.value?.notes || '',
})

// Company loads asynchronously now (fetched on mount), so the form is (re)populated
// once the record arrives instead of only at setup time.
watch(company, (value) => {
  if (!value) return
  form.name = value.name
  form.industry = value.industry
  form.size = value.size
  form.website = value.website
  form.tags = value.tags.join(', ')
  form.status = value.status
  form.legal_name = value.legal_name || ''
  form.address = value.address || ''
  form.tax_id = value.tax_id || ''
  form.notes = value.notes
}, { immediate: true })

const { loading, guard } = useSubmitGuard()

const onSave = guard(async () => {
  if (!company.value) return
  try {
    await companiesStore.update(company.value.id, {
      name: form.name,
      industry: form.industry,
      size: form.size,
      website: form.website,
      tags: parseTags(form.tags),
      status: form.status as ActiveArchivedStatus,
      legal_name: form.legal_name || null,
      address: form.address || null,
      tax_id: form.tax_id || null,
      notes: form.notes,
    })
    success(t('crm.companies.detail.updateSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})

const addAttachmentOpen = ref(false)
const companyAttachments = computed(() => attachmentsStore.forRelated('company', companyId))

const onAddAttachment = async (payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }) => {
  try {
    if ('file' in payload) {
      await attachmentsStore.addFile('company', companyId, payload.category, payload.file)
    } else {
      await attachmentsStore.addLink('company', companyId, payload.category, payload.fileName, payload.externalUrl)
    }
    success(t('crm.companies.detail.addAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onRemoveAttachment = async (id: number) => {
  try {
    await attachmentsStore.remove(id)
    success(t('crm.companies.detail.removeAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
