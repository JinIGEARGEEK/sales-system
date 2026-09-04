<template>
  <div class="p-5">
    <div v-if="company">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 flex-wrap items-center gap-3">
          <UButton
            icon="material-symbols:arrow-back"
            variant="ghost"
            color="neutral"
            class="cursor-pointer p-0 hover:bg-transparent"
            :aria-label="t('global.back')"
            @click="navigateTo('/crm/companies')"
          />
          <h2 class="max-w-full truncate text-xl font-black">{{ company.name }}</h2>
          <UBadge :color="company.status === 'active' ? 'success' : 'neutral'" variant="subtle">
            {{ company.status === 'active' ? t('crm.companies.detail.statusActive') : t('crm.companies.detail.statusArchived') }}
          </UBadge>
          <UBadge v-for="tag in company.tags" :key="tag" color="neutral" variant="outline">{{ tag }}</UBadge>
        </div>
        <div class="flex flex-wrap gap-2">
          <ButtonPrimary :label="t('crm.components.campaignBulkActionBar.addToCampaign')" outline icon="material-symbols:campaign-outline" @click="openCampaignModal" />
          <ButtonPrimary :label="t('crm.companies.detail.saveChanges')" outline icon="material-symbols:edit-outline" :loading="loading" @click="onSave" />
        </div>
      </div>

      <div class="mb-4 overflow-x-auto">
        <UTabs v-model="activeTab" :items="tabItems" :ui="{ list: 'w-max min-w-full', trigger: 'grow-0 shrink-0' }" />
      </div>

      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <ContainerTemplate>
            <Form @submit="onSave">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputText v-model="form.name" :label="t('crm.companies.detail.companyName')" name="name" rules="required" />
                <InputSelect v-model="form.industry" :options="industryOptions" :label="t('crm.companies.detail.industry')" name="industry" rules="required" />
                <InputSelect v-model="form.size" :options="companySizeOptions" :label="t('crm.companies.detail.companySize')" name="size" />
                <InputSelect v-model="form.revenue_size" :options="revenueSizeOptions" :label="t('crm.companies.detail.revenueSize')" name="revenue_size" />
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
              <div class="flex justify-between"><span class="text-[var(--color-gray)]">{{ t('crm.companies.detail.pipelineValue') }}</span><span>{{ t('global.currencySymbol') }}{{ priceFormatCompact(openDealsValue) }}</span></div>
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
                <p class="text-xs text-[var(--color-gray)]">{{ deal.stage }} · {{ t('global.currencySymbol') }}{{ priceFormatCompact(deal.value) }}</p>
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
          :company-id="companyId"
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
                <p v-if="project.deal_id" class="text-xs text-[var(--color-gray)]">
                  {{ t('crm.companies.detail.projectLinkedDeal', { title: dealTitleById(project.deal_id) }) }}
                </p>
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
          <CrmTaskList :tasks="companyTasks" @toggle="onToggleTask" @remove="onRemoveTask" @edit="openEditTask" />
        </ContainerTemplate>

        <CrmAddTaskModal
          v-model:open="addTaskOpen"
          :task="editingTask"
          @submit="onSubmitTask"
          @update="onUpdateTask"
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

      <CrmCreateCampaignModal
        v-model:open="createCampaignOpen"
        :targets="campaignTargets"
        :type-options="['win_back', 'upsell']"
        @submit="onSubmitCampaign"
      />
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.companies.detail.companyNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { COMPANY_STATUS_FORM_OPTIONS, isTaskOverdue } from '~/constants/mockData'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.companies.detail.pageTitle') })

const route = useRoute()
const { priceFormatCompact, parseTags, dateFormat } = useFormatter()
const { lastContactInfo } = useLastContact()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
// Matches the backend's Project Create RBAC (Admin/Sales Rep/Sales Manager,
// not Production) — internal/routes/routes.go's companies.Post("/:companyId/projects", ...).
// Same role set as SALES_PIPELINE_ROLES, so reuse it rather than re-listing.
const canManageProjects = computed(() => hasRole(...SALES_PIPELINE_ROLES))
// Matches the backend's POST /attachments RBAC — same role set as Projects,
// coincidentally, but a separate backend rule, so kept as its own computed.
const canManageAttachments = computed(() => hasRole(...SALES_PIPELINE_ROLES))
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const dealsStore = useDealsStore()
const activitiesStore = useActivitiesStore()
const productsStore = useProductsStore()
const customerProductsStore = useCustomerProductsStore()
const projectsStore = useProjectsStore()
const attachmentsStore = useAttachmentsStore()
const industryOptionsStore = useIndustryOptionsStore()
const companySizeOptionsStore = useCompanySizeOptionsStore()
const revenueSizeOptionsStore = useRevenueSizeOptionsStore()
const campaignsStore = useCampaignsStore()

const companyId = Number(route.params.id)
const company = computed(() => companiesStore.items.find(c => c.id === companyId))

