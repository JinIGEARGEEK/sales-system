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
          @click="goBack()"
        />
        <h2 class="text-xl font-black">{{ t('crm.leads.create.heading') }}</h2>
      </div>
      <p class="text-sm text-(--color-gray)">{{ t('crm.leads.create.subheading') }}</p>
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
            <span class="text-(--color-gray)"> — {{ dup.email }}</span>
          </li>
        </ul>
      </template>
    </UAlert>

    <ContainerTemplate>
      <Form @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InputText v-model="form.name" :label="t('crm.leads.create.fullName')" :placeholder="t('crm.leads.create.fullNamePlaceholder')" name="name" rules="required" />
          <InputCompanySelect
            v-model="form.company_id"
            :label="t('crm.leads.create.companyName')"
            :placeholder="t('crm.leads.create.companyNamePlaceholder')"
            name="company_id"
          />
          <InputText v-model="form.email" :label="t('crm.leads.create.email')" :placeholder="t('crm.leads.create.emailPlaceholder')" name="email" />
          <InputText v-model="form.phone" :label="t('crm.leads.create.phone')" :placeholder="t('crm.leads.create.phonePlaceholder')" name="phone" />
          <InputSelect v-model="form.source" :options="leadSourcesStore.activeOptions" :label="t('crm.leads.create.source')" :placeholder="t('crm.leads.create.sourcePlaceholder')" name="source" rules="required" />
          <template v-if="form.source === 'Referral'">
            <InputSelect
              v-model="form.referred_by_type"
              :options="REFERRAL_TYPE_OPTIONS"
              :label="t('crm.leads.create.referredByTypeLabel')"
              :placeholder="t('crm.leads.create.referredByTypePlaceholder')"
              name="referred_by_type"
            />
            <InputCompanySelect
              v-if="form.referred_by_type === 'company'"
              v-model="referredById"
              :label="t('crm.leads.create.referredByLabel')"
              :placeholder="t('crm.leads.create.referredByPlaceholder')"
              name="referred_by_id"
            />
            <InputAsyncSelect
              v-else-if="form.referred_by_type === 'contact'"
              v-model="referredById"
              :search="searchContacts"
              :resolve-selected="resolveContact"
              :label="t('crm.leads.create.referredByLabel')"
              :placeholder="t('crm.leads.create.referredByPlaceholder')"
              name="referred_by_id"
            />
          </template>
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
          <div class="grid grid-cols-1 gap-3 rounded-lg border border-sky-300 bg-sky-50 p-3 md:col-span-2 md:grid-cols-2">
            <InputSelect
              v-model="form.business_unit"
              :options="BUSINESS_UNIT_OPTIONS"
              :label="t('crm.leads.create.businessUnit')"
              :placeholder="t('crm.leads.create.businessUnitPlaceholder')"
              name="business_unit"
            />
            <CrmBusinessUnitItemField
              v-if="form.business_unit"
              v-model="form.business_unit_item"
              :business-unit="form.business_unit"
              :company-id="form.company_id"
              :options="businessUnitItemOptions"
              early-stage
            />
          </div>
          <div class="md:col-span-2">
            <InputTextarea v-model="form.notes" :label="t('crm.leads.create.notes')" :placeholder="t('crm.leads.create.notesPlaceholder')" name="notes" />
          </div>
        </div>

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.leads.create.createLead')" type="submit" :loading="loading" />
          <ButtonPrimary :label="t('crm.leads.create.cancel')" cancel @click="goBack()" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LEAD_STATUS_FORM_OPTIONS, findDuplicateLeads, BUSINESS_UNIT_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.leads.create.pageTitle') })

const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const leadsStore = useLeadsStore()
const leadSourcesStore = useLeadSourcesStore()
const goBack = useBackNavigation('/crm/leads')

onMounted(() => {
  if (leadsStore.items.length === 0) leadsStore.fetchAll().catch(notifyApiError)
  if (leadSourcesStore.items.length === 0) leadSourcesStore.fetchAll().catch(notifyApiError)
  // Companies aren't fetched here — InputCompanySelect below loads its own
  // options and handles creating a new Company on demand.
})

const form = reactive({
  name: '',
  company_id: null as number | null,
  email: '',
  phone: '',
  source: '',
  status: 'New',
  assigned_to: '',
  business_unit: '' as BusinessUnit | '',
  business_unit_item: '',
  notes: '',
  referred_by_type: '',
  referred_by_id: '',
})

const REFERRAL_TYPE_OPTIONS: Select[] = [
  { label: t('crm.leads.create.referredByTypeCompany'), value: 'company' },
  { label: t('crm.leads.create.referredByTypeContact'), value: 'contact' },
]

const { searchContacts, resolveContact, referredById } = useReferralPicker(form)

// The "Referred By" fields are only shown while source === 'Referral' (see
// template) — clear them if the rep picks a referrer, then changes their
// mind about the source, so a stale referrer can't silently persist against
// a non-referral Lead.
watch(() => form.source, (source) => {
  if (source !== 'Referral') {
    form.referred_by_type = ''
    form.referred_by_id = ''
  }
})

const businessUnitItemOptions = useBusinessUnitItemOptions(
  toRef(form, 'business_unit'),
  toRef(form, 'company_id'),
  toRef(form, 'business_unit_item'),
)

const duplicateLeads = computed(() => findDuplicateLeads(leadsStore.items, form.email, form.phone))

const { markClean } = useUnsavedChangesGuard(() => form)

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async () => {
  try {
    await leadsStore.add({
      name: form.name,
      company_id: form.company_id,
      email: form.email,
      phone: form.phone,
      source: form.source as LeadSource,
      status: form.status as LeadStatus,
      notes: form.notes,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      business_unit: form.business_unit || null,
      business_unit_item: form.business_unit_item || null,
      referred_by_type: (form.referred_by_type || null) as 'company' | 'contact' | null,
      referred_by_id: form.referred_by_id ? Number(form.referred_by_id) : null,
      converted_deal_id: null,
      created_at: new Date(),
    })
    success(t('crm.leads.create.createSuccess'))
    markClean()
    navigateTo('/crm/leads')
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
</script>
