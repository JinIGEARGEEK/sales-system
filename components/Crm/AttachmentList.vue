<template>
  <div>
    <div v-if="attachments.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
      {{ t('crm.components.attachmentList.noAttachments') }}
    </div>
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="attachment in attachments"
        :key="attachment.id"
        class="flex items-center gap-3 rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3"
      >
        <UIcon :name="iconFor(attachment)" class="size-5 shrink-0 text-[var(--color-gray)]" />

        <div class="min-w-0 flex-1">
          <a
            v-if="attachment.file_url || attachment.external_url"
            :href="hrefFor(attachment)"
            target="_blank"
            rel="noopener"
            class="truncate text-sm font-medium hover:underline"
          >
            {{ attachment.file_name }}
          </a>
          <p v-else class="truncate text-sm font-medium">{{ attachment.file_name }}</p>
          <p class="truncate text-xs text-[var(--color-gray)]">{{ dateFormat(attachment.created_at) }}</p>
        </div>

        <UBadge color="neutral" variant="subtle" class="shrink-0">{{ t(`crm.components.attachmentList.categories.${categoryKey(attachment.category)}`) }}</UBadge>

        <UTooltip v-if="canDelete(attachment)" :text="t('crm.components.attachmentList.remove')">
          <UButton
            icon="material-symbols:delete-outline"
            variant="ghost"
            color="error"
            size="xs"
            :aria-label="t('crm.components.attachmentList.remove')"
            @click="requestDelete(attachment)"
          />
        </UTooltip>
      </div>
    </div>

    <CrmConfirmDeleteModal
      v-model:open="open"
      :name="target?.file_name || ''"
      @confirm="onConfirmRemove"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { dateFormat } = useFormatter()
const { public: { API_URL } } = useRuntimeConfig()
const { hasRole } = useRole()
const userStore = useUserStore()

defineProps<{
  attachments: Attachment[]
}>()

// Mirrors the backend's DELETE /attachments/:id check exactly — CanWrite(c,
// &attachment.UploadedByID) in internal/handlers/attachments.go: Admin/Sales
// Manager can delete any attachment, anyone else only the one they uploaded.
// Previously the button rendered for every role on every attachment
// (Production included), so most clicks 403'd — this hides it instead.
const canDelete = (attachment: Attachment) => hasRole('Admin', 'Sales Manager') || attachment.uploaded_by === userStore.id

const emit = defineEmits<{
  remove: [id: number]
}>()

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Attachment>()

const onConfirmRemove = () => {
  if (target.value) emit('remove', target.value.id)
  closeDelete()
}

// `file_url` is a relative path (e.g. "/uploads/xxx") returned by the backend —
// resolve it against the API host, same origin the axios plugin's baseURL uses.
const hrefFor = (attachment: Attachment) => attachment.external_url || `${API_URL}${attachment.file_url}`

const categoryKey = (category: AttachmentCategory) => category.toLowerCase()

const iconFor = (attachment: Attachment) => {
  if (attachment.external_url) return 'material-symbols:link'
  if ((attachment.mime_type || '').startsWith('image/')) return 'material-symbols:image-outline'
  if (attachment.mime_type === 'application/pdf') return 'material-symbols:picture-as-pdf-outline'
  return 'material-symbols:description-outline'
}
</script>
