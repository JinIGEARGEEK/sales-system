export const TASK_STATUS_FILTER_OPTIONS: Select[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
]

// Shared by TaskList's per-row badge and the dashboard's upcoming-follow-ups widget —
// `now` defaults to the current time but can be hoisted once by a caller looping over
// many tasks (e.g. the dashboard) instead of calling Date.now() per task.
export const isTaskOverdue = (task: Task, now: number = Date.now()) => task.status === 'pending' && task.due_date.getTime() < now
