<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.createCampaignModal.title') }}</h3>
    </template>
    <template #body>
      <p class="mb-3 text-sm text-[var(--color-gray)]">
        {{ t('crm.components.createCampaignModal.description', { count: companyIds.length }) }}
      </p>
      <CrmCampaignTaskSetupForm
        ref="setupForm"
        :active="open"
        :company-ids="companyIds"
        :company-names="companyNames"
        @submit="onSubmit"
      />
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.createCampaignModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.createCampaignModal.save')" data-cy="campaign-save-button" @click="setupForm?.submit()" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  open: boolean
  // Ids/names of the currently-selected Companies this campaign's Tasks
  // will be created against — the caller (Companies list page) owns the
  // actual selection; this modal just wires them into the shared
  // CampaignTaskSetupForm for its live count + review preview.
  companyIds: number[]
  companyNames: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }]
}>()

const setupForm = ref<{ submit: () => void } | null>(null)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = (payload: { name: string, title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }) => {
  emit('submit', payload)
  onUpdateOpen(false)
}
</script>
