<template>
  <div class="p-5">
    <div v-if="contact">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <UButton
          icon="material-symbols:arrow-back"
          variant="ghost"
          color="neutral"
          class="cursor-pointer p-0 hover:bg-transparent"
          :aria-label="t('global.back')"
          @click="goBack()"
        />
        <h2 class="max-w-full truncate text-xl font-black">{{ contact.name }}</h2>
        <UBadge v-for="tag in contact.tags" :key="tag" color="neutral" variant="outline">{{ tag }}</UBadge>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <ContainerTemplate>
            <Form @submit="onSave">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputText v-model="form.name" :label="t('crm.contacts.detail.fullName')" name="name" rules="required" />
                <InputCompanySelect v-model="form.company_id" :label="t('crm.contacts.detail.company')" name="company_id" rules="required" />
                <InputSelect v-model="form.role_title" :options="roleTitleOptions" :label="t('crm.contacts.detail.roleTitle')" name="role_title" />
                <InputText v-model="form.email" :label="t('crm.contacts.detail.email')" name="email" />
                <InputText v-model="form.phone" :label="t('crm.contacts.detail.phone')" name="phone" />
                <InputText v-model="form.tags" :label="t('crm.contacts.detail.tags')" :placeholder="t('crm.contacts.detail.tagsPlaceholder')" name="tags" />
              </div>
              <div class="mt-4 flex gap-3">
                <ButtonPrimary :label="t('crm.contacts.detail.saveChanges')" type="submit" :loading="loading" />
                <ButtonPrimary
                  :label="t('crm.contacts.detail.viewCompany')"
                  outline
                  type="button"
                  @click="companyPreviewOpen = true"
                />
              </div>
            </Form>
          </ContainerTemplate>
        </div>

        <div class="lg:col-span-2">
          <UCard class="mb-4">
            <template #header>
              <h3 class="text-base font-semibold">{{ t('crm.contacts.detail.linkedDeals') }}</h3>
            </template>
            <div v-if="linkedDeals.length === 0" class="text-sm text-[var(--color-gray)]">{{ t('crm.contacts.detail.noLinkedDeals') }}</div>
            <div v-else class="flex flex-col gap-2">
              <TableCardLink
                v-for="deal in linkedDeals"
                :key="deal.id"
                :items="{ path: `/crm/deals/${deal.id}`, label: `${deal.title} — ${deal.stage}` }"
              />
            </div>
          </UCard>
          <UCard class="mb-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold">{{ t('crm.contacts.detail.linkedProjects') }}</h3>
                <ButtonPrimary
                  v-if="canManageProjects"
                  :label="t('crm.contacts.detail.addProject')"
                  icon="material-symbols:add"
                  small
                  @click="openAddProject"
                />
              </div>
            </template>
            <div v-if="contactCompanyProjects.length === 0" class="text-sm text-[var(--color-gray)]">{{ t('crm.contacts.detail.noLinkedProjects') }}</div>
            <div v-else class="flex flex-col gap-2">
              <button
                v-for="project in contactCompanyProjects"
                :key="project.id"
                type="button"
                class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 text-left hover:bg-[var(--color-light-gray-1)]"
                @click="openEditProject(project)"
              >
                <div>
                  <p class="text-sm font-medium">{{ project.name }}</p>
                  <p v-if="project.deal_id" class="text-xs text-[var(--color-gray)]">
                    {{ t('crm.contacts.detail.projectLinkedDeal', { title: dealTitleById(project.deal_id) }) }}
                  </p>
                  <p class="text-xs text-[var(--color-gray)]">
                    {{ project.target_end_date ? t('crm.contacts.detail.projectTargetEndDate', { date: dateFormat(project.target_end_date.toISOString()) }) : '-' }}
                  </p>
                </div>
                <UBadge color="neutral" variant="subtle">{{ project.status }}</UBadge>
              </button>
            </div>
          </UCard>
          <UCard class="mb-4">
            <template #header>
              <h3 class="text-base font-semibold">{{ t('crm.contacts.detail.activityTitle') }}</h3>
            </template>
            <CrmActivityTimeline :items="contactActivity" />
          </UCard>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-semibold">{{ t('crm.contacts.detail.tasksTitle') }}</h3>
                  <UBadge v-if="contactOverdueTaskCount > 0" color="error" variant="subtle">
                    {{ t('crm.contacts.detail.overdueCount', { count: contactOverdueTaskCount }) }}
                  </UBadge>
                </div>
                <ButtonPrimary
                  :label="t('crm.contacts.detail.addTask')"
                  icon="material-symbols:add"
                  small
                  @click="openAddTask"
                />
              </div>
            </template>
            <CrmTaskList :tasks="contactTasks" @toggle="onToggleTask" @remove="onRemoveTask" @edit="openEditTask" />
          </UCard>
        </div>
      </div>
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.contacts.detail.contactNotFound') }}
    </div>

    <CrmAddTaskModal
      v-model:open="addTaskOpen"
      :task="editingTask"
      @submit="onSubmitTask"
      @update="onUpdateTask"
    />

    <CrmAddProjectModal
      v-model:open="addProjectOpen"
      :project="editingProject"
      :company-id="contact?.company_id"
      @submit="onSaveProject"
    />

    <CrmCompanyPreviewModal
      v-model:open="companyPreviewOpen"
      :company-id="contact?.company_id ?? null"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isTaskOverdue } from '~/constants/mockData'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.contacts.detail.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { parseTags, dateFormat } = useFormatter()
