<template>
  <div class="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-(--color-light-gray-2) bg-white p-3 shadow-xl">
    <span class="text-sm font-medium text-(--color-black)">
      {{ t('admin.users.index.bulkActionBar.selectedCount', { count: selectedIds.length }) }}
    </span>

    <ButtonPrimary outline small fit-content :label="t('admin.users.index.bulkActionBar.activate')" @click="emit('activate')" />
    <ButtonPrimary
      outline
      small
      fit-content
      color="error"
      :label="t('admin.users.index.bulkActionBar.deactivate')"
      :disabled="selfSelected"
      :title="selfSelected ? t('admin.users.errors.selfInSelection') : undefined"
      @click="requestDeactivate"
    />
    <span v-if="selfSelected" class="text-xs text-(--color-gray)" data-cy="user-bulk-self-hint">{{ t('admin.users.errors.selfInSelection') }}</span>
    <ButtonPrimary cancel small fit-content :label="t('admin.users.index.bulkActionBar.cancel')" @click="emit('cancel')" />

    <CrmConfirmDeleteModal
      v-model:open="deactivateOpen"
      :title="t('admin.users.index.bulkActionBar.deactivateConfirmTitle', { count: selectedIds.length })"
      :body="t('admin.users.index.bulkActionBar.deactivateConfirmBody', { count: selectedIds.length })"
      :confirm-label="t('admin.users.index.bulkActionBar.deactivateConfirmButton')"
      confirm-color="error"
      @confirm="confirmDeactivate"
    >
      <AdminReassignRecordsSelect v-model="reassignTo" :exclude-ids="selectedIds" />
    </CrmConfirmDeleteModal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { KEEP_RECORDS } from '~/composables/utils/useUserRecordsReassign'

const { t } = useI18n()

const props = defineProps<{
  selectedIds: number[]
  // The signed-in Admin's own row is in the selection — the API refuses
  // deactivating yourself (422 on `ids`), so Deactivate is disabled.
  selfSelected?: boolean
}>()

const emit = defineEmits<{
  activate: []
  // reassignTo: who receives every deactivated user's open records.
  deactivate: [reassignTo: number | undefined]
  cancel: []
}>()

const { toReassignTo } = useUserRecordsReassign()
const deactivateOpen = ref(false)
const reassignTo = ref(KEEP_RECORDS)

const requestDeactivate = () => {
  if (props.selectedIds.length === 0 || props.selfSelected) return
  reassignTo.value = KEEP_RECORDS
  deactivateOpen.value = true
}

const confirmDeactivate = () => {
  emit('deactivate', toReassignTo(reassignTo.value))
  deactivateOpen.value = false
}
</script>
