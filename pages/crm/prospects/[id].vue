<template>
  <div class="p-5">
    <div v-if="prospect">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 flex-wrap items-center gap-3">
          <UButton
            icon="material-symbols:arrow-back"
            variant="ghost"
            color="neutral"
            class="cursor-pointer p-0 hover:bg-transparent"
            :aria-label="t('global.back')"
            @click="goBack()"
          />
          <h2 class="max-w-full truncate text-xl font-black">{{ prospect.name }}</h2>
          <UBadge :color="prospectStatusColor(prospect.status)" variant="subtle">{{ prospect.status }}</UBadge>
          <UBadge v-for="tag in prospect.tags" :key="tag" color="neutral" variant="outline">{{ tag }}</UBadge>
        </div>
        <div class="flex flex-wrap gap-2">
          <ButtonPrimary
            v-if="prospect.converted_lead_id"
            :label="t('crm.prospects.detail.viewLead')"
            icon="material-symbols:open-in-new"
            @click="navigateTo(`/crm/leads/${prospect.converted_lead_id}`)"
          />
          <UTooltip v-else-if="prospect.status !== 'Disqualified'" :text="t('crm.prospects.detail.convertToLeadHint')">
            <ButtonPrimary
              :label="t('crm.prospects.detail.convertToLead')"
              icon="material-symbols:swap-horiz"
              @click="requestConvert"
            />
          </UTooltip>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <ContainerTemplate>
            <Form @submit="onSave">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputText v-model="form.name" :label="t('crm.prospects.detail.fullName')" name="name" rules="required" />
                <InputCompanySelect v-model="form.company_id" :label="t('crm.prospects.detail.companyName')" name="company_id" />
                <InputText v-model="form.email" :label="t('crm.prospects.detail.email')" name="email" />
                <InputText v-model="form.phone" :label="t('crm.prospects.detail.phone')" name="phone" />
                <InputSelect v-model="form.source" :options="prospectSourcesStore.activeOptions" :label="t('crm.prospects.detail.source')" name="source" rules="required" />
                <InputSelect
                  v-model="form.status"
                  :options="PROSPECT_STATUS_FORM_OPTIONS"
                  :label="t('crm.prospects.detail.status')"
                  name="status"
                  rules="required"
                />
                <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
                <InputText v-model="form.tags" :label="t('crm.prospects.detail.tags')" :placeholder="t('crm.prospects.detail.tagsPlaceholder')" name="tags" />
                <div class="md:col-span-2">
                  <InputTextarea v-model="form.notes" :label="t('crm.prospects.detail.notes')" name="notes" />
                </div>
              </div>
              <div class="mt-4 flex gap-3">
                <ButtonPrimary :label="t('crm.prospects.detail.saveChanges')" type="submit" :loading="loading" />
                <ButtonPrimary
                  v-if="prospect.company_id"
                  :label="t('crm.prospects.detail.viewCompany')"
                  outline
                  type="button"
                  @click="companyPreviewOpen = true"
                />
              </div>
            </Form>
          </ContainerTemplate>

          <ContainerTemplate class="mt-4">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-base font-semibold">{{ t('crm.leads.detail.attachmentsHeading') }}</h3>
              <ButtonPrimary
                :label="t('crm.leads.detail.addAttachment')"
                icon="material-symbols:add"
                small
                @click="addAttachmentOpen = true"
              />
            </div>
            <CrmAttachmentList :attachments="prospectAttachments" @remove="onRemoveAttachment" />
          </ContainerTemplate>
        </div>

        <div class="lg:col-span-2">
          <UCard class="mb-4">
            <template #header>
              <h3 class="text-base font-semibold">{{ t('crm.prospects.detail.activityTitle') }}</h3>
            </template>
            <CrmActivityTimeline :items="prospectActivity" />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-semibold">{{ t('crm.prospects.detail.tasksTitle') }}</h3>
                  <UBadge v-if="prospectOverdueTaskCount > 0" color="error" variant="subtle">
                    {{ t('crm.prospects.detail.overdueCount', { count: prospectOverdueTaskCount }) }}
                  </UBadge>
                </div>
                <ButtonPrimary
                  :label="t('crm.prospects.detail.addTask')"
                  icon="material-symbols:add"
                  small
                  @click="openAddTask"
                />
              </div>
            </template>
            <CrmTaskList :tasks="prospectTasks" @toggle="onToggleTask" @remove="onRemoveTask" @edit="openEditTask" />
          </UCard>
        </div>
      </div>
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.prospects.detail.prospectNotFound') }}
    </div>

    <CrmAddTaskModal
      v-model:open="addTaskOpen"
      :task="editingTask"
      @submit="onSubmitTask"
      @update="onUpdateTask"
    />

    <CrmAddAttachmentModal
      v-model:open="addAttachmentOpen"
      @submit="onAddAttachment"
    />

    <CrmCompanyPreviewModal
      v-model:open="companyPreviewOpen"
      :company-id="prospect?.company_id ?? null"
    />

    <CrmConfirmDeleteModal
      v-model:open="confirmConvertOpen"
      :title="t('crm.prospects.detail.confirmConvertToLeadTitle')"
      :body="t('crm.prospects.detail.confirmConvertToLeadBody', { name: prospect?.name || '' })"
      :confirm-label="t('crm.prospects.detail.confirmConvertToLeadButton')"
      confirm-color="primary"
      @confirm="onConvert"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PROSPECT_STATUS_FORM_OPTIONS, prospectStatusColor, isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.prospects.detail.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const prospectsStore = useProspectsStore()
