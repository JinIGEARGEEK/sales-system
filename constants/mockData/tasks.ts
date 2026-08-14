export const TASK_STATUS_FILTER_OPTIONS: Select[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
]

// Shared by TaskList's per-row badge and the dashboard's upcoming-follow-ups widget —
// `now` defaults to the current time but can be hoisted once by a caller looping over
// many tasks (e.g. the dashboard) instead of calling Date.now() per task.
export const isTaskOverdue = (task: Task, now: number = Date.now()) => task.status === 'pending' && task.due_date.getTime() < now

export const MOCK_TASKS: Task[] = [
  { id: 1, related_type: 'deal', related_id: 1, title: 'Send revised proposal after negotiation call', due_date: new Date('2026-08-12'), status: 'pending', assigned_to: 1, created_at: new Date('2026-08-05') },
  { id: 2, related_type: 'deal', related_id: 1, title: 'Follow up on legal review', due_date: new Date('2026-08-18'), status: 'pending', assigned_to: 1, created_at: new Date('2026-08-10') },
  { id: 3, related_type: 'deal', related_id: 2, title: 'Confirm POS integration timeline with IT', due_date: new Date('2026-08-16'), status: 'pending', assigned_to: 2, created_at: new Date('2026-08-08') },
  { id: 4, related_type: 'contact', related_id: 1, title: 'Call to check in after quote sent', due_date: new Date('2026-08-15'), status: 'pending', assigned_to: 1, created_at: new Date('2026-08-09') },
  { id: 5, related_type: 'company', related_id: 4, title: 'Reach out — no contact in 90+ days', due_date: new Date('2026-08-20'), status: 'pending', assigned_to: null, created_at: new Date('2026-08-11') },
  { id: 6, related_type: 'deal', related_id: 4, title: 'Send thank-you note after close', due_date: new Date('2026-07-05'), status: 'done', assigned_to: 1, created_at: new Date('2026-07-01') },
]
