<template>
  <div>
    <div v-if="tasks.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
      {{ t('crm.components.taskList.noTasks') }}
    </div>
    <div v-else class="flex flex-col gap-2">
      <div v-if="selectable" class="flex items-center gap-2 px-1">
        <UCheckbox
          :model-value="allSelected"
          :indeterminate="someSelected && !allSelected"
          @update:model-value="toggleSelectAll"
        />
        <span class="text-xs text-[var(--color-gray)]">{{ t('crm.components.taskList.selectAll') }}</span>
      </div>

      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex items-center gap-3 rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3"
      >
        <UTooltip v-if="selectable" :text="t('crm.components.taskList.selectTask')">
          <UCheckbox
            :model-value="(selected || []).includes(task.id)"
            @update:model-value="toggleSelected(task.id)"
          />
        </UTooltip>

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
            {{ teamMemberNameById(task.assigned_to) }}
          </p>
        </div>
        <UBadge :color="isTaskOverdue(task) ? 'error' : 'neutral'" variant="subtle" class="shrink-0">
          {{ dateFormat(task.due_date) }}
        </UBadge>
        <UTooltip :text="t('crm.components.taskList.editTask')">
          <UButton
            icon="material-symbols:edit-outline"
            variant="ghost"
            color="neutral"
            size="xs"
            :aria-label="t('crm.components.taskList.editTask')"
            @click="emit('edit', task)"
          />
        </UTooltip>
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
import { teamMemberNameById, isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()
const { dateFormat } = useFormatter()
const { success } = useNotify()

const props = defineProps<{
  // Callers that already know how to link back to the related record (e.g. the
  // all-tasks list or the dashboard widget) can enrich tasks with these before
  // passing them in — the detail-page call sites just pass plain Task[].
  tasks: (Task & { relatedLabel?: string, path?: string })[]
  // Row-selection checkboxes, for callers that offer bulk actions (e.g. the
  // all-tasks list, gated behind its own "Select" mode toggle) — omitted
  // entirely by the per-record detail-page call sites.
  selectable?: boolean
  selected?: number[]
}>()

const emit = defineEmits<{
  toggle: [id: number]
  edit: [task: Task]
  remove: [id: number]
  'update:selected': [ids: number[]]
}>()

const toggleSelected = (id: number) => {
  const current = props.selected || []
  emit('update:selected', current.includes(id) ? current.filter(x => x !== id) : [...current, id])
}

const allSelected = computed(() => props.tasks.length > 0 && props.tasks.every(task => (props.selected || []).includes(task.id)))
const someSelected = computed(() => (props.selected || []).length > 0)

const toggleSelectAll = () => {
  emit('update:selected', allSelected.value ? [] : props.tasks.map(task => task.id))
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
