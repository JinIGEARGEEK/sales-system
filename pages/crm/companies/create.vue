<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.companies.create.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.companies.create.subheading') }}</p>
    </div>

    <ContainerTemplate>
      <Form @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InputText
            v-model="form.name"
            :label="t('crm.companies.create.companyName')"
            :placeholder="t('crm.companies.create.companyNamePlaceholder')"
            name="name"
            rules="required"
          />
          <InputSelect
            v-model="form.industry"
            :options="INDUSTRY_OPTIONS"
            :label="t('crm.companies.create.industry')"
            :placeholder="t('crm.companies.create.industryPlaceholder')"
            name="industry"
            rules="required"
          />
          <InputText
            v-model="form.size"
            :label="t('crm.companies.create.companySize')"
            :placeholder="t('crm.companies.create.companySizePlaceholder')"
            name="size"
          />
          <InputText
            v-model="form.website"
            :label="t('crm.companies.create.website')"
            :placeholder="t('crm.companies.create.websitePlaceholder')"
            name="website"
          />
          <InputText
            v-model="form.tags"
            :label="t('crm.companies.create.tags')"
            :placeholder="t('crm.companies.create.tagsPlaceholder')"
            name="tags"
          />
          <InputSelect
            v-model="form.status"
            :options="COMPANY_STATUS_FORM_OPTIONS"
            :label="t('crm.companies.create.status')"
            :placeholder="t('crm.companies.create.statusPlaceholder')"
            name="status"
            rules="required"
          />
          <div class="md:col-span-2">
            <InputTextarea
              v-model="form.notes"
              :label="t('crm.companies.create.notes')"
              :placeholder="t('crm.companies.create.notesPlaceholder')"
              name="notes"
            />
          </div>
        </div>

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.companies.create.createCompany')" type="submit" />
          <ButtonPrimary :label="t('crm.companies.create.cancel')" cancel @click="navigateTo('/crm/companies')" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { INDUSTRY_OPTIONS, COMPANY_STATUS_FORM_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.companies.create.pageTitle') })

const { success, error } = useNotify()
const { parseTags } = useFormatter()
const companiesStore = useCompaniesStore()

const form = reactive({
  name: '',
  industry: '',
  size: '',
  website: '',
  tags: '',
  status: 'active',
  notes: '',
})

const onSubmit = async () => {
  try {
    await companiesStore.add({
      name: form.name,
      industry: form.industry,
      size: form.size,
      website: form.website,
      tags: parseTags(form.tags),
      notes: form.notes,
      status: form.status as ActiveArchivedStatus,
      created_at: new Date(),
      updated_at: new Date(),
    })
    success(t('crm.companies.create.createSuccess'))
    navigateTo('/crm/companies')
  } catch {
    error(t('global.genericError'))
  }
}
</script>
