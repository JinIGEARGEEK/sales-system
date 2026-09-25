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
import { getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const instance = getCurrentInstance()

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

// Creating a campaign fans out into one Task per target, which can take a
// moment — so keep the modal open with a spinner on Save until the caller's
// async @submit handler (useCampaignTargeting's onSubmitCampaign) settles,
// and ignore re-clicks meanwhile so a double click can't create the
// campaign's tasks twice. emit() never returns the listener's promise, so
// call the raw listener off the vnode (same approach as ConfirmDeleteModal).
const { loading, guard } = useSubmitGuard()
const onSubmit = guard(async (payload: CampaignTaskSetupSubmitPayload) => {
  const handler = instance?.vnode.props?.onSubmit as ((payload: CampaignTaskSetupSubmitPayload) => unknown) | undefined
  if (handler) await handler(payload)
  else emit('submit', payload)
  onUpdateOpen(false)
})
</script>
