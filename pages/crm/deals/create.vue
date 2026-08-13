<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.deals.create.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.deals.create.subheading') }}</p>
    </div>

    <UAlert
      v-if="duplicateDeals.length > 0"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="material-symbols:warning-outline"
      :title="t('crm.deals.create.duplicateWarningTitle')"
    >
      <template #description>
        <p>{{ t('crm.deals.create.duplicateWarningBody') }}</p>
        <ul class="mt-2 list-disc pl-5">
          <li v-for="dup in duplicateDeals" :key="dup.id">
            <NuxtLink :to="`/crm/deals/${dup.id}`" class="font-medium hover:underline">{{ dup.title }}</NuxtLink>
            <span class="text-[var(--color-gray)]"> — {{ dup.stage }}</span>
          </li>
        </ul>
      </template>
    </UAlert>

    <ContainerTemplate>
      <Form @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InputText v-model="form.title" :label="t('crm.deals.create.dealTitle')" :placeholder="t('crm.deals.create.dealTitlePlaceholder')" name="title" rules="required" />
          <InputSelect v-model="form.company_id" :options="companyOptions" :label="t('crm.deals.create.company')" :placeholder="t('crm.deals.create.companyPlaceholder')" name="company_id" rules="required" />
          <InputSelect v-model="form.contact_id" :options="contactOptions" :label="t('crm.deals.create.primaryContact')" :placeholder="t('crm.deals.create.primaryContactPlaceholder')" name="contact_id" />
          <InputText v-model.number="form.value" :label="t('crm.deals.create.dealValue')" :placeholder="t('crm.deals.create.dealValuePlaceholder')" name="value" type="number" rules="required" />
          <InputSelect v-model="form.stage" :options="DEAL_STAGE_OPTIONS" :label="t('crm.deals.create.stage')" :placeholder="t('crm.deals.create.stagePlaceholder')" name="stage" rules="required" />
          <InputDatePicker v-model="form.expected_close_date" :label="t('crm.deals.create.expectedCloseDate')" name="expected_close_date" />
          <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
        </div>

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.deals.create.createDeal')" type="submit" />
          <ButtonPrimary :label="t('crm.deals.create.cancel')" outline @click="navigateTo('/crm/deals')" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DEAL_STAGE_OPTIONS, findDuplicateDeals, dealStatusForStage } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.deals.create.pageTitle') })

const route = useRoute()
const { success } = useNotify()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const leadsStore = useLeadsStore()
const dealsStore = useDealsStore()

const originatingLead = route.query.lead_id ? leadsStore.items.find(l => l.id === Number(route.query.lead_id)) : null

const companyOptions = computed(() => companiesStore.items.map(c => ({ label: c.name, value: String(c.id) })))
const contactOptions = computed(() => contactsStore.items.map(c => ({ label: c.name, value: String(c.id) })))

const form = reactive({
  title: originatingLead ? `${originatingLead.company_name} — New Opportunity` : '',
  company_id: (route.query.company_id as string) || '',
  contact_id: '',
  value: 0,
  stage: 'Lead',
  expected_close_date: '',
  assigned_to: '',
})

const duplicateDeals = computed(() => findDuplicateDeals(dealsStore.items, form.company_id, form.contact_id))

const onSubmit = () => {
  dealsStore.add({
    company_id: Number(form.company_id),
    contact_id: Number(form.contact_id) || 0,
    title: form.title,
    value: form.value,
    stage: form.stage as DealStage,
    status: dealStatusForStage(form.stage as DealStage),
    expected_close_date: form.expected_close_date ? new Date(form.expected_close_date) : null,
    assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
    channel: 'Other',
    business_unit: null,
    business_unit_item: null,
    created_at: new Date(),
  })
  success(t('crm.deals.create.createSuccess'))
  navigateTo('/crm/deals')
}
</script>
