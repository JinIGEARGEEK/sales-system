<template>
  <!-- `title` prop (not a custom #header slot) so the dialog has an
  accessible name: Reka wires it up as DialogTitle / aria-labelledby. -->
  <UModal :open="open" :title="modalTitle" @update:open="emit('update:open', $event)">
    <template #body>
      <p class="text-sm text-center">
        <template v-if="body">{{ body }}</template>
        <i18n-t v-else-if="name" :keypath="restorable ? 'crm.components.confirmDeleteModal.trashBody' : 'crm.components.confirmDeleteModal.confirmBody'" tag="span">
          <template #name><strong>{{ name }}</strong></template>
        </i18n-t>
        <template v-else>{{ restorable ? t('crm.components.confirmDeleteModal.trashBodyFallback') : t('crm.components.confirmDeleteModal.confirmBodyFallback') }}</template>
      </p>
      <p
        v-if="restorable"
        class="mt-2 flex items-center justify-center gap-1 text-xs text-(--color-gray)"
        data-cy="confirm-delete-restorable-hint"
      >
        <UIcon name="material-symbols:restore-from-trash-outline" class="size-4 shrink-0" />
        {{ t('crm.components.confirmDeleteModal.trashHint') }}
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="cancelLabel || t('crm.components.confirmDeleteModal.cancel')" cancel @click="emit('update:open', false)" />
        <ButtonPrimary ref="confirmButtonRef" :label="modalConfirmLabel" :color="confirmColor" data-cy="confirm-delete-confirm" @click="onConfirm" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const instance = getCurrentInstance()

const props = withDefaults(defineProps<{
  open: boolean
  // Default copy asks "delete <name>?" — pass `body` to override with a
  // fully custom question for non-delete confirmations (e.g. marking done).
  name?: string
  title?: string
  body?: string
  cancelLabel?: string
  confirmLabel?: string
  confirmColor?: 'error' | 'success' | 'primary' | 'secondary' | 'info' | 'warning' | 'neutral'
  // The record is soft-deleted (Deals, Leads, Companies, Contacts) and can
  // be restored from /admin/trash — swaps the default "cannot be undone"
  // copy for "Move to Trash" wording plus a hint that an Admin/Sales
  // Manager can restore it. An explicit title/body/confirmLabel still wins.
  restorable?: boolean
}>(), {
  name: '',
  title: undefined,
  body: undefined,
  cancelLabel: undefined,
  confirmLabel: undefined,
  confirmColor: 'error',
  restorable: false,
})

const modalTitle = computed(() => props.title
  || (props.restorable ? t('crm.components.confirmDeleteModal.trashTitle') : t('crm.components.confirmDeleteModal.title')))
const modalConfirmLabel = computed(() => props.confirmLabel
  || (props.restorable ? t('crm.components.confirmDeleteModal.moveToTrash') : t('crm.components.confirmDeleteModal.delete')))

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

// Focus the confirm button whenever the modal opens so a keyboard/Enter-key
// user can confirm without reaching for the mouse — matches native dialog
// expectations (Enter activates the focused/default action).
const confirmButtonRef = useTemplateRef<{ $el: HTMLElement }>('confirmButtonRef')
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  nextTick(() => confirmButtonRef.value?.$el?.focus())
})

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