const { hasRole } = useRole()
const contactsStore = useContactsStore()
const dealsStore = useDealsStore()
const projectsStore = useProjectsStore()
const activitiesStore = useActivitiesStore()
const jobTitleOptionsStore = useJobTitleOptionsStore()

const contactId = Number(route.params.id)
const contact = computed(() => contactsStore.items.find(c => c.id === contactId))
const goBack = useBackNavigation('/crm/contacts')
const companyPreviewOpen = ref(false)

onMounted(() => {
  // fetchOne, not fetchAll: this page only ever needs this one Contact, and
  // fetchAll's 200-row cache (newest-first) can miss an older one entirely —
  // a Contact past that cutoff would otherwise never load here at all.
  if (!contactsStore.items.some(c => c.id === contactId)) contactsStore.fetchOne(contactId).catch(notifyApiError)
  // Companies aren't preloaded here — InputCompanySelect below searches the
  // server as the rep types instead of filtering a capped preloaded list
  // (companiesStore.fetchAll() is capped at 200, newest-first, and can miss
  // an older Company entirely — see api-system-spec.md's NFR-003 note). This
  // Contact's own Company's Deals are fetched scoped, below, once the
  // Contact itself (and so its company_id) resolves.
  if (jobTitleOptionsStore.items.length === 0) jobTitleOptionsStore.fetchAll().catch(notifyApiError)
  activitiesStore.fetchForRelated('contact', contactId).catch(notifyApiError)
})

// A Contact row may hold a role_title value that's since been deactivated (or
// inherited from data written before this feature existed) — keep it
// selectable so opening an existing Contact for edit never silently blanks
// the field, even though it won't appear for new Contacts going forward.
const roleTitleOptions = computed<Select[]>(() => {
  const current = contact.value?.role_title
  const active = jobTitleOptionsStore.activeOptions
  if (!current || active.some(o => o.value === current)) return active
  return [...active, { label: current, value: current }]
})

// Project has no contact_id of its own — it only relates to a Company (and
// optionally a Deal) — so "this contact's Projects" means the Projects of
// the Company the contact belongs to. Fetched once that company id is known,
// since the contact itself loads asynchronously.
const companyDeals = ref<Deal[]>([])
watch(() => contact.value?.company_id, async (companyId) => {
  if (!companyId) return
  projectsStore.fetchForCompany(companyId).catch(notifyApiError)
  // Scoped to this Contact's own Company, not a blanket dealsStore.fetchAll()
  // — that cache is capped at 200 rows, newest-first, system-wide (see
  // stores/companies.ts's fetchAll doc), so an older Deal belonging to this
  // Company could otherwise be missing from "linked deals" below even though
  // the Contact page itself loaded fine.
  const { items } = await dealsStore.fetchList({ company_id: companyId, per_page: 200 }).catch((err) => {
    notifyApiError(err)
    return { items: [] as Deal[] }
  })
  companyDeals.value = items
}, { immediate: true })

const linkedDeals = computed(() => companyDeals.value.filter(d => d.contact_id === contactId))
// A Project's linked deal always belongs to this same Company, so
// companyDeals (fetched above) already covers it, same reasoning as
// pages/crm/companies/[id].vue's own dealTitleById.
const dealTitleById = (dealId: number) => companyDeals.value.find(d => d.id === dealId)?.title ?? `#${dealId}`
const contactActivity = computed(() => activitiesStore.forRelated('contact', contactId))

// Matches the backend's Project Create RBAC (Admin/Sales Rep/Sales Manager, not
// Production) — same role set as SALES_PIPELINE_ROLES, so reuse it.
const canManageProjects = computed(() => hasRole(...SALES_PIPELINE_ROLES))
const contactCompanyProjects = computed(() => contact.value ? projectsStore.forCompany(contact.value.company_id) : [])

const {
  open: addProjectOpen,
  editing: editingProject,
  openAdd: openAddProject,
  openEdit: openEditProject,
  onSave: onSaveProject,
} = useProjectModal(
  computed(() => contact.value?.company_id ?? null),
  'crm.contacts.detail.addProjectSuccess',
  'crm.contacts.detail.updateProjectSuccess',
)

const { tasks: contactTasks, addTaskOpen, editingTask, openAddTask, openEditTask, onSubmitTask, onUpdateTask, onToggleTask, onRemoveTask } = useTaskList('contact', contactId, 'crm.contacts.detail.addTaskSuccess', 'crm.contacts.detail.editTaskSuccess')
const contactOverdueTaskCount = computed(() => contactTasks.value.filter(task => isTaskOverdue(task)).length)

const form = reactive({
  name: contact.value?.name || '',
  company_id: contact.value?.company_id ?? null as number | null,
  role_title: contact.value?.role_title || '',
  email: contact.value?.email || '',
  phone: contact.value?.phone || '',
  tags: contact.value?.tags.join(', ') || '',
})

// Contact loads asynchronously now (fetched on mount), so the form is (re)populated
// once the record arrives instead of only at setup time.
watch(contact, (value) => {
  if (!value) return
  form.name = value.name
  form.company_id = value.company_id
  form.role_title = value.role_title
  form.email = value.email
  form.phone = value.phone
  form.tags = value.tags.join(', ')
}, { immediate: true })

const { loading, guard } = useSubmitGuard()

const onSave = guard(async () => {
  if (!contact.value) return
  try {
    await contactsStore.update(contact.value.id, {
      name: form.name,
      company_id: form.company_id ?? 0,
      role_title: form.role_title,
      email: form.email,
      phone: form.phone,
      tags: parseTags(form.tags),
    })
    success(t('crm.contacts.detail.updateSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
</script>
