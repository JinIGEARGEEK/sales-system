<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('crm.tasks.index.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.tasks.index.subheading') }}</p>
      </div>
      <ButtonPrimary
        :label="selectionMode ? t('crm.tasks.index.cancelSelectMode') : t('crm.tasks.index.enterSelectMode')"
        :outline="!selectionMode"
        icon="material-symbols:checklist"
        small
        @click="toggleSelectionMode"
      />
    </div>

    <UCard class="mb-4">
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex-1">
          <InputText v-model="search" :placeholder="t('crm.tasks.index.searchPlaceholder')" name="search" />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect v-model="statusFilter" :options="TASK_STATUS_FILTER_OPTIONS" name="statusFilter" />
        </div>
        <div class="w-full sm:w-48">
          <InputSelect v-model="assigneeFilter" :options="TEAM_MEMBER_FILTER_OPTIONS" name="assigneeFilter" />
        </div>
      </div>
    </UCard>

    <UCard v-if="selectionMode && selectedIds.length > 0" class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium">{{ t('crm.tasks.index.selectedCount', { count: selectedIds.length }) }}</span>
        <ButtonPrimary :label="t('crm.tasks.index.bulkMarkDone')" outline small @click="onBulkMarkDone" />
        <div class="w-48">
          <InputSelect v-model="bulkAssignee" :options="BULK_ASSIGN_OPTIONS" :placeholder="t('crm.tasks.index.reassignPlaceholder')" name="bulkAssignee" />
        </div>
        <ButtonPrimary :label="t('crm.tasks.index.bulkReassign')" outline small :disabled="!bulkAssignee" @click="onBulkReassign" />
        <UButton :label="t('crm.tasks.index.clearSelection')" variant="ghost" color="neutral" size="xs" @click="selectedIds = []" />
      </div>
    </UCard>

    <ContainerTemplate>
      <div v-if="filteredTasks.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.tasks.index.noTasksMatch') }}
      </div>
      <CrmTaskList
        v-else
        :tasks="filteredTasks"
        :selectable="selectionMode"
        :selected="selectedIds"
        @update:selected="selectedIds = $event"
        @toggle="onToggleTask"
        @edit="openEditTask"
        @remove="onRemoveTask"
      />
    </ContainerTemplate>

    <CrmAddTaskModal
      v-model:open="editTaskOpen"
      :task="editingTask"
      @submit="onSubmitTask"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TEAM_MEMBER_FILTER_OPTIONS, TASK_STATUS_FILTER_OPTIONS, matchesAssigneeFilter, isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.tasks.index.pageTitle') })

const { success } = useNotify()
const tasksStore = useTasksStore()
const { resolveRelated } = useRelatedRecord()

const search = ref('')
const statusFilter = ref('pending')
const assigneeFilter = ref('all')

// Reassignment target excludes the "All Team Members" filter option — only a
// specific member or "Unassigned" makes sense as something to assign *to*.
const BULK_ASSIGN_OPTIONS = TEAM_MEMBER_FILTER_OPTIONS.slice(1)

const filteredTasks = computed(() => {
  const now = Date.now()
  return tasksStore.items
    .map(task => ({ ...task, ...resolveRelated(task.related_type, task.related_id) }))
    .filter((task) => {
      const matchSearch = !search.value
        || task.title.toLowerCase().includes(search.value.toLowerCase())
        || task.relatedLabel.toLowerCase().includes(search.value.toLowerCase())
      const matchStatus = statusFilter.value === 'all' || task.status === statusFilter.value
      const matchAssignee = matchesAssigneeFilter(task.assigned_to, assigneeFilter.value)
      return matchSearch && matchStatus && matchAssignee
    })
    .sort((a, b) => {
      const overdueDiff = Number(isTaskOverdue(b, now)) - Number(isTaskOverdue(a, now))
      return overdueDiff !== 0 ? overdueDiff : a.due_date.getTime() - b.due_date.getTime()
    })
})

// This page only edits existing tasks — creating one requires attaching it to a
// specific deal/contact/company, which happens from that record's own Tasks tab.
const editTaskOpen = ref(false)
const editingTask = ref<Task | null>(null)

const openEditTask = (task: Task) => {
  editingTask.value = task
  editTaskOpen.value = true
}

const onSubmitTask = (payload: { title: string, due_date: Date, assigned_to: number | null }) => {
  if (!editingTask.value) return
  tasksStore.update(editingTask.value.id, payload)
  success(t('crm.tasks.index.editTaskSuccess'))
}

const onToggleTask = (id: number) => tasksStore.toggleDone(id)
const onRemoveTask = (id: number) => tasksStore.remove(id)

// Bulk-select is opt-in: the row checkboxes only appear once a rep explicitly
// asks for them, so the default view stays a single, unambiguous done-toggle
// per row (matching the deal/company/contact Tasks tabs).
const selectionMode = ref(false)
const selectedIds = ref<number[]>([])
const bulkAssignee = ref('')

const toggleSelectionMode = () => {
  // Only exiting select mode needs to clear the selection — selectedIds can
  // only become non-empty while selectionMode is true, so it's already empty
  // by the time a rep turns select mode back on.
  if (selectionMode.value) selectedIds.value = []
  selectionMode.value = !selectionMode.value
}

// Drop any selected task that a filter change just hid — bulk actions should
// only ever touch what the rep can currently see.
watch(filteredTasks, (tasks) => {
  const visibleIds = new Set(tasks.map(task => task.id))
  selectedIds.value = selectedIds.value.filter(id => visibleIds.has(id))
})

const onBulkMarkDone = () => {
  success(t('crm.tasks.index.bulkMarkDoneSuccess', { count: selectedIds.value.length }))
  tasksStore.markDone(selectedIds.value)
  selectedIds.value = []
}

const onBulkReassign = () => {
  if (!bulkAssignee.value) return
  tasksStore.reassign(selectedIds.value, bulkAssignee.value === 'unassigned' ? null : Number(bulkAssignee.value))
  success(t('crm.tasks.index.bulkReassignSuccess', { count: selectedIds.value.length }))
  selectedIds.value = []
  bulkAssignee.value = ''
}
</script>
