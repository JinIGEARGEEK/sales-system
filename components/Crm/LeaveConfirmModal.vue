<template>
  <!-- Rendered programmatically through Nuxt UI's useOverlay() by
       useUnsavedChangesGuard (not placed in any page template) — the
       OverlayProvider inside <UApp> binds `v-model:open` and listens for
       `close`, which resolves the guard's pending promise. Dismissing via
       Escape/overlay-click resolves it with `undefined`, i.e. "stay". -->
  <UModal
    :title="title || t('global.leaveConfirm.title')"
    :description="description || t('global.unsavedChangesConfirm')"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-3" data-cy="leave-confirm-modal">
        <ButtonPrimary
          :label="t('global.leaveConfirm.stay')"
          cancel
          data-cy="leave-confirm-stay"
          @click="emit('close', false)"
        />
        <ButtonPrimary
          :label="t('global.leaveConfirm.leave')"
          color="error"
          data-cy="leave-confirm-leave"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  title?: string
  description?: string
}>()

const emit = defineEmits<{ close: [leave: boolean] }>()
</script>
