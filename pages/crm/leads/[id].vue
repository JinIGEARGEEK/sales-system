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
          v-if="lead.status !== 'Disqualified'"
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
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.leads.detail.leadNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MOCK_LEADS, LEAD_SOURCE_OPTIONS, LEAD_STATUS_FORM_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.leads.detail.pageTitle') })

const route = useRoute()
const { success } = useNotify()

const leadId = Number(route.params.id)
const lead = MOCK_LEADS.find(l => l.id === leadId)

const form = reactive({
  name: lead?.name || '',
  company_name: lead?.company_name || '',
  email: lead?.email || '',
  phone: lead?.phone || '',
  source: lead?.source || '',
  status: lead?.status || 'New',
  assigned_to: lead?.assigned_to ? String(lead.assigned_to) : '',
  notes: lead?.notes || '',
})

const onSave = () => {
  success(t('crm.leads.detail.updateSuccess'))
}
</script>
