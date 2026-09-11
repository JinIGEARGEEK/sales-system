<template>
  <UModal :open="open" :close="false" :dismissible="false" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('admin.apiKeys.index.revealTitle') }}</h3>
    </template>
    <template #body>
      <div class="flex flex-col gap-3">
        <UAlert
          color="warning"
          variant="subtle"
          icon="material-symbols:warning-outline"
          :title="t('admin.apiKeys.index.revealWarning')"
        />
        <div class="flex items-center gap-2 rounded-lg bg-(--color-light-gray-1) p-3">
          <code class="min-w-0 flex-1 truncate text-sm">{{ apiKey }}</code>
          <UButton
            icon="material-symbols:content-copy-outline"
            variant="soft"
            color="neutral"
            size="xs"
            :aria-label="t('admin.apiKeys.index.copy')"
            @click="onCopy"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <ButtonPrimary :label="t('admin.apiKeys.index.revealDone')" @click="onUpdateOpen(false)" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { success, error } = useNotify()

const props = defineProps<{
  open: boolean
  // The raw key, shown exactly once — the caller discards it the moment
  // this modal closes; nothing here can fetch it again afterward.
  apiKey: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.apiKey)
    success(t('admin.apiKeys.index.copySuccess'))
  } catch {
    error(t('admin.apiKeys.index.copyFailed'))
  }
}
</script>