const leadsStore = useLeadsStore()
const attachmentsStore = useAttachmentsStore()
const activitiesStore = useActivitiesStore()
const prospectSourcesStore = useProspectSourcesStore()
const goBack = useBackNavigation('/crm/prospects')
const { parseTags } = useFormatter()

const prospectId = Number(route.params.id)
const prospect = computed(() => prospectsStore.items.find(p => p.id === prospectId))

onMounted(() => {
  // fetchOne, not fetchAll: this page only ever needs this one Prospect, and
  // fetchAll's 200-row cache (newest-first) can miss an older one entirely.
  if (!prospectsStore.items.some(p => p.id === prospectId)) prospectsStore.fetchOne(prospectId).catch(notifyApiError)
  if (prospectSourcesStore.items.length === 0) prospectSourcesStore.fetchAll().catch(notifyApiError)
  attachmentsStore.fetchForRelated('prospect', prospectId).catch(notifyApiError)
  activitiesStore.fetchForRelated('prospect', prospectId).catch(notifyApiError)
})

const prospectActivity = computed(() => activitiesStore.forRelated('prospect', prospectId))

const prospectAttachments = computed(() => attachmentsStore.forRelated('prospect', prospectId))
const addAttachmentOpen = ref(false)
const companyPreviewOpen = ref(false)

const onAddAttachment = async (payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }) => {
  try {
    if ('file' in payload) {
      await attachmentsStore.addFile('prospect', prospectId, payload.category, payload.file)
    } else {
      await attachmentsStore.addLink('prospect', prospectId, payload.category, payload.fileName, payload.externalUrl)
    }
    success(t('crm.leads.detail.addAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onRemoveAttachment = async (id: number) => {
  try {
    await attachmentsStore.remove(id)
    success(t('crm.leads.detail.removeAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const form = reactive({
  name: prospect.value?.name || '',
  company_id: prospect.value?.company_id ?? null as number | null,
  email: prospect.value?.email || '',
  phone: prospect.value?.phone || '',
  source: prospect.value?.source || '',
  status: prospect.value?.status || 'New',
  assigned_to: prospect.value?.assigned_to ? String(prospect.value.assigned_to) : '',
  tags: prospect.value?.tags?.join(', ') || '',
  notes: prospect.value?.notes || '',
})

// Prospect loads asynchronously (fetched on mount), so the form is
// (re)populated once the record arrives instead of only at setup time.
watch(prospect, (value) => {
  if (!value) return
  form.name = value.name
  form.company_id = value.company_id ?? null
  form.email = value.email
  form.phone = value.phone
  form.source = value.source
  form.status = value.status
  form.assigned_to = value.assigned_to ? String(value.assigned_to) : ''
  form.tags = value.tags?.join(', ') || ''
  form.notes = value.notes
}, { immediate: true })

const { loading, guard } = useSubmitGuard()

const onSave = guard(async () => {
  if (!prospect.value) return
  try {
    await prospectsStore.update(prospect.value.id, {
      name: form.name,
      company_id: form.company_id,
      email: form.email,
      phone: form.phone,
      source: form.source,
      status: form.status as ProspectStatus,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      tags: parseTags(form.tags),
      notes: form.notes,
    })
    success(t('crm.prospects.detail.updateSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})

const { open: confirmConvertOpen, request: requestConvert, close: closeConvertConfirm } = useConfirmGate()

const onConvert = async () => {
  if (!prospect.value) return
  try {
    const { lead } = await prospectsStore.convert(prospect.value.id, {})
    const converted = prospectsStore.items.find(p => p.id === prospect.value!.id)
    if (converted) converted.converted_lead_id = lead.id
    leadsStore.receiveConverted(lead)
    success(t('crm.prospects.detail.convertSuccess'))
    navigateTo(`/crm/leads/${lead.id}`)
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    closeConvertConfirm()
  }
}

const {
  tasks: prospectTasks,
  addTaskOpen,
  editingTask,
  openAddTask,
  openEditTask,
  onSubmitTask,
  onUpdateTask,
  onToggleTask,
  onRemoveTask,
} = useTaskList('prospect', prospectId, 'crm.prospects.detail.addTaskSuccess', 'crm.prospects.detail.editTaskSuccess')
const prospectOverdueTaskCount = computed(() => prospectTasks.value.filter(task => isTaskOverdue(task)).length)
</script>
