<template>
  <div class="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-(--color-light-gray-2) bg-white p-3 shadow-xl">
    <span class="text-sm font-medium text-(--color-black)">
      {{ t('admin.users.index.bulkActionBar.selectedCount', { count: selectedIds.length }) }}
    </span>

    <ButtonPrimary outline small fit-content :label="t('admin.users.index.bulkActionBar.activate')" @click="emit('activate')" />
    <ButtonPrimary outline small fit-content color="error" :label="t('admin.users.index.bulkActionBar.deactivate')" @click="requestDeactivate" />
    <ButtonPrimary cancel small fit-content :label="t('admin.users.index.bulkActionBar.cancel')" @click="emit('cancel')" />

    <CrmConfirmDeleteModal
      v-model:open="deactivateOpen"
      :title="t('admin.users.index.bulkActionBar.deactivateConfirmTitle', { count: selectedIds.length })"
      :body="t('admin.users.index.bulkActionBar.deactivateConfirmBody', { count: selectedIds.length })"
      :confirm-label="t('admin.users.index.bulkActionBar.deactivateConfirmButton')"
      confirm-color="error"
      @confirm="confirmDeactivate"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  selectedIds: number[]
}>()

const emit = defineEmits<{
  activate: []
  deactivate: []
  cancel: []
}>()

const deactivateOpen = ref(false)

const requestDeactivate = () => {
  if (props.selectedIds.length === 0) return
  deactivateOpen.value = true
}

const confirmDeactivate = () => {
  emit('deactivate')
  deactivateOpen.value = false
}
</script>
