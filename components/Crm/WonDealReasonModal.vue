<template>
  <!-- Rendered programmatically through Nuxt UI's useOverlay() by
       useWonDealGuard (not placed in any page template). `close` resolves
       the guard's promise: the trimmed reason, or undefined when dismissed
       (Cancel, Esc, overlay click), which means "don't do it". -->
  <UModal
    :title="t(`crm.deals.wonDeal.reasonModal.title.${action}`)"
    :description="t('crm.deals.wonDeal.reasonModal.description')"
  >
    <template #body>
      <Form ref="formRef" @submit="onConfirm">
        <InputTextarea
          v-model="reason"
          :label="t('crm.deals.wonDeal.reasonModal.label')"
          :placeholder="t('crm.deals.wonDeal.reasonModal.placeholder')"
          name="reason"
          rules="required|max:500"
          rows="3"
          maxlength="500"
          counter
          data-cy="won-deal-reason"
        />
      </Form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-3" data-cy="won-deal-reason-modal">
        <ButtonPrimary :label="t('crm.deals.wonDeal.reasonModal.cancel')" cancel data-cy="won-deal-reason-cancel" @click="emit('close', undefined)" />
        <ButtonPrimary :label="t('crm.deals.wonDeal.reasonModal.confirm')" data-cy="won-deal-reason-confirm" @click="onConfirmClick" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { WonDealAction } from '~/composables/utils/useWonDealGuard'

defineProps<{ action: WonDealAction }>()

const emit = defineEmits<{ close: [reason: string | undefined] }>()

const { t } = useI18n()
const reason = ref('')
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const onConfirm = () => {
  const trimmed = reason.value.trim()
  if (trimmed) emit('close', trimmed)
}

// The footer sits outside the <Form>, so validate by hand (required, ≤ 500
// characters — the API's own cap on ?reason=) before closing with it.
const onConfirmClick = async () => {
  const result = await formRef.value?.validate()
  if (result?.valid) onConfirm()
}
</script>
