<template>
  <template v-if="menuItems.length > 0">
    <UDropdownMenu :items="menuItems" :content="{ align: 'start' }" :ui="{ content: 'w-56' }">
      <UButton
        icon="material-symbols:add"
        variant="ghost"
        color="neutral"
        size="md"
        class="shrink-0 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
        :aria-label="t('layout.quickAdd.trigger')"
        data-cy="quick-add"
      />
    </UDropdownMenu>

    <CrmAddActivityModal v-model:open="activityOpen" show-related-picker @submit="onSubmitActivity" />
    <CrmAddTaskModal v-model:open="taskOpen" show-related-picker @submit="onSubmitTask" />
  </template>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useI18n } from 'vue-i18n'
import { SALES_PIPELINE_ROLES, TASK_ROLES } from '~/constants/roles'

// Topbar "+" next to Global Search: log an activity or add a task from any
// page, picking the record in the modal's own Relates-to picker (the same
// mode /crm/activities and /crm/tasks use). Gated like those two pages —
// Activities to SALES_PIPELINE_ROLES, Tasks to TASK_ROLES. Shift+A / Shift+T
// open them directly; Nuxt UI's defineShortcuts ignores them while typing in
// an input, so a capital letter in a form never triggers one.
const { t } = useI18n()
const { hasRole } = useRole()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const activitiesStore = useActivitiesStore()
const tasksStore = useTasksStore()

const canLogActivity = computed(() => hasRole(...SALES_PIPELINE_ROLES))
const canAddTask = computed(() => hasRole(...TASK_ROLES))

const activityOpen = ref(false)
const taskOpen = ref(false)
const openActivity = () => {
  taskOpen.value = false
  activityOpen.value = true
}
const openTask = () => {
  activityOpen.value = false
  taskOpen.value = true
}

const menuItems = computed<DropdownMenuItem[]>(() => [
  ...(canLogActivity.value
    ? [{ label: t('layout.quickAdd.logActivity'), icon: 'material-symbols:edit-note-outline', kbds: ['shift', 'a'], onSelect: openActivity }]
    : []),
  ...(canAddTask.value
    ? [{ label: t('layout.quickAdd.addTask'), icon: 'material-symbols:task-alt', kbds: ['shift', 't'], onSelect: openTask }]
    : []),
])

defineShortcuts(computed(() => extractShortcuts(menuItems.value)))

const onSubmitActivity = async (payload: { type: ActivityType, subject: string, notes: string, created_at?: string, related_type?: ActivityRelatedType, related_id?: number }) => {
  if (!payload.related_type || !payload.related_id) return
  try {
    await activitiesStore.add({
      type: payload.type,
      subject: payload.subject,
      notes: payload.notes,
      created_at: payload.created_at,
      related_type: payload.related_type,
      related_id: payload.related_id,
    })
    success(t('layout.quickAdd.activityLogged'))
  } catch (err) {
    notifyApiError(err)
  }
}

const onSubmitTask = async (payload: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null, related_type?: TaskRelatedType, related_id?: number }) => {
  if (!payload.related_type || !payload.related_id) return
  try {
    await tasksStore.add(payload as Omit<Task, 'id' | 'status' | 'created_at'>)
    success(t('layout.quickAdd.taskAdded'))
  } catch (err) {
    notifyApiError(err)
  }
}
</script>
