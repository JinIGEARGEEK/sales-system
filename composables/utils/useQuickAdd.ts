// The topbar Quick Add's Log activity / Add task modals (components/Crm/QuickAdd.vue,
// rendered once in the default layout), opened from anywhere: a list row's
// menu, the Deal header's buttons, or the topbar "+" itself. A `target`
// prefills the modal's Relates-to picker (still changeable); without one,
// QuickAdd prefills from the detail page the user is on (relatedTargetFromPath).
// The lists showing the record's activities/tasks read from the activities/
// tasks stores, which `add()` already updates, so nothing needs a refetch.
export type QuickAddKind = 'activity' | 'task'

export interface QuickAddTarget {
  type: ActivityRelatedType
  id: number
}

interface QuickAddRequest {
  kind: QuickAddKind
  target: QuickAddTarget | null
  // Distinguishes two identical requests in a row, so the watcher still fires.
  seq: number
}

// `/crm/deals/12`, `/crm/deals/12/tasks`, `/crm/companies/3` … → the record
// that page is about; anything else (lists, create pages) → null.
const DETAIL_PATH = /^\/crm\/(deals|companies|contacts|leads|prospects)\/(\d+)(?:\/|$)/
const SEGMENT_TYPE: Record<string, ActivityRelatedType> = {
  deals: 'deal',
  companies: 'company',
  contacts: 'contact',
  leads: 'lead',
  prospects: 'prospect',
}

export const relatedTargetFromPath = (path: string): QuickAddTarget | null => {
  const match = DETAIL_PATH.exec(path)
  if (!match) return null
  return { type: SEGMENT_TYPE[match[1]!]!, id: Number(match[2]) }
}

export const useQuickAdd = () => {
  const request = useState<QuickAddRequest | null>('quickAddRequest', () => null)

  const open = (kind: QuickAddKind, target?: QuickAddTarget | null) => {
    request.value = { kind, target: target ?? null, seq: (request.value?.seq ?? 0) + 1 }
  }

  return {
    request,
    openActivity: (target?: QuickAddTarget | null) => open('activity', target),
    openTask: (target?: QuickAddTarget | null) => open('task', target),
  }
}
