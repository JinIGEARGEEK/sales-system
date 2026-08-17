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
        <ButtonPrimary :label="confirmLabel || t('crm.components.confirmDeleteModal.delete')" :color="confirmColor" @click="onConfirm" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const instance = getCurrentInstance()

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

// NOTE: Vue's emit() always returns `undefined` at runtime — it never forwards
// the bound listener's return value — so `await emit('confirm')` would be a
// silent no-op and this button's loadingAuto spinner (and re-click guard)
// would never actually track the caller's async confirmDelete() work.
// Instead, call the raw `onConfirm` listener straight off the vnode props
// (bypassing emit()'s void-returning wrapper) so its real promise is awaited
// here, with zero changes needed at any of the ~15+ call sites.
const onConfirm = async () => {
  const handler = instance?.vnode.props?.onConfirm as (() => unknown) | undefined
  const result = handler?.()
  if (result && typeof (result as Promise<unknown>)?.then === 'function') {
    await result
  }
}
</script>
