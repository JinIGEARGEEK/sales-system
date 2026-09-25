<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-black">{{ t('crm.tasks.index.heading') }}</h2>
        <p class="text-sm text-(--color-gray)">{{ t('crm.tasks.index.subheading') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <ButtonPrimary
          outline
          :label="isSelectMode ? t('crm.tasks.index.cancelSelectMode') : t('crm.tasks.index.enterSelectMode')"
          :disabled="!isSelectMode && totalCount === 0"
          @click="toggleSelectMode"
        />
        <ButtonPrimary
          :label="t('crm.tasks.index.addTask')"
          icon="material-symbols:add"
          data-cy="tasks-add"
          @click="openAddTask"
        />
      </div>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div class="flex-1 sm:min-w-56">
          <InputText v-model="search" :placeholder="t('crm.tasks.index.searchPlaceholder')" name="search" />
        </div>
        <div class="w-full sm:w-40">
          <InputSelect v-model="statusFilter" :options="TASK_STATUS_FILTER_OPTIONS" name="statusFilter" />
        </div>
        <!-- Secondary filters: always shown from sm up; on a phone they sit
        behind the "More filters (n)" toggle below, the same pattern as the
        dashboard's filter bar. -->
        <div :class="showMoreFilters ? 'contents' : 'hidden sm:contents'">
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
        <div class="flex gap-2 sm:contents">
          <UButton
            class="sm:hidden"
            :label="showMoreFilters ? t('crm.tasks.index.fewerFilters') : t('crm.tasks.index.moreFilters')"
            :icon="showMoreFilters ? 'material-symbols:expand-less' : 'material-symbols:tune'"
            variant="subtle"
            color="primary"
            data-cy="tasks-more-filters"
            @click="showMoreFilters = !showMoreFilters"
          >
            <template v-if="secondaryFilterCount > 0" #trailing>
              <UBadge :label="secondaryFilterCount" size="xs" color="primary" variant="solid" />
            </template>
          </UButton>
          <UButton
            v-if="hasActiveFilters"
            icon="material-symbols:filter-alt-off-outline"
            variant="outline"
            color="neutral"
            :label="t('crm.tasks.index.clearFilters')"
            data-cy="tasks-clear-filters"
            @click="clearFilters"
          />
        </div>
      </div>
    </UCard>

    <ContainerTemplate>
      <div v-if="initialLoading" class="flex flex-col gap-2">
        <USkeleton v-for="i in 5" :key="`task-skeleton-${i}`" class="h-14 w-full rounded-lg" />
      </div>
      <CrmListEmptyState
        v-else-if="totalCount === 0"
        icon="material-symbols:task-alt"
        :title="hasActiveFilters ? t('crm.tasks.index.emptyFilteredTitle') : t('crm.tasks.index.emptyTitle')"
        :description="hasActiveFilters ? t('crm.tasks.index.emptyFilteredDescription') : t('crm.tasks.index.emptyDescription')"
        :action-label="t('crm.tasks.index.addTask')"
        :clear-filters-label="t('crm.tasks.index.clearFilters')"
        :filtered="hasActiveFilters"
        @action="openAddTask"
        @clear-filters="clearFilters"
      />
      <div v-else class="flex flex-col gap-6">
        <section
          v-for="group in shownGroups"
          :key="group.key"
          :aria-labelledby="`task-group-${group.key}`"
          :data-cy="`task-group-${group.key}`"
        >
          <h3
            :id="`task-group-${group.key}`"
            class="mb-2 flex items-center gap-2 border-l-4 pl-2 text-sm font-semibold"
            :class="GROUP_ACCENT[group.key].heading"
          >
            <UIcon :name="GROUP_ACCENT[group.key].icon" class="size-4" />
            {{ t(`crm.tasks.index.groups.${group.key}`) }}
            <UBadge :color="GROUP_ACCENT[group.key].badge" variant="subtle" size="sm" :label="String(group.total)" />
          </h3>
          <CrmTaskList
            :tasks="enrich(group.items)"
            :selectable="isSelectMode"
            :selected-ids="selectedIds"
            @toggle="onToggleTask"
            @removed="refresh"
            @edit="openEditTask"
            @update:selected-ids="onGroupSelection(group.items, $event)"
          />
          <div v-if="group.items.length < group.total" class="mt-2 flex justify-center">
            <UButton
              variant="ghost"
              color="neutral"
              icon="material-symbols:expand-more"
              :loading="group.loading"
              :label="t('crm.tasks.index.showMore', { count: group.total - group.items.length })"
              @click="loadMore(group.key)"
            />
          </div>
        </section>
      </div>
    </ContainerTemplate>

    <CrmTaskBulkActionBar
      v-if="selectedIds.length > 0"
      :selected-ids="selectedIds"
      @mark-done="bulkDoneConfirmOpen = true"
      @reassign="onBulkReassign"
      @cancel="selectedIds = []"
    />

    <!-- Same confirm-before-done rule as a single task's Mark done button
    (TaskList's own confirm), now with the count. -->
    <CrmConfirmDeleteModal
      v-model:open="bulkDoneConfirmOpen"
      :title="t('crm.tasks.index.bulkConfirmDoneTitle')"
      :body="t('crm.tasks.index.bulkConfirmDoneBody', { count: selectedIds.length })"
      :confirm-label="t('crm.components.taskList.confirmDoneButton')"
      confirm-color="success"
      @confirm="onBulkMarkDone"
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
import { TASK_STATUS_FILTER_OPTIONS, BUSINESS_UNIT_FILTER_OPTIONS } from '~/constants/mockData'
import { TASK_ROLES } from '~/constants/roles'
import { GLASS_PANEL_UI } from '~/constants/ui'
import { taskGroupsForStatus, useTaskGroups, type TaskGroupKey } from '~/composables/utils/useTaskGroups'

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

// Every filter is query-synced so it survives a back-button return and can
// be deep-linked (the Campaigns list links here as ?campaign_id=<id>).
const search = useQuerySyncedRef('search', '', 400)
const statusFilter = useQuerySyncedRef('status', 'pending')
const assigneeFilter = useQuerySyncedRef('assigned_to')
const businessUnitFilter = useQuerySyncedRef('business_unit')
const campaignFilter = useQuerySyncedRef('campaign_id')
const campaignFilterOptions = computed<Select[]>(() => [
  { label: t('crm.tasks.index.allCampaigns'), value: 'all' },
  ...campaignsStore.items.map(campaign => ({ label: campaign.name, value: String(campaign.id) })),
])

const showMoreFilters = ref(false)
const secondaryFilterCount = computed(() => [assigneeFilter, businessUnitFilter, campaignFilter].filter(f => f.value !== 'all').length)
const hasActiveFilters = computed(() => Boolean(search.value) || statusFilter.value !== 'pending' || secondaryFilterCount.value > 0)
const clearFilters = () => {
  search.value = ''
  statusFilter.value = 'pending'
  assigneeFilter.value = 'all'
  businessUnitFilter.value = 'all'
  campaignFilter.value = 'all'
}

// Everything filters server-side now (GET /tasks — search also matches the
// linked record's name; business_unit follows the linked Deal/Prospect).
const buildFilters = () => ({
  search: search.value || undefined,
  assigned_to: assigneeFilter.value !== 'all' ? assigneeFilter.value : undefined,
  business_unit: businessUnitFilter.value !== 'all' ? businessUnitFilter.value : undefined,
  campaign_id: campaignFilter.value !== 'all' ? campaignFilter.value : undefined,
})

// One server query per due-date group (see useTaskGroups' header comment
// for why grouping within a single page would be wrong).
const { visibleGroups, initialLoading, totalCount, loadedTasks, fetch, loadMore, refresh } = useTaskGroups(
  buildFilters,
  () => taskGroupsForStatus(statusFilter.value),
)
const shownGroups = computed(() => visibleGroups.value.filter(group => group.total > 0))

// Red only for Overdue; Today gets the primary accent; the rest stay neutral.
const GROUP_ACCENT: Record<TaskGroupKey, { heading: string, badge: 'error' | 'primary' | 'neutral' | 'success', icon: string }> = {
  overdue: { heading: 'border-(--color-danger-toast) text-(--color-danger-toast)', badge: 'error', icon: 'material-symbols:warning-outline' },
  today: { heading: 'border-(--color-primary) text-(--color-primary)', badge: 'primary', icon: 'material-symbols:today-outline' },
  upcoming: { heading: 'border-(--color-light-gray-2) text-(--color-black)', badge: 'neutral', icon: 'material-symbols:event-upcoming-outline' },
  done: { heading: 'border-(--color-light-gray-2) text-(--color-gray)', badge: 'neutral', icon: 'material-symbols:check-circle-outline' },
}

guardMounted(() => {
  fetch()
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  // Preloaded so resolveRelated can show a name instead of "-" on first
  // render for most rows (it fetches any Deal/Prospect still missing).
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  if (prospectsStore.items.length === 0) prospectsStore.fetchAll().catch(notifyApiError)
  if (campaignsStore.items.length === 0) campaignsStore.fetchAll().catch(notifyApiError)
})

let searchDebounce: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(fetch, 400)
})
watch([statusFilter, assigneeFilter, businessUnitFilter, campaignFilter], () => fetch())

const enrich = (tasks: Task[]) => tasks.map(task => ({
  ...task,
  ...resolveRelated(task.related_type, task.related_id),
  campaignLabel: task.campaign_id ? campaignsStore.nameById(task.campaign_id) : undefined,
}))

// A toggle can move a task to another group (pending <-> done), so re-read.
const onToggleTask = async (id: number) => {
  try {
    await tasksStore.toggleDone(id)
    await refresh()
  } catch (err) {
    notifyApiError(err)
  }
}

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
    await refresh()
  } catch (err) {
    notifyApiError(err)
  }
}

