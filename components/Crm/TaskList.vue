<template>
  <div>
    <div v-if="loading" class="flex flex-col gap-2">
      <USkeleton v-for="i in 5" :key="`task-skeleton-${i}`" class="h-14 w-full rounded-lg" />
    </div>
    <div v-else-if="tasks.length === 0">
      <slot name="empty">
        <div class="py-6 text-center text-sm text-(--color-gray)">
          {{ emptyMessage || t('crm.components.taskList.noTasks') }}
        </div>
      </slot>
    </div>
    <div v-else class="flex flex-col gap-2">
      <div v-if="selectable" class="flex items-center gap-3 px-4 py-1">
        <UCheckbox
          :model-value="isAllSelected"
          :aria-label="t('crm.components.taskList.selectAll')"
          @update:model-value="toggleSelectAll"
        />
        <span class="text-xs text-(--color-gray)">{{ t('crm.components.taskList.selectAll') }}</span>
      </div>
      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex flex-wrap items-center gap-2 rounded-lg border border-(--color-light-gray-2) px-4 py-3"
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
          :loading="busyIds.includes(task.id)"
          data-cy="task-toggle-done"
          @click="onToggleClick(task)"
        />

        <div class="min-w-35 flex-1">
          <button
            type="button"
            class="block w-full text-left"
            :aria-label="t('crm.components.taskList.editTask')"
            @click="emit('edit', task)"
          >
            <p class="truncate text-sm" :class="task.status === 'done' ? 'text-(--color-gray) line-through' : 'font-medium'">
              {{ task.title }}
            </p>
            <p v-if="task.description" class="truncate text-xs text-(--color-gray)">{{ task.description }}</p>
          </button>
          <p class="truncate text-xs text-(--color-gray)">
            <NuxtLink v-if="task.path" :to="task.path" class="hover:underline">{{ task.relatedLabel }}</NuxtLink>
            <span v-if="task.path"> · </span>
            {{ teamMembersStore.nameById(task.assigned_to) }}
          </p>
        </div>
        <UBadge v-if="task.campaignLabel" color="info" variant="subtle" icon="material-symbols:campaign-outline" class="shrink-0">
          {{ task.campaignLabel }}
        </UBadge>
        <UBadge :color="taskPriorityColor(task.priority)" variant="subtle" class="shrink-0">
          {{ t(`crm.components.taskList.priority.${task.priority}`) }}
        </UBadge>
        <!-- Overdue carries an icon and the word too, not only the red colour.
        An open task that's overdue or due today gets a snooze menu on it. -->
        <UDropdownMenu
          v-if="isSnoozable(task)"
          :items="snoozeItems(task)"
          :content="{ align: 'end' }"
        >
          <button
            type="button"
            class="shrink-0 cursor-pointer rounded-md"
            :aria-label="t('crm.components.taskList.snoozeLabel', { date: dateFormat(task.due_date) })"
            :disabled="busyIds.includes(task.id)"
            data-cy="task-snooze-trigger"
          >
            <UBadge
              :color="dueBadgeColor(task)"
              variant="subtle"
              :icon="taskDueBucket(task) === 'overdue' ? 'material-symbols:schedule-outline' : undefined"
              trailing-icon="material-symbols:expand-more"
              data-cy="task-due-badge"
            >
              <template v-if="taskDueBucket(task) === 'overdue'">{{ t('crm.tasks.index.groups.overdue') }} · </template>{{ dateFormat(task.due_date) }}
            </UBadge>
          </button>
        </UDropdownMenu>
        <UBadge
          v-else
          :color="dueBadgeColor(task)"
          variant="subtle"
          class="shrink-0"
          data-cy="task-due-badge"
        >
          {{ dateFormat(task.due_date) }}
        </UBadge>
        <UTooltip :text="t('crm.components.taskList.removeTask')" class="shrink-0">
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
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { taskPriorityColor } from '~/constants/mockData'
import { taskDueBucket } from '~/composables/utils/useTaskGroups'
import { TASK_SNOOZE_OPTIONS } from '~/composables/utils/useTaskQuickActions'

