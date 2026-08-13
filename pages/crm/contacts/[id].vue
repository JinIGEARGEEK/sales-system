<template>
  <div class="p-5">
    <div v-if="contact">
      <div class="mb-4 flex items-center gap-3">
        <UButton
          icon="material-symbols:arrow-back"
          variant="ghost"
          color="neutral"
          class="cursor-pointer p-0 hover:bg-transparent"
          @click="navigateTo('/crm/contacts')"
        />
        <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ contact.name }}</h2>
        <UBadge v-for="tag in contact.tags" :key="tag" color="neutral" variant="outline">{{ tag }}</UBadge>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <ContainerTemplate>
            <Form @submit="onSave">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputText v-model="form.name" :label="t('crm.contacts.detail.fullName')" name="name" rules="required" />
                <InputSelect v-model="form.company_id" :options="companyOptions" :label="t('crm.contacts.detail.company')" name="company_id" rules="required" />
                <InputText v-model="form.role_title" :label="t('crm.contacts.detail.roleTitle')" name="role_title" />
                <InputText v-model="form.email" :label="t('crm.contacts.detail.email')" name="email" rules="required" />
                <InputText v-model="form.phone" :label="t('crm.contacts.detail.phone')" name="phone" />
                <InputText v-model="form.tags" :label="t('crm.contacts.detail.tags')" :placeholder="t('crm.contacts.detail.tagsPlaceholder')" name="tags" />
              </div>
              <div class="mt-4 flex gap-3">
                <ButtonPrimary :label="t('crm.contacts.detail.saveChanges')" type="submit" />
                <TableCardLink :items="{ path: `/crm/companies/${contact.company_id}`, label: t('crm.contacts.detail.viewCompany') }" />
              </div>
            </Form>
          </ContainerTemplate>
        </div>

        <div class="lg:col-span-2">
          <UCard class="mb-4">
            <template #header>
              <h3 class="text-base font-semibold">{{ t('crm.contacts.detail.linkedDeals') }}</h3>
            </template>
            <div v-if="linkedDeals.length === 0" class="text-sm text-[var(--color-gray)]">{{ t('crm.contacts.detail.noLinkedDeals') }}</div>
            <div v-else class="flex flex-col gap-2">
              <TableCardLink
                v-for="deal in linkedDeals"
                :key="deal.id"
                :items="{ path: `/crm/deals/${deal.id}`, label: `${deal.title} — ${deal.stage}` }"
              />
            </div>
          </UCard>
          <UCard>
            <template #header>
              <h3 class="text-base font-semibold">{{ t('crm.contacts.detail.activityTitle') }}</h3>
            </template>
            <CrmActivityTimeline :items="contactActivity" />
          </UCard>
        </div>
      </div>
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.contacts.detail.contactNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MOCK_DEALS, MOCK_ACTIVITIES } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.contacts.detail.pageTitle') })

const route = useRoute()
const { success } = useNotify()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()

const contactId = Number(route.params.id)
const contact = computed(() => contactsStore.items.find(c => c.id === contactId))

const companyOptions = computed(() => companiesStore.items.map(c => ({ label: c.name, value: String(c.id) })))

const linkedDeals = computed(() => MOCK_DEALS.filter(d => d.contact_id === contactId))
const contactActivity = computed(() => MOCK_ACTIVITIES.filter(a => a.related_type === 'contact' && a.related_id === contactId))

const form = reactive({
  name: contact.value?.name || '',
  company_id: contact.value ? String(contact.value.company_id) : '',
  role_title: contact.value?.role_title || '',
  email: contact.value?.email || '',
  phone: contact.value?.phone || '',
  tags: contact.value?.tags.join(', ') || '',
})

const onSave = () => {
  if (contact.value) {
    contact.value.name = form.name
    contact.value.company_id = Number(form.company_id)
    contact.value.role_title = form.role_title
    contact.value.email = form.email
    contact.value.phone = form.phone
    contact.value.tags = form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
  }
  success(t('crm.contacts.detail.updateSuccess'))
}
</script>
