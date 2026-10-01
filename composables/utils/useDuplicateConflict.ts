import { isAxiosError } from 'axios'
import { useI18n } from 'vue-i18n'

// POST /leads, /prospects and /contacts answer 409 CONFLICT when a
// non-deleted record of the same kind has the same email (case-insensitive)
// or phone (digits only, +66 = leading 0): `error.fields` names the matching
// field(s) (`{ email: ['duplicate'] }`) and `error.duplicate_of` the matching
// ids (at most 10). Resending with `?allow_duplicate=true` skips the check.
// api-system-spec.md, POST /leads.
export interface DuplicateConflict {
  // 'email' and/or 'phone', in that order.
  fields: string[]
  ids: number[]
}

export function getDuplicateConflict(err: unknown): DuplicateConflict | null {
  if (!isAxiosError(err) || err.response?.status !== 409) return null
  const body = err.response.data?.error
  if (!body || !Array.isArray(body.duplicate_of)) return null
  const fieldMap = (body.fields ?? {}) as Record<string, string[]>
  const fields = ['email', 'phone'].filter(f => fieldMap[f]?.includes('duplicate'))
  return { fields, ids: (body.duplicate_of as unknown[]).map(Number).filter(Number.isFinite) }
}

// The vee-validate <Form @submit> handler's second argument — only setErrors
// is used here.
interface SubmitContext {
  setErrors: (errors: Record<string, string>) => void
}

// The create-page submit flow shared by Lead/Prospect/Contact create:
// - a duplicate 409 is kept in `conflict` (for CrmDuplicateConflictAlert: which
//   field matched + links to the existing records) and marked on the email/
//   phone inputs; `createAnyway()` resends with allow_duplicate.
// - a 422's `error.fields` land on the form's own inputs (applyApiFieldErrors,
//   e.g. an inactive `assigned_to`); anything else is a toast.
// `create` gets `allowDuplicate` and must throw the axios error on failure.
// `resetOn` (the email/phone values) clears a stale conflict once edited, so
// "Create anyway" can't fire for values the server never matched.
export const useCreateWithDuplicateCheck = <T>(options: {
  create: (allowDuplicate: boolean) => Promise<T>
  onCreated: (created: T) => void
  resetOn: () => unknown[]
  fieldMap?: Record<string, string>
}) => {
  const { t, te } = useI18n()
  const { error } = useNotify()
  const { loading, guard } = useSubmitGuard()
  const conflict = ref<DuplicateConflict | null>(null)
  let lastSetErrors: SubmitContext['setErrors'] | null = null

  watch(options.resetOn, () => { conflict.value = null })

  const run = async (allowDuplicate: boolean) => {
    try {
      const created = await options.create(allowDuplicate)
      conflict.value = null
      options.onCreated(created)
    } catch (err) {
      const duplicate = getDuplicateConflict(err)
      if (duplicate) {
        conflict.value = duplicate
        if (lastSetErrors) applyApiFieldErrors(err, lastSetErrors, t, te, options.fieldMap)
        return
      }
      if (lastSetErrors && applyApiFieldErrors(err, lastSetErrors, t, te, options.fieldMap)) return
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }

  const onSubmit = guard(async (_values?: unknown, ctx?: SubmitContext) => {
    lastSetErrors = ctx?.setErrors ?? null
    await run(false)
  })

  const createAnyway = guard(async () => {
    if (!conflict.value) return
    await run(true)
  })

  const dismiss = () => { conflict.value = null }

  return { conflict, loading, onSubmit, createAnyway, dismiss }
}
