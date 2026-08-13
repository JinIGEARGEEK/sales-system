<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.confirmDeleteModal.title') }}</h3>
    </template>
    <template #body>
      <p class="text-sm">
        {{ t('crm.components.confirmDeleteModal.confirmQuestion') }} <strong>{{ name }}</strong>?
        {{ t('crm.components.confirmDeleteModal.cannotBeUndone') }}
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.confirmDeleteModal.cancel')" outline @click="emit('update:open', false)" />
        <ButtonPrimary :label="t('crm.components.confirmDeleteModal.delete')" color="error" @click="emit('confirm')" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  open: boolean
  name: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>
