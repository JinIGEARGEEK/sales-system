// Due-date grouping for the all-tasks page (/crm/tasks): Overdue / Today /
// Upcoming (pending tasks) and Done, each fetched as its OWN server query
// (GET /tasks with due_from/due_before bounds) and paged independently with
// "Show more". Grouping within one server-sorted page would be wrong once
// there's more than one page — a group's count header would only reflect the
// rows that happened to land on the current page, and "Today" could be split
// across pages — so every group asks the server for its own rows and total.

export type TaskGroupKey = 'overdue' | 'today' | 'upcoming' | 'done'

export const TASK_GROUP_PAGE_SIZE = 10

// The backend's per-page ceiling (utils.Pagination) — a refresh that re-reads
// everything a group has loaded so far never asks for more than this.
const MAX_PER_PAGE = 200

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

// The viewer's local today/tomorrow midnights — "today" is the viewer's day,
// not the server's (the bounds go over the wire as UTC instants).
export const taskDayBounds = (now = new Date()) => {
  const today = startOfDay(now)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  return { today, tomorrow }
}

// Which groups the Status filter shows: pending splits into the three
// due-date groups, done is its own group, "all" shows all four.
export const taskGroupsForStatus = (status: string): TaskGroupKey[] => {
  if (status === 'done') return ['done']
  if (status === 'pending') return ['overdue', 'today', 'upcoming']
  return ['overdue', 'today', 'upcoming', 'done']
}

// The GET /tasks params that select one group. Pending groups sort soonest
// (i.e. most overdue) first; Done shows the most recently due first.
export const taskGroupQuery = (key: TaskGroupKey, now = new Date()): Record<string, string> => {
  const { today, tomorrow } = taskDayBounds(now)
  switch (key) {
    case 'overdue':
      return { status: 'pending', due_before: today.toISOString(), sort: 'due_date' }
    case 'today':
      return { status: 'pending', due_from: today.toISOString(), due_before: tomorrow.toISOString(), sort: 'due_date' }
    case 'upcoming':
      return { status: 'pending', due_from: tomorrow.toISOString(), sort: 'due_date' }
    case 'done':
      return { status: 'done', sort: '-due_date' }
  }
}

// Which group a single task falls in — the same boundaries as
// taskGroupQuery, for TaskList's due-date badge color (red only for
// overdue, primary for today) wherever a task list is shown.
export const taskDueBucket = (task: Pick<Task, 'status' | 'due_date'>, now = new Date()): TaskGroupKey => {
  if (task.status === 'done') return 'done'
  const { today, tomorrow } = taskDayBounds(now)
  const due = task.due_date.getTime()
  if (due < today.getTime()) return 'overdue'
  if (due < tomorrow.getTime()) return 'today'
  return 'upcoming'
}

interface TaskGroupState {
  items: Task[]
  total: number
  // The last page loaded at TASK_GROUP_PAGE_SIZE (0 = nothing loaded yet).
  page: number
  loading: boolean
}

const emptyGroup = (): TaskGroupState => ({ items: [], total: 0, page: 0, loading: false })

export const useTaskGroups = (
  // The page's own filters (search/assignee/business unit/campaign), shared
  // by every group.
  buildFilters: () => Record<string, unknown>,
  // The groups currently shown (see taskGroupsForStatus).
  groupKeys: () => TaskGroupKey[],
  pageSize = TASK_GROUP_PAGE_SIZE,
) => {
  const tasksStore = useTasksStore()
  const { notifyApiError } = useApiErrorNotifier()

  const groups = reactive<Record<TaskGroupKey, TaskGroupState>>({
    overdue: emptyGroup(),
    today: emptyGroup(),
    upcoming: emptyGroup(),
    done: emptyGroup(),
  })
  // True until the first full fetch lands — drives the page skeleton.
  const initialLoading = ref(true)

  // Bumped on every filter-driven refetch so a slow response for an older
  // filter set can't overwrite a newer one.
  let generation = 0

  const request = (key: TaskGroupKey, page: number, perPage: number) =>
    tasksStore.fetchList({ ...buildFilters(), ...taskGroupQuery(key), page, per_page: perPage })

  const fetchGroup = async (key: TaskGroupKey, gen: number) => {
    const group = groups[key]
    group.loading = true
    try {
      const result = await request(key, 1, pageSize)
      if (gen !== generation) return
      group.items = result.items
      group.total = result.total
      group.page = 1
    } finally {
      if (gen === generation) group.loading = false
    }
  }

  // Every shown group from page 1 — on mount and whenever a filter changes.
  const fetch = async () => {
    const gen = ++generation
    for (const key of Object.keys(groups) as TaskGroupKey[]) {
      if (!groupKeys().includes(key)) groups[key] = emptyGroup()
    }
    try {
      await Promise.all(groupKeys().map(key => fetchGroup(key, gen)))
    } catch (err) {
      notifyApiError(err)
    } finally {
      if (gen === generation) initialLoading.value = false
    }
  }

  const loadMore = async (key: TaskGroupKey) => {
    const group = groups[key]
    const gen = generation
    group.loading = true
    try {
      const result = await request(key, group.page + 1, pageSize)
      if (gen !== generation) return
      // De-dupe: a task toggled/removed since the last page shifts offsets.
      const seen = new Set(group.items.map(task => task.id))
      group.items = [...group.items, ...result.items.filter(task => !seen.has(task.id))]
      group.total = result.total
      group.page += 1
    } catch (err) {
      notifyApiError(err)
    } finally {
      group.loading = false
    }
  }

  // After a toggle/edit/delete/bulk action: re-read every shown group,
  // keeping as many rows as each had loaded (a task may have moved between
  // groups, e.g. marked done or re-dated), without a skeleton flash.
  const refresh = async () => {
    const gen = generation
    try {
      await Promise.all(groupKeys().map(async (key) => {
        const group = groups[key]
        const pages = Math.max(group.page, 1)
        const result = await request(key, 1, Math.min(pages * pageSize, MAX_PER_PAGE))
        if (gen !== generation) return
        group.items = result.items
        group.total = result.total
        // From what actually came back: capped at MAX_PER_PAGE, a group that
        // had loaded more would otherwise skip rows on its next loadMore.
        group.page = Math.max(1, Math.ceil(result.items.length / pageSize))
      }))
    } catch (err) {
      notifyApiError(err)
    }
  }

  const visibleGroups = computed(() => groupKeys().map(key => ({ key, ...groups[key] })))
  const totalCount = computed(() => groupKeys().reduce((sum, key) => sum + groups[key].total, 0))
  const loadedTasks = computed(() => groupKeys().flatMap(key => groups[key].items))

  return { groups, visibleGroups, initialLoading, totalCount, loadedTasks, fetch, loadMore, refresh }
}
