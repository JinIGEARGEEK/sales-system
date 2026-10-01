import { taskDueBucket } from '~/composables/utils/useTaskGroups'

// Task badge colours (plain auto-imported functions), beside the other
// use*StatusColor composables, so every task list (TaskList, the Dashboard's My day and Upcoming Follow-ups) agrees.

// Due-date badge: red only once a pending task is past its due DAY (the
// Tasks page's Overdue group — taskDueBucket), the primary accent for due
// today, neutral otherwise (upcoming or done). design-system §5.7: colour
// means severity — due today isn't an error, but it is today's job.
export const taskDueColor = (task: Pick<Task, 'status' | 'due_date'>, now = new Date()): 'error' | 'primary' | 'neutral' => {
  const bucket = taskDueBucket(task, now)
  if (bucket === 'overdue') return 'error'
  if (bucket === 'today') return 'primary'
  return 'neutral'
}

// Priority badge: only High is flagged (error); Medium/Low stay neutral so
// the due-date badge remains the primary flag for overdue-ness rather than
// competing with priority for attention.
export const taskPriorityColor = (priority: CrmTaskPriority): 'error' | 'neutral' => (priority === 'high' ? 'error' : 'neutral')
