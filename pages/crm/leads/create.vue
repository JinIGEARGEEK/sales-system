<template>
  <div class="p-5">
    <div class="mb-4">
      <div class="flex items-center gap-3">
        <UButton
          icon="material-symbols:arrow-back"
          variant="ghost"
          color="neutral"
          class="cursor-pointer p-0 hover:bg-transparent"
          :aria-label="t('global.back')"
          @click="navigateTo('/crm/leads')"
        />
        <h2 class="text-xl font-black">{{ t('crm.leads.create.heading') }}</h2>
      </div>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.leads.create.subheading') }}</p>
    </div>

    <UAlert
      v-if="duplicateLeads.length > 0"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="material-symbols:warning-outline"
      :title="t('crm.leads.create.duplicateWarningTitle')"
    >
      <template #description>
        <p>{{ t('crm.leads.create.duplicateWarningBody') }}</p>
        <ul class="mt-2 list-disc pl-5">
          <li v-for="dup in duplicateLeads" :key="dup.id">
            <NuxtLink :to="`/crm/leads/${dup.id}`" class="font-medium hover:underline">{{ dup.name }}</NuxtLink>
            <span class="text-[var(--color-gray)]"> — {{ dup.email }}</span>
          </li>
        </ul>
      </template>
    </UAlert>

    <ContainerTemplate>
      <Form @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InputText v-model="form.name" :label="t('crm.leads.create.fullName')" :placeholder="t('crm.leads.create.fullNamePlaceholder')" name="name" rules="required" />
          <InputText v-model="form.company_name" :label="t('crm.leads.create.companyName')" :placeholder="t('crm.leads.create.companyNamePlaceholder')" name="company_name" />
          <InputText v-model="form.email" :label="t('crm.leads.create.email')" :placeholder="t('crm.leads.create.emailPlaceholder')" name="email" rules="required" />
          <InputText v-model="form.phone" :label="t('crm.leads.create.phone')" :placeholder="t('crm.leads.create.phonePlaceholder')" name="phone" />
          <InputSelect v-model="form.source" :options="leadSourcesStore.activeOptions" :label="t('crm.leads.create.source')" :placeholder="t('crm.leads.create.sourcePlaceholder')" name="source" rules="required" />
          <InputSelect
            v-model="form.status"
            :options="LEAD_STATUS_FORM_OPTIONS"
            :label="t('crm.leads.create.status')"
            :placeholder="t('crm.leads.create.statusPlaceholder')"
            name="status"
            rules="required"
          />
          <CrmTeamMemberSelect
            v-model="form.assigned_to"
            name="assigned_to"
            :placeholder="t('crm.leads.create.assignedToPlaceholder')"
          />
          <div class="md:col-span-2">
            <InputTextarea v-model="form.notes" :label="t('crm.leads.create.notes')" :placeholder="t('crm.leads.create.notesPlaceholder')" name="notes" />
          </div>
        </div>

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.leads.create.createLead')" type="submit" :loading="loading" />
          <ButtonPrimary :label="t('crm.leads.create.cancel')" cancel @click="navigateTo('/crm/leads')" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LEAD_STATUS_FORM_OPTIONS, findDuplicateLeads } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.leads.create.pageTitle') })

const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const leadsStore = useLeadsStore()
const leadSourcesStore = useLeadSourcesStore()

onMounted(() => {
  if (leadsStore.items.length === 0) leadsStore.fetchAll().catch(notifyApiError)
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll().catch(notifyApiError)
})

const form = reactive({
  name: '',
  company_name: '',
  email: '',
  phone: '',
  source: '',
  status: 'New',
  assigned_to: '',
  notes: '',
})

const duplicateLeads = computed(() => findDuplicateLeads(leadsStore.items, form.email, form.phone))

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async () => {
  try {
    await leadsStore.add({
      name: form.name,
      company_name: form.company_name,
      email: form.email,
      phone: form.phone,
      source: form.source as LeadSource,
      status: form.status as LeadStatus,
      notes: form.notes,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      converted_deal_id: null,
      created_at: new Date(),
    })
    success(t('crm.leads.create.createSuccess'))
    navigateTo('/crm/leads')
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
</script>
