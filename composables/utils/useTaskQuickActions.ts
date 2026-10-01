import { useI18n } from 'vue-i18n'
import { addDays } from '~/composables/utils/useDateOnly'

// One-click actions on a task row (CrmTaskList): the done toggle and the
// due-date snooze. Marking done no longer asks first — it saves at once and
// the success toast offers an inline Undo that toggles it straight back,
// which is cheaper than a dialog on every tick (design-system.md §5.7).
// Bulk Mark done on the Tasks page still confirms with the count.

export type TaskSnoozeOption = 'tomorrow' | 'threeDays' | 'nextWeek'

export const TASK_SNOOZE_OPTIONS: TaskSnoozeOption[] = ['tomorrow', 'threeDays', 'nextWeek']

// "Next week" is a flat +7 days, not next Monday: predictable from any
// weekday, and never closer than "+3 days" (Monday would be tomorrow on a
// Sunday).
const SNOOZE_DAYS: Record<TaskSnoozeOption, number> = { tomorrow: 1, threeDays: 3, nextWeek: 7 }

// The new due date, counted from the viewer's LOCAL today (not from the old
// due date — snoozing an overdue task should land in the future). Pinned to
// local noon, the same "sometime that day" convention as dateOnlyToLocalNoon,
// so it can't slip into a neighbouring day.
export const snoozedDueDate = (option: TaskSnoozeOption, now = new Date()): Date => {
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  return addDays(todayNoon, SNOOZE_DAYS[option])
}

// `onChanged` runs after every saved change (toggle, undo, snooze) — e.g. the
// Tasks page re-reads its due-date groups, since the task may move between them.
export const useTaskQuickActions = (onChanged?: (id: number) => Promise<void> | void) => {
  const { t } = useI18n()
  const { success } = useNotify()
  const { notifyApiError } = useApiErrorNotifier()
  const { dateFormat } = useFormatter()
  const tasksStore = useTasksStore()

  const changed = async (id: number) => {
    try {
      await onChanged?.(id)
    } catch (err) {
      notifyApiError(err)
    }
  }

  // Returns false when the save failed (already toasted).
  const toggleDone = async (task: Task): Promise<boolean> => {
    const wasDone = task.status === 'done'
    try {
      await tasksStore.toggleDone(task.id)
    } catch (err) {
      notifyApiError(err)
      return false
    }
    await changed(task.id)
    // Reopening a done task is low-stakes and needs no toast; marking done
    // gets the Undo, which toggles it back to pending.
    if (!wasDone) {
      success(t('crm.components.taskList.markDoneSuccess'), {
        label: t('crm.components.taskList.undo'),
        onClick: async () => {
          try {
            await tasksStore.toggleDone(task.id)
          } catch (err) {
            notifyApiError(err)
            return
          }
          await changed(task.id)
          success(t('crm.components.taskList.reopenSuccess'))
        },
      })
    }
    return true
  }

  const snooze = async (task: Task, option: TaskSnoozeOption): Promise<boolean> => {
    const dueDate = snoozedDueDate(option)
    try {
      // Full-record payload: PATCH /tasks/:id overwrites every editable field.
      await tasksStore.update(task.id, fullTaskUpdatePayload(task, { due_date: dueDate }))
    } catch (err) {
      notifyApiError(err)
      return false
    }
    await changed(task.id)
    success(t('crm.components.taskList.snoozeSuccess', { date: dateFormat(dueDate) }))
    return true
  }

  return { toggleDone, snooze }
}