const { t } = useI18n()
const { dateFormat } = useFormatter()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const teamMembersStore = useTeamMembersStore()
const tasksStore = useTasksStore()

// Red only once a pending task is past its due DAY (the same boundary as the
// Tasks page's Overdue group), primary for due today, neutral otherwise.
const dueBadgeColor = (task: Task) => {
  const bucket = taskDueBucket(task)
  if (bucket === 'overdue') return 'error'
  if (bucket === 'today') return 'primary'
  return 'neutral'
}

onMounted(() => {
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
})

const props = defineProps<{
  // Callers that already know how to link back to the related record (e.g. the
  // all-tasks list or the dashboard widget) can enrich tasks with these before
  // passing them in — the detail-page call sites just pass plain Task[].
  tasks: (Task & { relatedLabel?: string, path?: string, campaignLabel?: string })[]
  // Bulk-select checkboxes, used only by the all-tasks page — the per-record
  // Tasks tabs (Deal/Contact/Company detail pages) never pass these.
  selectable?: boolean
  selectedIds?: number[]
  // Only the all-tasks page passes this — the per-record Tasks tabs load
  // their (already-fetched) parent record first, so their own task list is
  // effectively always available by the time this component mounts.
  loading?: boolean
  // Overrides the default "no follow-ups yet" copy — the all-tasks page has
  // its own filters (status/assignee/campaign/...) active by default, so an
  // empty result there usually means "nothing matches your filters", not
  // "this record truly has none", which is what the default copy implies.
  emptyMessage?: string
}>()

const emit = defineEmits<{
  // Emitted after a saved done toggle (or its Undo) or snooze, for a caller
  // that must refresh a server-paged list (the all-tasks page) — the store's
  // cached `items` (the detail pages' Tasks tabs) are updated in place.
  changed: [id: number]
  // Emitted after a successful delete, for a caller that must refresh a
  // server-paged list (the all-tasks page).
  removed: [id: number]
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

// The list runs the delete itself so the success toast only shows once the
// API call has succeeded.
const onConfirmRemove = async () => {
  // ConfirmDeleteModal awaits this handler, so its button spins meanwhile.
  const task = target.value
  if (!task) return closeDelete()
  try {
    await tasksStore.remove(task.id)
    success(t('crm.components.taskList.removeSuccess'))
    emit('removed', task.id)
  } catch (err) {
    notifyApiError(err)
  } finally {
    closeDelete()
  }
}

// Marking done saves at once and toasts an Undo (no confirm); the snooze
// menu moves an open overdue/due-today task's due date (useTaskQuickActions).
const { toggleDone, snooze } = useTaskQuickActions(id => emit('changed', id))

// Rows with a save in flight — blocks a double-click from toggling twice.
const busyIds = ref<number[]>([])

const runBusy = async (id: number, action: () => Promise<unknown>) => {
  if (busyIds.value.includes(id)) return
  busyIds.value = [...busyIds.value, id]
  try {
    await action()
  } finally {
    busyIds.value = busyIds.value.filter(busyId => busyId !== id)
  }
}

const onToggleClick = (task: Task) => runBusy(task.id, () => toggleDone(task))

const isSnoozable = (task: Task) => ['overdue', 'today'].includes(taskDueBucket(task))

const snoozeItems = (task: Task) => [
  [{ type: 'label' as const, label: t('crm.components.taskList.snoozeMenuTitle') }],
  TASK_SNOOZE_OPTIONS.map(option => ({
    label: t(`crm.components.taskList.snooze.${option}`),
    icon: 'material-symbols:snooze-outline',
    onSelect: () => runBusy(task.id, () => snooze(task, option)),
  })),
]
</script>
