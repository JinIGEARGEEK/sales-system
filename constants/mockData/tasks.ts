import { taskDueBucket } from '~/composables/utils/useTaskGroups'

export const TASK_STATUS_FILTER_OPTIONS: Select[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
]

export const TASK_PRIORITY_OPTIONS: Select[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

// A pending task due before the viewer's local today — the same boundary as
// the Tasks page's Overdue group (useTaskGroups' taskDueBucket), so a task due
// today is never "overdue" on one screen and "today" on another.
export const isTaskOverdue = (task: Pick<Task, 'status' | 'due_date'>, now: Date = new Date()) =>
  taskDueBucket(task, now) === 'overdue'
