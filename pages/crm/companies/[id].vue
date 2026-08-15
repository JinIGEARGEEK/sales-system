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
          <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ company.name }}</h2>
          <UBadge :color="company.status === 'active' ? 'success' : 'neutral'" variant="subtle">
            {{ company.status === 'active' ? t('crm.companies.detail.statusActive') : t('crm.companies.detail.statusArchived') }}
          </UBadge>
          <UBadge v-for="tag in company.tags" :key="tag" color="neutral" variant="outline">{{ tag }}</UBadge>
        </div>
        <ButtonPrimary :label="t('crm.companies.detail.saveChanges')" outline icon="material-symbols:edit-outline" @click="onSave" />
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
const { priceFormat, parseTags } = useFormatter()
const { lastContactInfo } = useLastContact()
const { success, error } = useNotify()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const dealsStore = useDealsStore()
const activitiesStore = useActivitiesStore()

const companyId = Number(route.params.id)
const company = computed(() => companiesStore.items.find(c => c.id === companyId))

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (contactsStore.items.length === 0) contactsStore.fetchAll()
  if (dealsStore.items.length === 0) dealsStore.fetchAll()
  activitiesStore.fetchForRelated('company', companyId)
})

const activeTab = ref('overview')
const companyOverdueTaskCount = computed(() => companyTasks.value.filter(task => isTaskOverdue(task)).length)
const tabItems = computed(() => [
  { label: t('crm.companies.detail.tabs.overview'), value: 'overview' },
  { label: t('crm.companies.detail.tabs.contacts'), value: 'contacts' },
  { label: t('crm.companies.detail.tabs.deals'), value: 'deals' },
  { label: t('crm.companies.detail.tabs.activity'), value: 'activity' },
  { label: companyOverdueTaskCount.value > 0 ? `${t('crm.companies.detail.tabs.tasks')} (${companyOverdueTaskCount.value})` : t('crm.companies.detail.tabs.tasks'), value: 'tasks' },
])

const companyContacts = computed(() => contactsStore.items.filter(c => c.company_id === companyId))
const companyDeals = computed(() => dealsStore.items.filter(d => d.company_id === companyId))
const { openDeals, openValue: openDealsValue } = useDealMetrics(() => companyDeals.value)
const companyActivity = computed(() => activitiesStore.forRelated('company', companyId))
const lastContact = computed(() => {
  const dates = companyActivity.value.map(a => a.created_at)
  const latest = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
  return lastContactInfo(latest)
})

const { tasks: companyTasks, addTaskOpen, openAddTask, onSubmitTask, onToggleTask, onRemoveTask } = useTaskList('company', companyId, 'crm.companies.detail.addTaskSuccess')

const form = reactive({
  name: company.value?.name || '',
  industry: company.value?.industry || '',
  size: company.value?.size || '',
  website: company.value?.website || '',
  tags: company.value?.tags.join(', ') || '',
  status: company.value?.status || 'active',
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
  form.notes = value.notes
}, { immediate: true })

const onSave = async () => {
  if (!company.value) return
  try {
    await companiesStore.update(company.value.id, {
      name: form.name,
      industry: form.industry,
      size: form.size,
      website: form.website,
      tags: parseTags(form.tags),
      status: form.status as ActiveArchivedStatus,
      notes: form.notes,
    })
    success(t('crm.companies.detail.updateSuccess'))
  } catch {
    error(t('global.genericError'))
  }
}
</script>
