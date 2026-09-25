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
const emitConfirm = useAwaitableEmit<[LostReason]>('confirm')
const reason = ref('')
watch(() => props.open, (isOpen) => { if (isOpen) reason.value = '' })

// Stays open with a spinner until the caller's @confirm (the actual stage
// move) settles, ignoring re-clicks so a double click can't move twice.
const { loading, guard } = useSubmitGuard()
const onConfirm = guard(async () => {
  if (!reason.value) return
  await emitConfirm(reason.value as LostReason)
  emit('update:open', false)
})
</script>
