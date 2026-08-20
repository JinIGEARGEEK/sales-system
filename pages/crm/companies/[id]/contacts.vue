<template>
  <ContainerTemplate>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold">{{ t('crm.companies.detail.contactsHeading') }}</h3>
      <ButtonPrimary :label="t('crm.companies.detail.addContact')" icon="material-symbols:add" small @click="navigateTo(`/crm/contacts/create?company_id=${companyId}`)" />
    </div>
    <div v-if="companyContacts.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
      {{ t('crm.companies.detail.noContacts') }}
    </div>
    <div v-else class="flex flex-col gap-2">
      <NuxtLink
        v-for="contact in companyContacts"
        :key="contact.id"
        :to="`/crm/contacts/${contact.id}`"
        class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
      >
        <div>
          <p class="text-sm font-medium">{{ contact.name }}</p>
          <p class="text-xs text-[var(--color-gray)]">{{ contact.role_title }} · {{ contact.email }}</p>
        </div>
        <UIcon name="material-symbols:chevron-right" class="size-5 text-[var(--color-gray)]" />
      </NuxtLink>
    </div>
  </ContainerTemplate>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const { notifyApiError } = useApiErrorNotifier()
const contactsStore = useContactsStore()

const companyId = Number(route.params.id)

onMounted(() => {
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
})

const companyContacts = computed(() => contactsStore.byCompany(companyId))
</script>
