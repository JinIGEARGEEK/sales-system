<template>
  <div class="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-light-gray-2)] bg-white p-3 shadow-xl">
    <span class="text-sm font-medium text-[var(--color-black)]">
      {{ t('crm.tasks.index.selectedCount', { count: selectedIds.length }) }}
    </span>

    <ButtonPrimary outline small fit-content color="success" :label="t('crm.tasks.index.bulkMarkDone')" @click="emit('markDone')" />

    <UPopover v-model:open="reassignOpen">
      <ButtonPrimary outline small fit-content :label="t('crm.tasks.index.bulkReassign')" />
      <template #content>
        <div class="flex w-64 flex-col gap-3 p-3">
          <InputSelect
            v-model="reassignTo"
            name="bulkReassignTo"
            :options="teamMembersStore.filterOptions.filter(o => o.value !== 'all')"
            :placeholder="t('crm.tasks.index.reassignPlaceholder')"
          />
          <ButtonPrimary small block :label="t('crm.tasks.index.bulkReassign')" @click="applyReassign" />
        </div>
      </template>
    </UPopover>

    <ButtonPrimary cancel small fit-content :label="t('crm.tasks.index.clearSelection')" @click="emit('cancel')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  selectedIds: number[]
}>()

const emit = defineEmits<{
  markDone: []
  reassign: [assignedTo: number | null]
  cancel: []
}>()

const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const reassignOpen = ref(false)
const reassignTo = ref<string | null>(null)

const applyReassign = () => {
  if (props.selectedIds.length === 0 || reassignTo.value === null) return
  const assignedTo = reassignTo.value === 'unassigned' ? null : Number(reassignTo.value)
  emit('reassign', assignedTo)
  reassignOpen.value = false
  reassignTo.value = null
}
</script>
