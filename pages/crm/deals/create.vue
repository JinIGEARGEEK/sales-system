<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('crm.deals.create.heading') }}</h2>
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
          <InputSelect v-model="form.stage" :options="pipelineStagesStore.activeOptions" :label="t('crm.deals.create.stage')" :placeholder="t('crm.deals.create.stagePlaceholder')" name="stage" rules="required" />
          <InputDatePicker v-model="form.expected_close_date" :label="t('crm.deals.create.expectedCloseDate')" name="expected_close_date" />
          <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
          <InputSelect
            v-model="form.business_unit"
            :options="BUSINESS_UNIT_OPTIONS"
            :label="t('crm.deals.create.businessUnit')"
            :placeholder="t('crm.deals.create.businessUnitPlaceholder')"
            name="business_unit"
          />
          <InputSelect
            v-if="form.business_unit"
            v-model="form.business_unit_item"
            :options="businessUnitItemOptions"
            :label="form.business_unit === 'Project' ? t('crm.deals.create.project') : t('crm.deals.create.product')"
            :placeholder="t('crm.deals.create.businessUnitItemPlaceholder')"
            name="business_unit_item"
          />
        </div>

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.deals.create.createDeal')" type="submit" :loading="loading" />
          <ButtonPrimary :label="t('crm.deals.create.cancel')" cancel @click="navigateTo('/crm/deals')" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BUSINESS_UNIT_OPTIONS, findDuplicateDeals, dealStatusForStage, stageDefaultProbability } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.deals.create.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const leadsStore = useLeadsStore()
const dealsStore = useDealsStore()
const projectsStore = useProjectsStore()
const productsStore = useProductsStore()
const pipelineStagesStore = usePipelineStagesStore()

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (contactsStore.items.length === 0) contactsStore.fetchAll()
  if (leadsStore.items.length === 0) leadsStore.fetchAll()
  if (dealsStore.items.length === 0) dealsStore.fetchAll()
  if (projectsStore.items.length === 0) projectsStore.fetchAll()
  if (productsStore.items.length === 0) productsStore.fetchAll()
  if (pipelineStagesStore.items.length === 0) pipelineStagesStore.fetchAll()
})

// leadsStore.items is fetched asynchronously (onMounted), so on a fresh page
// load (e.g. a direct/bookmarked URL, or a hard refresh) it's still empty at
// setup time — this must stay reactive rather than a one-time lookup, or a
// direct load would silently miss that this Deal originates from a Lead.
const originatingLead = computed(() => route.query.lead_id
  ? leadsStore.items.find(l => l.id === Number(route.query.lead_id))
  : null)

const companyOptions = computed(() => companiesStore.items.map(c => ({ label: c.name, value: String(c.id) })))
const contactOptions = computed(() => contactsStore.byCompany(form.company_id).map(c => ({ label: c.name, value: String(c.id) })))

const form = reactive({
  title: '',
  company_id: (route.query.company_id as string) || '',
  contact_id: '',
  value: 0,
  stage: 'Lead',
  expected_close_date: '',
  assigned_to: '',
  business_unit: '' as BusinessUnit | '',
  business_unit_item: '',
})

watch(originatingLead, (lead) => {
  if (lead && !form.title) form.title = `${lead.company_name} — New Opportunity`
}, { immediate: true })

const businessUnitItemOptions = useBusinessUnitItemOptions(
  toRef(form, 'business_unit'),
  computed(() => Number(form.company_id) || null),
)

// Switching business unit (or company) invalidates whichever item was picked
// under the old context.
watch([() => form.business_unit, () => form.company_id], () => {
  form.business_unit_item = ''
})

const duplicateDeals = computed(() => findDuplicateDeals(dealsStore.items, form.company_id, form.contact_id))

// A contact picked before switching companies would otherwise belong to the
// wrong company and get submitted anyway — clear it so the field always
// reflects only the currently-selected company's contacts.
watch(() => form.company_id, () => {
  form.contact_id = ''
})

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async () => {
  try {
    // Shared by both branches below — only company_id/contact_id/status/
    // lead_id differ between a plain create and a Lead-originated one.
    const dealFields = {
      title: form.title,
      value: form.value,
      stage: form.stage as DealStage,
      expected_close_date: form.expected_close_date ? new Date(form.expected_close_date) : null,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      channel: 'Other' as LeadSource,
      business_unit: form.business_unit || null,
      business_unit_item: form.business_unit_item || null,
      probability: stageDefaultProbability(form.stage),
      lost_reason: null,
    }

    if (originatingLead.value) {
      // Route this through the same conversion endpoint the pipeline board's
      // drag-to-convert uses, so the Lead actually gets marked converted
      // (converted_deal_id set) instead of just creating an unrelated Deal
      // that happens to reference it — POST /deals has no idea Leads exist.
      const { deal } = await leadsStore.convert(originatingLead.value.id, {
        company_id: Number(form.company_id),
        contact_id: Number(form.contact_id) || undefined,
        deal: dealFields,
      })
      const convertedLead = leadsStore.items.find(l => l.id === originatingLead.value!.id)
      if (convertedLead) convertedLead.converted_deal_id = deal.id
      dealsStore.receiveConverted(deal)
    } else {
      await dealsStore.add({
        ...dealFields,
        company_id: Number(form.company_id),
        contact_id: Number(form.contact_id) || 0,
        status: dealStatusForStage(form.stage as DealStage),
        lead_id: null,
        created_at: new Date(),
      })
    }
    success(t('crm.deals.create.createSuccess'))
    navigateTo('/crm/deals')
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
</script>
