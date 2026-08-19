<template>
  <div>
    <div v-if="tasks.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
      {{ t('crm.components.taskList.noTasks') }}
    </div>
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex items-center gap-3 rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3"
      >
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
          <p class="truncate text-sm" :class="task.status === 'done' ? 'text-[var(--color-gray)] line-through' : 'font-medium'">
            {{ task.title }}
          </p>
          <p class="truncate text-xs text-[var(--color-gray)]">
            <NuxtLink v-if="task.path" :to="task.path" class="hover:underline">{{ task.relatedLabel }}</NuxtLink>
            <span v-if="task.path"> · </span>
            {{ teamMembersStore.nameById(task.assigned_to) }}
          </p>
        </div>
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
import { isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()
const { dateFormat } = useFormatter()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

defineProps<{
  // Callers that already know how to link back to the related record (e.g. the
  // all-tasks list or the dashboard widget) can enrich tasks with these before
  // passing them in — the detail-page call sites just pass plain Task[].
  tasks: (Task & { relatedLabel?: string, path?: string })[]
}>()

const emit = defineEmits<{
  toggle: [id: number]
  remove: [id: number]
}>()

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