const onUpdateTask = async (payload: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }) => {
  if (!editingTask.value) return
  try {
    await tasksStore.update(editingTask.value.id, payload)
    success(t('crm.tasks.index.editTaskSuccess'))
    await refresh()
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

// Each group's TaskList only knows its own rows, so its "select all" emits
// just that group's selection — merge it with the other groups' picks.
const onGroupSelection = (groupTasks: Task[], groupSelection: number[]) => {
  const groupIds = new Set(groupTasks.map(task => task.id))
  selectedIds.value = [...selectedIds.value.filter(id => !groupIds.has(id)), ...groupSelection]
}

// A filter/search change can drop a selected task out of view entirely —
// clear the selection rather than silently bulk-acting on hidden rows.
watch([search, statusFilter, assigneeFilter, businessUnitFilter, campaignFilter], () => { selectedIds.value = [] })
// ...and so can a refresh (e.g. a selected task deleted or moved).
watch(loadedTasks, (tasks) => {
  const visible = new Set(tasks.map(task => task.id))
  if (selectedIds.value.some(id => !visible.has(id))) selectedIds.value = selectedIds.value.filter(id => visible.has(id))
})

const bulkDoneConfirmOpen = ref(false)

const onBulkMarkDone = async () => {
  const count = selectedIds.value.length
  try {
    await tasksStore.bulkMarkDone(selectedIds.value)
    success(t('crm.tasks.index.bulkMarkDoneSuccess', { count }))
    selectedIds.value = []
    await refresh()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  } finally {
    bulkDoneConfirmOpen.value = false
  }
}

const onBulkReassign = async (assignedTo: number | null) => {
  const count = selectedIds.value.length
  try {
    await tasksStore.bulkReassign(selectedIds.value, assignedTo)
    success(t('crm.tasks.index.bulkReassignSuccess', { count }))
    selectedIds.value = []
    await refresh()
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
