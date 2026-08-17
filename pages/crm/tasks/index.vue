<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('crm.tasks.index.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('crm.tasks.index.subheading') }}</p>
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
      </div>
    </UCard>

    <ContainerTemplate>
      <div v-if="filteredTasks.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.tasks.index.noTasksMatch') }}
      </div>
      <CrmTaskList
        v-else
        :tasks="filteredTasks"
        @toggle="onToggleTask"
        @remove="onRemoveTask"
      />
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_STATUS_FILTER_OPTIONS, matchesAssigneeFilter, isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.tasks.index.pageTitle') })

const tasksStore = useTasksStore()
const teamMembersStore = useTeamMembersStore()
const { resolveRelated } = useRelatedRecord()

onMounted(() => {
  if (tasksStore.items.length === 0) tasksStore.fetchAll()
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll()
})

const search = ref('')
const statusFilter = ref('pending')
const assigneeFilter = ref('all')

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

const onToggleTask = (id: number) => tasksStore.toggleDone(id)
const onRemoveTask = (id: number) => tasksStore.remove(id)
</script>
