<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.tasks.index.heading') }}</h2>
        <p class="text-sm text-[var(--color-gray)]">{{ t('crm.tasks.index.subheading') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <ButtonPrimary
          outline
          :label="isSelectMode ? t('crm.tasks.index.cancelSelectMode') : t('crm.tasks.index.enterSelectMode')"
          :disabled="!isSelectMode && filteredTasks.length === 0"
          @click="toggleSelectMode"
        />
        <ButtonPrimary
          :label="t('crm.tasks.index.addTask')"
          icon="material-symbols:add"
          @click="openAddTask"
        />
      </div>
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
          <InputSelect v-model="assigneeFilter" :options="teamMembersStore.filterOptions" name="assigneeFilter" />
        </div>
        <div class="w-full sm:w-48">
          <InputSelect
            v-model="businessUnitFilter"
            :options="BUSINESS_UNIT_FILTER_OPTIONS"
            :placeholder="t('crm.tasks.index.filterBusinessUnit')"
            name="businessUnitFilter"
          />
        </div>
      </div>
    </UCard>

    <ContainerTemplate>
      <div v-if="filteredTasks.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.tasks.index.noTasksMatch') }}
      </div>
      <CrmTaskList
        v-else
        :tasks="filteredTasks"
        :selectable="isSelectMode"
        :selected-ids="selectedIds"
        @toggle="onToggleTask"
        @remove="onRemoveTask"
        @edit="openEditTask"
        @update:selected-ids="selectedIds = $event"
      />
    </ContainerTemplate>

    <CrmTaskBulkActionBar
      v-if="selectedIds.length > 0"
      :selected-ids="selectedIds"
      @mark-done="onBulkMarkDone"
      @reassign="onBulkReassign"
      @cancel="selectedIds = []"
    />

    <CrmAddTaskModal
      v-model:open="addTaskOpen"
      show-related-picker
      :task="editingTask"
      @submit="onSubmitTask"
      @update="onUpdateTask"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_STATUS_FILTER_OPTIONS, matchesAssigneeFilter, isTaskOverdue, BUSINESS_UNIT_FILTER_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.tasks.index.pageTitle') })

const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const tasksStore = useTasksStore()
const teamMembersStore = useTeamMembersStore()
const dealsStore = useDealsStore()
const { resolveRelated } = useRelatedRecord()

onMounted(() => {
  if (tasksStore.items.length === 0) tasksStore.fetchAll().catch(notifyApiError)
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  // Needed both to resolve each task's relatedLabel/path below and to back
  // the Business Unit filter, which reads the linked Deal's business_unit.
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
})

const search = ref('')
const statusFilter = ref('pending')
const assigneeFilter = ref('all')
const businessUnitFilter = ref('all')

// Business Unit filters by the *linked Deal's* business_unit — Tasks have no
// business_unit of their own (they only ever relate to a Deal/Contact/
// Company, api-system-spec.md §7.6). A task related to a Contact/Company
// (no Deal at all) can't match a specific Business Unit and is excluded once
// this filter is anything but "all".
const matchesBusinessUnit = (task: Task) => {
  if (businessUnitFilter.value === 'all') return true
  if (task.related_type !== 'deal') return false
  const deal = dealsStore.items.find(d => d.id === task.related_id)
  return deal?.business_unit === businessUnitFilter.value
}

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
      return matchSearch && matchStatus && matchAssignee && matchesBusinessUnit(task)
    })
    .sort((a, b) => {
      const overdueDiff = Number(isTaskOverdue(b, now)) - Number(isTaskOverdue(a, now))
      return overdueDiff !== 0 ? overdueDiff : a.due_date.getTime() - b.due_date.getTime()
    })
})

const onToggleTask = (id: number) => tasksStore.toggleDone(id).catch(notifyApiError)
const onRemoveTask = (id: number) => tasksStore.remove(id).catch(notifyApiError)

// ── Create task (with related-record picker) ──────────────────────

const addTaskOpen = ref(false)
const editingTask = ref<Task | null>(null)

const openAddTask = () => {
  editingTask.value = null
  addTaskOpen.value = true
}

const openEditTask = (task: Task) => {
  editingTask.value = task
  addTaskOpen.value = true
}

const onSubmitTask = async (payload: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null, related_type?: TaskRelatedType, related_id?: number }) => {
  try {
    await tasksStore.add(payload as Omit<Task, 'id' | 'status' | 'created_at'>)
    success(t('crm.tasks.index.addTaskSuccess'))
  } catch (err) {
    notifyApiError(err)
  }
}

const onUpdateTask = async (payload: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }) => {
  if (!editingTask.value) return
  try {
    await tasksStore.update(editingTask.value.id, payload)
    success(t('crm.tasks.index.editTaskSuccess'))
  } catch (err) {
    notifyApiError(err)
  }
}

// ── Bulk select / mark-done / reassign ──────────────────────────

const isSelectMode = ref(false)
const selectedIds = ref<number[]>([])

const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value
  selectedIds.value = []
}

// A filter/search change can drop a selected task out of view entirely —
// clear the selection rather than silently bulk-acting on hidden rows.
watch([search, statusFilter, assigneeFilter, businessUnitFilter], () => { selectedIds.value = [] })

const onBulkMarkDone = async () => {
  try {
    await tasksStore.bulkMarkDone(selectedIds.value)
    success(t('crm.tasks.index.bulkMarkDoneSuccess', { count: selectedIds.value.length }))
    selectedIds.value = []
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onBulkReassign = async (assignedTo: number | null) => {
  try {
    await tasksStore.bulkReassign(selectedIds.value, assignedTo)
    success(t('crm.tasks.index.bulkReassignSuccess', { count: selectedIds.value.length }))
    selectedIds.value = []
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
