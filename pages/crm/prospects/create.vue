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
        <h2 class="text-xl font-black">{{ t('crm.prospects.create.heading') }}</h2>
      </div>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.prospects.create.subheading') }}</p>
    </div>

    <UAlert
      v-if="duplicateProspects.length > 0"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="material-symbols:warning-outline"
      :title="t('crm.prospects.create.duplicateWarningTitle')"
    >
      <template #description>
        <p>{{ t('crm.prospects.create.duplicateWarningBody') }}</p>
        <ul class="mt-2 list-disc pl-5">
          <li v-for="dup in duplicateProspects" :key="dup.id">
            <NuxtLink :to="`/crm/prospects/${dup.id}`" class="font-medium hover:underline">{{ dup.name }}</NuxtLink>
            <span class="text-[var(--color-gray)]"> — {{ dup.email }}</span>
          </li>
        </ul>
      </template>
    </UAlert>

    <ContainerTemplate>
      <Form @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InputText v-model="form.name" :label="t('crm.prospects.create.fullName')" :placeholder="t('crm.prospects.create.fullNamePlaceholder')" name="name" rules="required" />
          <InputCompanySelect
            v-model="form.company_id"
            :label="t('crm.prospects.create.companyName')"
            :placeholder="t('crm.prospects.create.companyNamePlaceholder')"
            name="company_id"
          />
          <InputText v-model="form.email" :label="t('crm.prospects.create.email')" :placeholder="t('crm.prospects.create.emailPlaceholder')" name="email" />
          <InputText v-model="form.phone" :label="t('crm.prospects.create.phone')" :placeholder="t('crm.prospects.create.phonePlaceholder')" name="phone" />
          <InputSelect v-model="form.source" :options="prospectSourcesStore.activeOptions" :label="t('crm.prospects.create.source')" :placeholder="t('crm.prospects.create.sourcePlaceholder')" name="source" rules="required" />
          <InputSelect
            v-model="form.status"
            :options="PROSPECT_STATUS_FORM_OPTIONS"
            :label="t('crm.prospects.create.status')"
            :placeholder="t('crm.prospects.create.statusPlaceholder')"
            name="status"
            rules="required"
          />
          <CrmTeamMemberSelect
            v-model="form.assigned_to"
            name="assigned_to"
            :placeholder="t('crm.prospects.create.assignedToPlaceholder')"
          />
          <div class="md:col-span-2">
            <InputTextarea v-model="form.notes" :label="t('crm.prospects.create.notes')" :placeholder="t('crm.prospects.create.notesPlaceholder')" name="notes" />
          </div>
        </div>

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.prospects.create.createProspect')" type="submit" :loading="loading" />
          <ButtonPrimary :label="t('crm.prospects.create.cancel')" cancel @click="goBack()" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PROSPECT_STATUS_FORM_OPTIONS, findDuplicateProspects } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.prospects.create.pageTitle') })

const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const prospectsStore = useProspectsStore()
const prospectSourcesStore = useProspectSourcesStore()
const goBack = useBackNavigation('/crm/prospects')

onMounted(() => {
  if (prospectsStore.items.length === 0) prospectsStore.fetchAll().catch(notifyApiError)
  if (prospectSourcesStore.items.length === 0) prospectSourcesStore.fetchAll().catch(notifyApiError)
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
  notes: '',
})

const duplicateProspects = computed(() => findDuplicateProspects(prospectsStore.items, form.email, form.phone))

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async () => {
  try {
    await prospectsStore.add({
      name: form.name,
      company_id: form.company_id,
      email: form.email,
      phone: form.phone,
      source: form.source,
      status: form.status as ProspectStatus,
      notes: form.notes,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      converted_lead_id: null,
      created_at: new Date(),
    })
    success(t('crm.prospects.create.createSuccess'))
    navigateTo('/crm/prospects')
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
</script>
