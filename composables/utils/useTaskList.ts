import { useI18n } from 'vue-i18n'

interface TaskFormPayload {
  title: string
  description: string
  due_date: Date
  priority: TaskPriority
  assigned_to: number | null
}

// Shared by the deal/company/contact detail pages, which each attach follow-up
// tasks to their own record via the same related_type/related_id pair.
export const useTaskList = (relatedType: TaskRelatedType, relatedId: number, addedMessageKey: string, updatedMessageKey?: string) => {
  const { t } = useI18n()
  const { success } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const tasksStore = useTasksStore()

  const addTaskOpen = ref(false)
  const editingTask = ref<Task | null>(null)
  const tasks = computed(() => tasksStore.forRelated(relatedType, relatedId))
  // Load this record's own tasks: the store's cache is no longer filled by
  // the all-tasks page (it pages server-side now), so without this the tab
  // would only show what some earlier page happened to cache.
  tasksStore.fetchForRelated(relatedType, relatedId).catch(notifyApiError)

  const openAddTask = () => {
    editingTask.value = null
    addTaskOpen.value = true
  }

  const openEditTask = (task: Task) => {
    editingTask.value = task
    addTaskOpen.value = true
  }

  const onSubmitTask = async (payload: TaskFormPayload) => {
    try {
      await tasksStore.add({ related_type: relatedType, related_id: relatedId, ...payload })
      success(t(addedMessageKey))
    } catch (err) {
      notifyApiError(err)
    }
  }

  const onUpdateTask = async (payload: TaskFormPayload) => {
    if (!editingTask.value) return
    try {
      await tasksStore.update(editingTask.value.id, payload)
      if (updatedMessageKey) success(t(updatedMessageKey))
    } catch (err) {
      notifyApiError(err)
    }
  }

  const onToggleTask = (id: number) => tasksStore.toggleDone(id).catch(notifyApiError)

  return { tasks, addTaskOpen, editingTask, openAddTask, openEditTask, onSubmitTask, onUpdateTask, onToggleTask }
}
