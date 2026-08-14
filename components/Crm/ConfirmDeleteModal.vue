<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #header>
      <h3 class="text-lg font-medium">{{ title || t('crm.components.confirmDeleteModal.title') }}</h3>
    </template>
    <template #body>
      <p class="text-sm">
        <template v-if="body">{{ body }}</template>
        <template v-else>
          {{ t('crm.components.confirmDeleteModal.confirmQuestion') }} <strong>{{ name }}</strong>?
          {{ t('crm.components.confirmDeleteModal.cannotBeUndone') }}
        </template>
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="cancelLabel || t('crm.components.confirmDeleteModal.cancel')" cancel @click="emit('update:open', false)" />
        <ButtonPrimary :label="confirmLabel || t('crm.components.confirmDeleteModal.delete')" :color="confirmColor" @click="emit('confirm')" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

withDefaults(defineProps<{
  open: boolean
  // Default copy asks "delete <name>?" — pass `body` to override with a
  // fully custom question for non-delete confirmations (e.g. marking done).
  name?: string
  title?: string
  body?: string
  cancelLabel?: string
  confirmLabel?: string
  confirmColor?: 'error' | 'success' | 'primary' | 'secondary' | 'info' | 'warning' | 'neutral'
}>(), {
  name: '',
  title: undefined,
  body: undefined,
  cancelLabel: undefined,
  confirmLabel: undefined,
  confirmColor: 'error',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>