// Single-record "Add to Campaign" entry point (FR-CRM-112) — mirrors the
// Companies list's bulk-select flow, but the target array here is always
// this one Company.
const createCampaignOpen = ref(false)
const campaignTargets = computed<CampaignTarget[]>(() => (company.value ? [{ type: 'company', id: company.value.id, name: company.value.name }] : []))
const openCampaignModal = () => { createCampaignOpen.value = true }
const onSubmitCampaign = async (payload: CampaignTaskSetupSubmitPayload) => {
  try {
    const campaign = await campaignsStore.submitCampaignTasks(campaignTargets.value, payload)
    success(t(payload.mode === 'existing' ? 'crm.companies.index.campaignAddSuccess' : 'crm.companies.index.campaignCreateSuccess', { name: campaign.name, count: campaignTargets.value.length }))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

onMounted(() => {
  // fetchOne, not fetchAll: this page only ever needs this one Company, and
  // fetchAll's 200-row cache (newest-first) can miss an older one entirely —
  // a company past that cutoff would otherwise never load here at all.
  if (!companiesStore.items.some(c => c.id === companyId)) companiesStore.fetchOne(companyId).catch(notifyApiError)
  // Scoped fetches for this Company's own Contacts/Deals, not a blanket
  // fetchAll() — those stores' fetchAll caches are capped at 200 rows,
  // newest-first system-wide (see stores/companies.ts's fetchAll doc), so an
  // older Contact/Deal belonging to this Company could otherwise be missing
  // from its own tab here even though the Company page itself loaded fine.
  fetchCompanyContacts()
  fetchCompanyDeals()
  if (productsStore.items.length === 0) productsStore.fetchAll().catch(notifyApiError)
  if (industryOptionsStore.items.length === 0) industryOptionsStore.fetchAll().catch(notifyApiError)
  if (companySizeOptionsStore.items.length === 0) companySizeOptionsStore.fetchAll().catch(notifyApiError)
  if (revenueSizeOptionsStore.items.length === 0) revenueSizeOptionsStore.fetchAll().catch(notifyApiError)
  activitiesStore.fetchForRelated('company', companyId).catch(notifyApiError)
  customerProductsStore.fetchForCompany(companyId).catch(notifyApiError)
  projectsStore.fetchForCompany(companyId).catch(notifyApiError)
  attachmentsStore.fetchForRelated('company', companyId).catch(notifyApiError)
})

// A Company row may hold an industry/size value that's since been
// deactivated (or inherited from data written before this feature
// existed) — keep it selectable so opening an existing Company for edit
// never silently blanks the field, even though it won't appear for new
// Companies going forward.
const industryOptions = computed<Select[]>(() => {
  const current = company.value?.industry
  const active = industryOptionsStore.activeOptions
  if (!current || active.some(o => o.value === current)) return active
  return [...active, { label: current, value: current }]
})
const companySizeOptions = computed<Select[]>(() => {
  const current = company.value?.size
  const active = companySizeOptionsStore.activeOptions
  if (!current || active.some(o => o.value === current)) return active
  return [...active, { label: current, value: current }]
})
const revenueSizeOptions = computed<Select[]>(() => {
  const current = company.value?.revenue_size
  const active = revenueSizeOptionsStore.activeOptions
  if (!current || active.some(o => o.value === current)) return active
  return [...active, { label: current, value: current }]
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

const companyContacts = ref<Contact[]>([])
const fetchCompanyContacts = async () => {
  const { items } = await contactsStore.fetchList({ company_id: companyId, per_page: 200 }).catch((err) => {
    notifyApiError(err)
    return { items: [] as Contact[] }
  })
  companyContacts.value = items
}

const companyDeals = ref<Deal[]>([])
const fetchCompanyDeals = async () => {
  const { items } = await dealsStore.fetchList({ company_id: companyId, per_page: 200 }).catch((err) => {
    notifyApiError(err)
    return { items: [] as Deal[] }
  })
  companyDeals.value = items
}
// Resolves a Project's deal_id (settable at creation, never surfaced anywhere
// afterward until now) to its Deal title for display on the Projects tab —
// a Project's linked Deal always belongs to this same Company, so
// companyDeals (this Company's own deals, fetched above) already covers it.
const dealTitleById = (dealId: number) => companyDeals.value.find(d => d.id === dealId)?.title ?? `#${dealId}`
const { openDeals, openValue: openDealsValue } = useDealMetrics(() => companyDeals.value)
const companyActivity = computed(() => activitiesStore.forRelated('company', companyId))
const lastContact = computed(() => {
  const dates = companyActivity.value.map(a => a.created_at)
  const latest = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
  return lastContactInfo(latest)
})

const { tasks: companyTasks, addTaskOpen, editingTask, openAddTask, openEditTask, onSubmitTask, onUpdateTask, onToggleTask, onRemoveTask } = useTaskList('company', companyId, 'crm.companies.detail.addTaskSuccess', 'crm.companies.detail.editTaskSuccess')

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

const onAddCustomerProduct = async (payload: { product_id: number, status: CustomerProductStatus, start_date: Date | null, source_deal_id: number | null }, product: Product) => {
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
  revenue_size: company.value?.revenue_size || '',
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
  form.revenue_size = value.revenue_size
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
      revenue_size: form.revenue_size,
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
