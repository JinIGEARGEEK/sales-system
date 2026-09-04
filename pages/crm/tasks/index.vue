<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
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
        <div class="w-full sm:w-48">
          <InputSelect
            v-model="campaignFilter"
            :options="campaignFilterOptions"
            :placeholder="t('crm.tasks.index.filterCampaign')"
            name="campaignFilter"
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
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_STATUS_FILTER_OPTIONS, matchesAssigneeFilter, isTaskOverdue, BUSINESS_UNIT_FILTER_OPTIONS } from '~/constants/mockData'
import { TASK_ROLES } from '~/constants/roles'

const { t } = useI18n()

useHead({ title: t('crm.tasks.index.pageTitle') })

// Matches TASK_ROLES already used to gate this page's own nav entry
// (layouts/default.vue) — a role outside it reaching this URL directly
// otherwise got full, ungated access (this page had no guard at all before).
const { canAccess, guardMounted } = usePageAccess(...TASK_ROLES)

const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const tasksStore = useTasksStore()
const teamMembersStore = useTeamMembersStore()
const dealsStore = useDealsStore()
const prospectsStore = useProspectsStore()
const campaignsStore = useCampaignsStore()
const { resolveRelated } = useRelatedRecord()
const route = useRoute()

guardMounted(() => {
  if (tasksStore.items.length === 0) tasksStore.fetchAll().catch(notifyApiError)
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  // Needed both to resolve each task's relatedLabel/path below and to back
  // the Business Unit filter, which reads the linked Deal/Prospect's own
  // business_unit.
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  if (prospectsStore.items.length === 0) prospectsStore.fetchAll().catch(notifyApiError)
  if (campaignsStore.items.length === 0) campaignsStore.fetchAll().catch(notifyApiError)
})

const search = ref('')
const statusFilter = ref('pending')
const assigneeFilter = ref('all')
const businessUnitFilter = ref('all')
// Preset from /crm/tasks?campaign_id=<id> — the Campaigns list page's own
// row link (pages/crm/campaigns/index.vue) navigates here that way rather
// than duplicating a Tasks-filtered-by-campaign view of its own.
const campaignFilter = ref(typeof route.query.campaign_id === 'string' ? route.query.campaign_id : 'all')
const campaignFilterOptions = computed<Select[]>(() => [
  { label: t('crm.tasks.index.allCampaigns'), value: 'all' },
  ...campaignsStore.items.map(campaign => ({ label: campaign.name, value: String(campaign.id) })),
])

// Business Unit filters by the linked Deal or Prospect's own business_unit —
// Tasks have no business_unit of their own (they only ever relate to a
// Deal/Contact/Company/Prospect, api-system-spec.md §7.6). A task related to
// a Contact/Company (neither has a business_unit field) can't match a
// specific Business Unit and is excluded once this filter is anything but
// "all".
// Relies on dealsStore.items/prospectsStore.items already having this
// record — resolveRelated (called just below, in filteredTasks' own .map
// over the same tasks) fires a fetchOne for any related Deal/Prospect not
// already loaded, so this naturally re-evaluates correctly once that
// resolves, without needing its own fetch beyond the initial fetchAll above.
const matchesBusinessUnit = (task: Task) => {
  if (businessUnitFilter.value === 'all') return true
  if (task.related_type === 'deal') {
    const deal = dealsStore.items.find(d => d.id === task.related_id)
    return deal?.business_unit === businessUnitFilter.value
  }
  if (task.related_type === 'prospect') {
    const prospect = prospectsStore.items.find(p => p.id === task.related_id)
    return prospect?.business_unit === businessUnitFilter.value
  }
  return false
}

const matchesCampaign = (task: Task) => campaignFilter.value === 'all' || String(task.campaign_id ?? '') === campaignFilter.value

const filteredTasks = computed(() => {
  const now = Date.now()
  return tasksStore.items
    .map(task => ({
      ...task,
      ...resolveRelated(task.related_type, task.related_id),
      campaignLabel: task.campaign_id ? campaignsStore.nameById(task.campaign_id) : undefined,
    }))
    .filter((task) => {
      const matchSearch = !search.value
        || task.title.toLowerCase().includes(search.value.toLowerCase())
        || task.relatedLabel.toLowerCase().includes(search.value.toLowerCase())
      const matchStatus = statusFilter.value === 'all' || task.status === statusFilter.value
      const matchAssignee = matchesAssigneeFilter(task.assigned_to, assigneeFilter.value)
      return matchSearch && matchStatus && matchAssignee && matchesBusinessUnit(task) && matchesCampaign(task)
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
watch([search, statusFilter, assigneeFilter, businessUnitFilter, campaignFilter], () => { selectedIds.value = [] })

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
