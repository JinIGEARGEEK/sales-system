import { useI18n } from 'vue-i18n'

interface TaskFormPayload {
  title: string
  due_date: Date
  assigned_to: number | null
}

// Shared by the deal/company/contact detail pages, which each attach follow-up
// tasks to their own record via the same related_type/related_id pair.
export const useTaskList = (relatedType: TaskRelatedType, relatedId: number, addedMessageKey: string) => {
  const { t } = useI18n()
  const { success } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const tasksStore = useTasksStore()

  const addTaskOpen = ref(false)
  const tasks = computed(() => tasksStore.forRelated(relatedType, relatedId))

  const openAddTask = () => {
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

  const onToggleTask = (id: number) => tasksStore.toggleDone(id).catch(notifyApiError)
  const onRemoveTask = (id: number) => tasksStore.remove(id).catch(notifyApiError)

  return { tasks, addTaskOpen, openAddTask, onSubmitTask, onToggleTask, onRemoveTask }
}
