<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.createCampaignModal.title') }}</h3>
    </template>
    <template #body>
      <p class="mb-3 text-sm text-[var(--color-gray)]">
        {{ t('crm.components.createCampaignModal.description', { count: targets.length }) }}
      </p>
      <CrmCampaignTaskSetupForm
        ref="setupForm"
        :active="open"
        :targets="targets"
        :type-options="typeOptions"
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
  // The currently-selected targets (Company/Lead/Contact rows, one or many)
  // this campaign's Tasks will be created against — the caller (a list
  // page's bulk-selection or a single row/detail-page action) owns the
  // actual selection; this modal just wires them into the shared
  // CampaignTaskSetupForm for its live count + review preview.
  targets: CampaignTarget[]
  // Which CampaignType values a new campaign from here may use — see
  // CampaignTaskSetupForm's own doc.
  typeOptions: CampaignType[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: CampaignTaskSetupSubmitPayload]
}>()

const setupForm = ref<{ submit: () => void } | null>(null)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = (payload: CampaignTaskSetupSubmitPayload) => {
  emit('submit', payload)
  onUpdateOpen(false)
}
</script>
