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
  const ids = getApiErrorDuplicateIds(err)
  if (!ids) return null
  const fieldCodes = getApiErrorFields(err) ?? {}
  const fields = ['email', 'phone'].filter(f => fieldCodes[f]?.includes('duplicate'))
  return { fields, ids }
}

// "email and phone" / "email" — or "email or phone" when the 409 named
// neither. Shared by CrmDuplicateConflictAlert and the contacts import's
// per-row list.
export function duplicateFieldsLabel(fields: string[], t: (key: string) => string): string {
  const prefix = 'crm.components.duplicateConflict'
  return fields.length > 0
    ? fields.map(f => t(`${prefix}.fields.${f}`)).join(t(`${prefix}.and`))
    : t(`${prefix}.emailOrPhone`)
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
// - a 422's `error.fields` land on the form's own inputs (useApiFieldErrors,
//   e.g. an inactive `assigned_to`); anything else — including a 422 field
//   the form doesn't render — is a toast.
// `create` gets `allowDuplicate` and must throw the axios error on failure.
// `resetOn` (the email/phone values) clears a stale conflict once edited, so
// "Create anyway" can't fire for values the server never matched.
export const useCreateWithDuplicateCheck = <T>(options: {
  create: (allowDuplicate: boolean) => Promise<T>
  onCreated: (created: T) => void
  resetOn: () => unknown[]
  fieldMap?: Record<string, string>
}) => {
  const { t } = useI18n()
  const { error } = useNotify()
  const showFieldErrors = useApiFieldErrors()
  const { loading, guard } = useSubmitGuard()
  const conflict = ref<DuplicateConflict | null>(null)
  // The last submit's Form values + setErrors, reused by "Create anyway".
  let lastSubmit: { values: Record<string, unknown>, setErrors: SubmitContext['setErrors'] } | null = null

  watch(options.resetOn, () => { conflict.value = null })

  const markFields = (err: unknown) =>
    !!lastSubmit && showFieldErrors(err, lastSubmit.setErrors, lastSubmit.values, { fieldMap: options.fieldMap })

  const run = async (allowDuplicate: boolean) => {
    try {
      const created = await options.create(allowDuplicate)
      conflict.value = null
      options.onCreated(created)
    } catch (err) {
      const duplicate = getDuplicateConflict(err)
      if (duplicate) {
        conflict.value = duplicate
        markFields(err)
        return
      }
      if (markFields(err)) return
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }

  const onSubmit = guard(async (values?: Record<string, unknown>, ctx?: SubmitContext) => {
    lastSubmit = values && ctx ? { values, setErrors: ctx.setErrors } : null
    await run(false)
  })

  const createAnyway = guard(async () => {
    if (!conflict.value) return
    await run(true)
  })

  const dismiss = () => { conflict.value = null }

  return { conflict, loading, onSubmit, createAnyway, dismiss }
}
