<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.contacts.create.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.contacts.create.subheading') }}</p>
    </div>

    <ContainerTemplate>
      <Form @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InputText
            v-model="form.name"
            :label="t('crm.contacts.create.fullName')"
            :placeholder="t('crm.contacts.create.fullNamePlaceholder')"
            name="name"
            rules="required"
          />
          <InputSelect
            v-model="form.company_id"
            :options="companyOptions"
            :label="t('crm.contacts.create.company')"
            :placeholder="t('crm.contacts.create.companyPlaceholder')"
            name="company_id"
            rules="required"
          />
          <InputText
            v-model="form.role_title"
            :label="t('crm.contacts.create.roleTitle')"
            :placeholder="t('crm.contacts.create.roleTitlePlaceholder')"
            name="role_title"
          />
          <InputText
            v-model="form.email"
            :label="t('crm.contacts.create.email')"
            :placeholder="t('crm.contacts.create.emailPlaceholder')"
            name="email"
          />
          <InputText
            v-model="form.phone"
            :label="t('crm.contacts.create.phone')"
            :placeholder="t('crm.contacts.create.phonePlaceholder')"
            name="phone"
          />
          <InputText
            v-model="form.tags"
            :label="t('crm.contacts.create.tags')"
            :placeholder="t('crm.contacts.create.tagsPlaceholder')"
            name="tags"
          />
        </div>

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.contacts.create.createContact')" type="submit" />
          <ButtonPrimary :label="t('crm.contacts.create.cancel')" cancel @click="navigateTo('/crm/contacts')" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({ title: t('crm.contacts.create.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const { parseTags } = useFormatter()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()

onMounted(() => {
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
})

const companyOptions = computed(() => companiesStore.items.map(c => ({ label: c.name, value: String(c.id) })))

const form = reactive({
  name: '',
  company_id: (route.query.company_id as string) || '',
  role_title: '',
  email: '',
  phone: '',
  tags: '',
})

const onSubmit = async () => {
  try {
    await contactsStore.add({
      name: form.name,
      company_id: Number(form.company_id),
      role_title: form.role_title,
      email: form.email,
      phone: form.phone,
      tags: parseTags(form.tags),
      status: 'active',
      created_at: new Date(),
    })
    success(t('crm.contacts.create.createSuccess'))
    navigateTo('/crm/contacts')
  } catch {
    error(t('global.genericError'))
  }
}
</script>
