<template>
  <div class="p-5">
    <div v-if="lead">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UButton
            icon="material-symbols:arrow-back"
            variant="ghost"
            color="neutral"
            class="cursor-pointer p-0 hover:bg-transparent"
            @click="navigateTo('/crm/leads')"
          />
          <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ lead.name }}</h2>
          <UBadge color="neutral" variant="subtle">{{ lead.status }}</UBadge>
        </div>
        <ButtonPrimary
          v-if="lead.converted_deal_id"
          :label="t('crm.leads.index.actions.viewDeal')"
          icon="material-symbols:open-in-new"
          @click="navigateTo(`/crm/deals/${lead.converted_deal_id}`)"
        />
        <ButtonPrimary
          v-else-if="lead.status !== 'Disqualified'"
          :label="t('crm.leads.detail.convertToDeal')"
          icon="material-symbols:swap-horiz"
          @click="navigateTo(`/crm/deals/create?lead_id=${lead.id}`)"
        />
      </div>

      <ContainerTemplate>
        <Form @submit="onSave">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputText v-model="form.name" :label="t('crm.leads.detail.fullName')" name="name" rules="required" />
            <InputText v-model="form.company_name" :label="t('crm.leads.detail.companyName')" name="company_name" />
            <InputText v-model="form.email" :label="t('crm.leads.detail.email')" name="email" rules="required" />
            <InputText v-model="form.phone" :label="t('crm.leads.detail.phone')" name="phone" />
            <InputSelect v-model="form.source" :options="LEAD_SOURCE_OPTIONS" :label="t('crm.leads.detail.source')" name="source" rules="required" />
            <InputSelect
              v-model="form.status"
              :options="LEAD_STATUS_FORM_OPTIONS"
              :label="t('crm.leads.detail.status')"
              name="status"
              rules="required"
            />
            <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
            <div class="md:col-span-2">
              <InputTextarea v-model="form.notes" :label="t('crm.leads.detail.notes')" name="notes" />
            </div>
          </div>
          <div class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('crm.leads.detail.saveChanges')" type="submit" />
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
        <CrmAttachmentList :attachments="leadAttachments" @remove="onRemoveAttachment" />
      </ContainerTemplate>

      <CrmAddAttachmentModal
        v-model:open="addAttachmentOpen"
        @submit="onAddAttachment"
      />
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.leads.detail.leadNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LEAD_SOURCE_OPTIONS, LEAD_STATUS_FORM_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.leads.detail.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const leadsStore = useLeadsStore()
const attachmentsStore = useAttachmentsStore()

const leadId = Number(route.params.id)
const lead = computed(() => leadsStore.items.find(l => l.id === leadId))

onMounted(() => {
  if (leadsStore.items.length === 0) leadsStore.fetchAll()
  attachmentsStore.fetchForRelated('lead', leadId)
})

const leadAttachments = computed(() => attachmentsStore.forRelated('lead', leadId))
const addAttachmentOpen = ref(false)

const onAddAttachment = async (payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }) => {
  try {
    if ('file' in payload) {
      await attachmentsStore.addFile('lead', leadId, payload.category, payload.file)
    } else {
      await attachmentsStore.addLink('lead', leadId, payload.category, payload.fileName, payload.externalUrl)
    }
    success(t('crm.leads.detail.addAttachmentSuccess'))
  } catch {
    error(t('global.genericError'))
  }
}

const onRemoveAttachment = async (id: number) => {
  try {
    await attachmentsStore.remove(id)
    success(t('crm.leads.detail.removeAttachmentSuccess'))
  } catch {
    error(t('global.genericError'))
  }
}

const form = reactive({
  name: lead.value?.name || '',
  company_name: lead.value?.company_name || '',
  email: lead.value?.email || '',
  phone: lead.value?.phone || '',
  source: lead.value?.source || '',
  status: lead.value?.status || 'New',
  assigned_to: lead.value?.assigned_to ? String(lead.value.assigned_to) : '',
  notes: lead.value?.notes || '',
})

// Lead loads asynchronously now (fetched on mount), so the form is (re)populated
// once the record arrives instead of only at setup time.
watch(lead, (value) => {
  if (!value) return
  form.name = value.name
  form.company_name = value.company_name
  form.email = value.email
  form.phone = value.phone
  form.source = value.source
  form.status = value.status
  form.assigned_to = value.assigned_to ? String(value.assigned_to) : ''
  form.notes = value.notes
}, { immediate: true })

const onSave = async () => {
  if (!lead.value) return
  try {
    await leadsStore.update(lead.value.id, {
      name: form.name,
      company_name: form.company_name,
      email: form.email,
      phone: form.phone,
      source: form.source as LeadSource,
      status: form.status as LeadStatus,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      notes: form.notes,
    })
    success(t('crm.leads.detail.updateSuccess'))
  } catch {
    error(t('global.genericError'))
  }
}
</script>
