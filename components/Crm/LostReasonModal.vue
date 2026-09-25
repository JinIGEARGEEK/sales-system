<template>
  <!-- `title` (not a custom #header slot) so the dialog gets an accessible
  name — a screen reader announces the question, not just "dialog". -->
  <UModal :open="open" :title="t('crm.components.lostReasonModal.title')" @update:open="emit('update:open', $event)">
    <template #body>
      <InputSelect
        v-model="reason"
        :options="LOST_REASON_OPTIONS"
        :label="t('crm.components.lostReasonModal.label')"
        name="lostReason"
        data-cy="lost-reason-select"
      />
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.lostReasonModal.cancel')" cancel @click="emit('update:open', false)" />
        <ButtonPrimary
          color="error"
          :label="t('crm.components.lostReasonModal.confirm')"
          :disabled="!reason"
          :loading="loading"
          :loading-auto="false"
          data-cy="lost-reason-confirm"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOST_REASON_OPTIONS } from '~/constants/mockData'

// Asks why a Deal was lost before it moves into a Lost stage — shared by the
// Overview Pipeline's side panel and the Deals Kanban drag, since the reason
// is what a review wants to know about a loss and a quick-move wouldn't
// otherwise record one. The caller does the move on `confirm`; closing
// without confirming means the move doesn't happen.
const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [reason: LostReason]
}>()

const { t } = useI18n()
const instance = getCurrentInstance()
const reason = ref('')
watch(() => props.open, (isOpen) => { if (isOpen) reason.value = '' })

// Keeps the modal open with a spinner until the caller's (possibly async)
// @confirm handler — the actual stage move — settles, and ignores re-clicks
// meanwhile so a double click can't send the move twice. emit() never
// returns the listener's promise, so the raw listener is called off the
// vnode instead (same approach as ConfirmDeleteModal).
const { loading, guard } = useSubmitGuard()
const onConfirm = guard(async () => {
  if (!reason.value) return
  const value = reason.value as LostReason
  const handler = instance?.vnode.props?.onConfirm as ((reason: LostReason) => unknown) | undefined
  if (handler) await handler(value)
  else emit('confirm', value)
  emit('update:open', false)
})
</script>
