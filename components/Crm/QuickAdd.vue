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

    <CrmAddActivityModal
      v-model:open="activityOpen"
      show-related-picker
      :default-related-type="prefill?.type"
      :default-related-id="prefill?.id"
      @submit="onSubmitActivity"
    />
    <CrmAddTaskModal
      v-model:open="taskOpen"
      show-related-picker
      :default-related-type="prefill?.type"
      :default-related-id="prefill?.id"
      @submit="onSubmitTask"
    />
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
// open them directly (prefilled with the detail page's record, see useQuickAdd); Nuxt UI's defineShortcuts ignores them while typing in
// an input, so a capital letter in a form never triggers one.
const { t } = useI18n()
const { hasRole } = useRole()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { logActivity } = useLogActivity()
const tasksStore = useTasksStore()

const canLogActivity = computed(() => hasRole(...SALES_PIPELINE_ROLES))
const canAddTask = computed(() => hasRole(...TASK_ROLES))

const activityOpen = ref(false)
const taskOpen = ref(false)
// The Relates-to prefill: the record a row menu / Deal header asked for
// (useQuickAdd), else the detail page the user is on (deal/company/contact/
// lead/prospect). Set before `open` flips, since the modal's form reads it
// when it resets on open.
const route = useRoute()
const prefill = ref<QuickAddTarget | null>(null)
const openActivity = (target?: QuickAddTarget | null) => {
  prefill.value = target ?? relatedTargetFromPath(route.path)
  taskOpen.value = false
  activityOpen.value = true
}
const openTask = (target?: QuickAddTarget | null) => {
  prefill.value = target ?? relatedTargetFromPath(route.path)
  activityOpen.value = false
  taskOpen.value = true
}

const { request } = useQuickAdd()
watch(request, (value) => {
  if (!value) return
  if (value.kind === 'activity' && canLogActivity.value) openActivity(value.target)
  if (value.kind === 'task' && canAddTask.value) openTask(value.target)
})

const menuItems = computed<DropdownMenuItem[]>(() => [
  ...(canLogActivity.value
    ? [{ label: t('layout.quickAdd.logActivity'), icon: 'material-symbols:edit-note-outline', kbds: ['shift', 'a'], onSelect: () => openActivity() }]
    : []),
  ...(canAddTask.value
    ? [{ label: t('layout.quickAdd.addTask'), icon: 'material-symbols:task-alt', kbds: ['shift', 't'], onSelect: () => openTask() }]
    : []),
])

defineShortcuts(computed(() => extractShortcuts(menuItems.value)))

// Resolving false keeps the modal open with the form intact (useAwaitableEmit).
const onSubmitActivity = (payload: ActivityFormSubmit) => {
  if (!payload.related_type || !payload.related_id) return false
  return logActivity(payload.related_type, payload.related_id, payload, t('layout.quickAdd.activityLogged'))
}

const onSubmitTask = async (payload: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null, related_type?: TaskRelatedType, related_id?: number }) => {
  if (!payload.related_type || !payload.related_id) return false
  try {
    await tasksStore.add(payload as Omit<Task, 'id' | 'status' | 'created_at'>)
    success(t('layout.quickAdd.taskAdded'))
  } catch (err) {
    notifyApiError(err)
    return false
  }
}
</script>
