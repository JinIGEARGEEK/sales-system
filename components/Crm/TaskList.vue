<template>
  <div>
    <div v-if="tasks.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
      {{ t('crm.components.taskList.noTasks') }}
    </div>
    <div v-else class="flex flex-col gap-2">
      <div v-if="selectable" class="flex items-center gap-3 px-4 py-1">
        <UCheckbox
          :model-value="isAllSelected"
          :aria-label="t('crm.components.taskList.selectAll')"
          @update:model-value="toggleSelectAll"
        />
        <span class="text-xs text-[var(--color-gray)]">{{ t('crm.components.taskList.selectAll') }}</span>
      </div>
      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex items-center gap-3 rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3"
      >
        <UCheckbox
          v-if="selectable"
          :model-value="selectedIds.includes(task.id)"
          :aria-label="t('crm.components.taskList.selectTask')"
          @update:model-value="toggleSelect(task.id)"
        />
        <UButton
          :icon="task.status === 'done' ? 'material-symbols:check-circle' : 'material-symbols:radio-button-unchecked'"
          :label="t(task.status === 'done' ? 'crm.components.taskList.markPending' : 'crm.components.taskList.markDone')"
          :color="task.status === 'done' ? 'success' : 'neutral'"
          variant="subtle"
          size="xs"
          class="shrink-0"
          @click="onToggleClick(task)"
        />

        <div class="min-w-0 flex-1">
          <button
            type="button"
            class="block w-full text-left"
            :aria-label="t('crm.components.taskList.editTask')"
            @click="emit('edit', task)"
          >
            <p class="truncate text-sm" :class="task.status === 'done' ? 'text-[var(--color-gray)] line-through' : 'font-medium'">
              {{ task.title }}
            </p>
            <p v-if="task.description" class="truncate text-xs text-[var(--color-gray)]">{{ task.description }}</p>
          </button>
          <p class="truncate text-xs text-[var(--color-gray)]">
            <NuxtLink v-if="task.path" :to="task.path" class="hover:underline">{{ task.relatedLabel }}</NuxtLink>
            <span v-if="task.path"> · </span>
            {{ teamMembersStore.nameById(task.assigned_to) }}
          </p>
        </div>
        <UBadge :color="taskPriorityColor(task.priority)" variant="subtle" class="shrink-0">
          {{ t(`crm.components.taskList.priority.${task.priority}`) }}
        </UBadge>
        <UBadge :color="isTaskOverdue(task) ? 'error' : 'neutral'" variant="subtle" class="shrink-0">
          {{ dateFormat(task.due_date) }}
        </UBadge>
        <UTooltip :text="t('crm.components.taskList.removeTask')">
          <UButton
            icon="material-symbols:delete-outline"
            variant="ghost"
            color="error"
            size="xs"
            :aria-label="t('crm.components.taskList.removeTask')"
            @click="requestDelete(task)"
          />
        </UTooltip>
      </div>
    </div>

    <CrmConfirmDeleteModal
      v-model:open="open"
      :name="target?.title || ''"
      @confirm="onConfirmRemove"
    />

    <CrmConfirmDeleteModal
      v-model:open="confirmDoneOpen"
      :title="t('crm.components.taskList.confirmDoneTitle')"
      :body="t('crm.components.taskList.confirmDoneBody', { title: taskPendingDone?.title || '' })"
      :confirm-label="t('crm.components.taskList.confirmDoneButton')"
      confirm-color="success"
      @confirm="onConfirmDone"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isTaskOverdue, taskPriorityColor } from '~/constants/mockData'

const { t } = useI18n()
const { dateFormat } = useFormatter()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const props = defineProps<{
  // Callers that already know how to link back to the related record (e.g. the
  // all-tasks list or the dashboard widget) can enrich tasks with these before
  // passing them in — the detail-page call sites just pass plain Task[].
  tasks: (Task & { relatedLabel?: string, path?: string })[]
  // Bulk-select checkboxes, used only by the all-tasks page — the per-record
  // Tasks tabs (Deal/Contact/Company detail pages) never pass these.
  selectable?: boolean
  selectedIds?: number[]
}>()

const emit = defineEmits<{
  toggle: [id: number]
  remove: [id: number]
  edit: [task: Task]
  'update:selectedIds': [ids: number[]]
}>()

const selectedIds = computed(() => props.selectedIds ?? [])

const toggleSelect = (id: number) => {
  const next = selectedIds.value.includes(id)
    ? selectedIds.value.filter(selectedId => selectedId !== id)
    : [...selectedIds.value, id]
  emit('update:selectedIds', next)
}

const isAllSelected = computed(() => props.tasks.length > 0 && props.tasks.every(task => selectedIds.value.includes(task.id)))

const toggleSelectAll = () => {
  emit('update:selectedIds', isAllSelected.value ? [] : props.tasks.map(task => task.id))
}

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Task>()

const onConfirmRemove = () => {
  if (target.value) {
    emit('remove', target.value.id)
    success(t('crm.components.taskList.removeSuccess'))
  }
  closeDelete()
}

// Only confirm the pending -> done transition — reverting a done task back to
// pending is low-stakes and shouldn't need a dialog in the way. Reuses the
// same generic open/target confirm-flow as the delete flow above.
const { open: confirmDoneOpen, target: taskPendingDone, requestDelete: requestDoneConfirm, closeDelete: closeDoneConfirm } = useDeleteConfirm<Task>()

const onToggleClick = (task: Task) => {
  if (task.status === 'done') {
    emit('toggle', task.id)
    return
  }
  requestDoneConfirm(task)
}

const onConfirmDone = () => {
  if (taskPendingDone.value) emit('toggle', taskPendingDone.value.id)
  closeDoneConfirm()
}
</script>
