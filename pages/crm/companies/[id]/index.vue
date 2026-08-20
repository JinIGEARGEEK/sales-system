<template>
  <div v-if="company" class="grid grid-cols-1 gap-4 lg:grid-cols-5">
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
            <InputText v-model="form.legal_name" :label="t('crm.companies.detail.legalName')" name="legal_name" />
            <InputText v-model="form.tax_id" :label="t('crm.companies.detail.taxId')" name="tax_id" />
            <div class="md:col-span-2">
              <InputTextarea v-model="form.address" :label="t('crm.companies.detail.address')" name="address" />
            </div>
            <div class="md:col-span-2">
              <InputTextarea v-model="form.notes" :label="t('crm.companies.detail.notes')" name="notes" />
            </div>
          </div>
          <div class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('crm.companies.detail.saveChanges')" type="submit" :loading="loading" />
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
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { INDUSTRY_OPTIONS, COMPANY_STATUS_FORM_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

const { priceFormatCompact, parseTags } = useFormatter()
const { lastContactInfo } = useLastContact()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const dealsStore = useDealsStore()
const activitiesStore = useActivitiesStore()

const { companyId, company } = useCurrentCompany()

onMounted(() => {
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  activitiesStore.fetchForRelated('company', companyId).catch(notifyApiError)
})

const companyContacts = computed(() => contactsStore.byCompany(companyId))
const companyDeals = computed(() => dealsStore.items.filter(d => d.company_id === companyId))
const { openDeals, openValue: openDealsValue } = useDealMetrics(() => companyDeals.value)
const companyActivity = computed(() => activitiesStore.forRelated('company', companyId))
const lastContact = computed(() => {
  const dates = companyActivity.value.map(a => a.created_at)
  const latest = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
  return lastContactInfo(latest)
})

const form = reactive({
  name: company.value?.name || '',
  industry: company.value?.industry || '',
  size: company.value?.size || '',
  website: company.value?.website || '',
  tags: company.value?.tags.join(', ') || '',
  status: company.value?.status || 'active',
  legal_name: company.value?.legal_name || '',
  address: company.value?.address || '',
  tax_id: company.value?.tax_id || '',
  notes: company.value?.notes || '',
})

// Company loads asynchronously now (fetched on mount by the parent
// [id].vue), so the form is (re)populated once the record arrives instead of
// only at setup time.
watch(company, (value) => {
  if (!value) return
  form.name = value.name
  form.industry = value.industry
  form.size = value.size
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
</script>
