import { useI18n } from 'vue-i18n'
import { SALES_PIPELINE_ROLES } from '~/constants/roles'

// The "no reassign" choice of AdminReassignRecordsSelect. Reka's Select
// rejects an empty-string item value, hence a sentinel.
export const KEEP_RECORDS = 'keep'

// Fields the API names on its "you can't change your own role, deactivate or
// delete yourself" 422 (PUT: role/status, DELETE: id, bulk: ids).
const SELF_FIELDS = ['role', 'status', 'id', 'ids']

// Whether a PUT /users/:id takes the user's open records away from them —
// the backend's `losesRecords`: deactivating an active user, or moving an
// active user out of a role that can own pipeline records (to Production).
export const updateLosesRecords = (user: Pick<AdminUser, 'is_active' | 'role'>, next: { role: string, status: string }) => {
  if (!user.is_active) return false
  if (next.status === 'inactive') return true
  return SALES_PIPELINE_ROLES.includes(user.role) && !SALES_PIPELINE_ROLES.includes(next.role as Role)
}

// Shared by the Users list (delete, bulk deactivate) and the user edit page:
// who can receive a removed user's open records, how to word what moved or
// what's still left, and how to show the self-change/last-Admin guards.
export const useUserRecordsReassign = () => {
  const { t } = useI18n()
  const { success, warning, error } = useNotify()
  const usersStore = useUsersStore()

  const nameOf = (id: number) => {
    const user = usersStore.items.find(u => u.id === id)
    return user ? `${user.first_name} ${user.last_name}`.trim() : `#${id}`
  }

  // An active Admin/Sales Rep/Sales Manager/Marketing user, not one of the
  // users being removed (anything else is a 422 on reassign_to).
  const reassignOptions = (excludeIds: number[]): Select[] => [
    { label: t('admin.users.reassign.keep'), value: KEEP_RECORDS },
    ...usersStore.items
      .filter(u => u.is_active && !u.deleted_at && SALES_PIPELINE_ROLES.includes(u.role) && !excludeIds.includes(u.id))
      .map(u => ({ label: `${nameOf(u.id)} (${u.role})`, value: String(u.id) })),
  ]

  // The picker's value → the API's reassign_to (undefined = keep).
  const toReassignTo = (value: string | null | undefined) =>
    value && value !== KEEP_RECORDS ? Number(value) : undefined

  // "3 deals, 1 lead, 2 open tasks" — the non-zero counts only.
  const describeCounts = (counts: Partial<OpenRecordCounts>) => (['deals', 'leads', 'prospects', 'tasks'] as const)
    .filter(kind => (counts[kind] ?? 0) > 0)
    .map(kind => t(`admin.users.reassign.counts.${kind}`, counts[kind] ?? 0))
    .join(', ')

  const sumCounts = (list: Partial<OpenRecordCounts>[]): OpenRecordCounts => list.reduce<OpenRecordCounts>((acc, c) => ({
    deals: acc.deals + (c.deals ?? 0),
    leads: acc.leads + (c.leads ?? 0),
    prospects: acc.prospects + (c.prospects ?? 0),
    tasks: acc.tasks + (c.tasks ?? 0),
    total: acc.total + (c.total ?? 0),
  }), { deals: 0, leads: 0, prospects: 0, tasks: 0, total: 0 })

  // After a single delete/deactivate/move to Production.
  const notifyRecordsResult = (name: string, result: { open_records?: OpenRecordCounts | null, reassigned?: ReassignedRecords | null }) => {
    const moved = result.reassigned
    if (moved && moved.total > 0) {
      success(t('admin.users.reassign.moved', { records: describeCounts(moved), to: nameOf(moved.reassign_to) }))
    }
    const left = result.open_records
    if (left && left.total > 0) {
      warning(t('admin.users.reassign.remaining', { name, records: describeCounts(left) }))
    }
  }

  // After a bulk deactivate: one summary of what moved, one of who still
  // owns records.
  const notifyBulkRecordsResult = (result: UserBulkDeactivateResult) => {
    const moved = result.reassigned.filter(r => r.total > 0)
    if (moved.length > 0) {
      success(t('admin.users.reassign.moved', { records: describeCounts(sumCounts(moved)), to: nameOf(moved[0]!.reassign_to) }))
    }
    const owners = result.open_records.filter(r => r.total > 0)
    if (owners.length > 0) {
      warning(t('admin.users.reassign.remainingBulk', {
        names: owners.map(o => nameOf(o.user_id)).join(', '),
        records: describeCounts(sumCounts(owners)),
      }))
    }
  }

  // A translated message for the guards, or undefined for anything else.
  const userGuardMessage = (err: unknown): string | undefined => {
    if (getApiErrorCode(err) === 'CONFLICT') return t('admin.users.errors.lastAdmin')
    const fields = getApiErrorFields(err)
    if (!fields) return undefined
    if (SELF_FIELDS.some(f => f in fields)) return t('admin.users.errors.selfChange')
    if ('reassign_to' in fields) return t('admin.users.errors.reassignInvalid')
    return undefined
  }

  // Toast for a failed delete/deactivate (no form to put field errors on).
  const notifyUserError = (err: unknown) => {
    error(userGuardMessage(err) ?? getApiErrorMessage(err, t('global.genericError')))
  }

  // The edit form: a 422 goes onto its inputs (role/status for the
  // self-change guard, reassign_to for a bad pick, anything else via the
  // shared apiFieldError codes) — useApiFieldErrors' rule, so it returns true
  // only when every API field had an input and the caller can skip its toast.
  const showFieldErrors = useApiFieldErrors()
  const showUserFieldErrors = (
    err: unknown,
    setErrors: (errors: Record<string, string>) => void,
    fieldNames: Record<string, unknown> | readonly string[],
  ) => showFieldErrors(err, setErrors, fieldNames, {
    messages: {
      ...Object.fromEntries(SELF_FIELDS.map(field => [field, t('admin.users.errors.selfChange')])),
      reassign_to: t('admin.users.errors.reassignInvalid'),
    },
  })

  return {
    reassignOptions,
    toReassignTo,
    describeCounts,
    notifyRecordsResult,
    notifyBulkRecordsResult,
    userGuardMessage,
    notifyUserError,
    showUserFieldErrors,
  }
}
