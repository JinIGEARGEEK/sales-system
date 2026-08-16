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

        <div class="mt-6">
          <div class="mb-1 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.companies.create.contactsHeading') }}</h3>
            <ButtonPrimary
              :label="t('crm.companies.create.addContact')"
              icon="material-symbols:add"
              outline
              small
              @click="addContactRow"
            />
          </div>
          <p class="mb-3 text-sm text-[var(--color-gray)]">{{ t('crm.companies.create.contactsSubheading') }}</p>

          <p v-if="contacts.length === 0" class="text-sm text-[var(--color-gray)]">{{ t('crm.companies.create.noContacts') }}</p>

          <div v-for="(contact, index) in contacts" :key="contact.key" class="mb-3 rounded-lg border border-[var(--color-light-gray-1)] p-3">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium">{{ t('crm.companies.create.contactRowLabel', { index: index + 1 }) }}</span>
              <UButton
                icon="material-symbols:close"
                variant="ghost"
                color="error"
                size="xs"
                :aria-label="t('crm.companies.create.removeContact')"
                @click="removeContactRow(index)"
              />
            </div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputText
                v-model="contact.name"
                :label="t('crm.contacts.create.fullName')"
                :placeholder="t('crm.contacts.create.fullNamePlaceholder')"
                :name="`contact-name-${contact.key}`"
                rules="required"
              />
              <InputText
                v-model="contact.role_title"
                :label="t('crm.contacts.create.roleTitle')"
                :placeholder="t('crm.contacts.create.roleTitlePlaceholder')"
                :name="`contact-role-${contact.key}`"
              />
              <InputText
                v-model="contact.email"
                :label="t('crm.contacts.create.email')"
                :placeholder="t('crm.contacts.create.emailPlaceholder')"
                :name="`contact-email-${contact.key}`"
              />
              <InputText
                v-model="contact.phone"
                :label="t('crm.contacts.create.phone')"
                :placeholder="t('crm.contacts.create.phonePlaceholder')"
                :name="`contact-phone-${contact.key}`"
              />
            </div>
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
const contactsStore = useContactsStore()

const form = reactive({
  name: '',
  industry: '',
  size: '',
  website: '',
  tags: '',
  status: 'active',
  notes: '',
})

let nextContactKey = 0
const contacts = ref<{ key: number, name: string, role_title: string, email: string, phone: string }[]>([])

const addContactRow = () => {
  contacts.value.push({ key: nextContactKey++, name: '', role_title: '', email: '', phone: '' })
}

const removeContactRow = (index: number) => {
  contacts.value.splice(index, 1)
}

const onSubmit = async () => {
  try {
    const company = await companiesStore.add({
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

    const contactRows = contacts.value.filter(c => c.name.trim())
    const results = await Promise.allSettled(
      contactRows.map(c => contactsStore.add({
        name: c.name,
        company_id: company.id,
        role_title: c.role_title,
        email: c.email,
        phone: c.phone,
        tags: [],
        status: 'active',
        created_at: new Date(),
      })),
    )

    success(t('crm.companies.create.createSuccess'))
    if (results.some(r => r.status === 'rejected')) {
      error(t('crm.companies.create.contactCreateFailed'))
    }
    navigateTo('/crm/companies')
  } catch {
    error(t('global.genericError'))
  }
}
</script>
