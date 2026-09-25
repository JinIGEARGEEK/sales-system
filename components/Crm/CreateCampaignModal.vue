<template>
  <UModal
    :open="open"
    :title="t('crm.components.createCampaignModal.title')"
    :description="t('crm.components.createCampaignModal.description', { count: targets.length })"
    @update:open="onUpdateOpen"
  >
    <template #body>
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
        <ButtonPrimary
          :label="t('crm.components.createCampaignModal.save')"
          :loading="loading"
          :loading-auto="false"
          data-cy="campaign-save-button"
          @click="setupForm?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emitSubmit = useAwaitableEmit<[CampaignTaskSetupSubmitPayload]>('submit')

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

// Creating a campaign fans out into one Task per target, so Save spins until
// the caller's @submit settles (a double click can't create the tasks twice),
// and the modal stays open — keeping what was typed — if the handler reports
// failure by returning `false`.
const { loading, guard } = useSubmitGuard()
const onSubmit = guard(async (payload: CampaignTaskSetupSubmitPayload) => {
  const results = await emitSubmit(payload)
  if (!results.includes(false)) onUpdateOpen(false)
})
</script>
