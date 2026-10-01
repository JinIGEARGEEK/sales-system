import LeaveConfirmModal from '~/components/Crm/LeaveConfirmModal.vue'

interface UseModalFormOptions {
  // Extra state outside `form` that also counts towards "has the user typed
  // something" (e.g. a selected File held in its own ref).
  extraState?: () => unknown
}

// Shared boilerplate for the app's "Add X" modals: the form resets to empty
// whenever the modal opens — not on close — so the next open is always blank
// regardless of which button triggered it. Also wraps the manual
// validate-then-submit dance the footer Save button needs, since it lives
// outside the <Form>'s own slot and vee-validate's Form component doesn't
// expose submitForm() on its template ref — only validate() and the field setters.
//
// Unsaved-changes check (added 2026-10-01): the form is snapshotted right
// after it opens (one tick later, so a caller's own `watch(open)` prefill —
// e.g. AddContractModal's default quote — is part of the baseline). Wrap the
// modal's `update:open` emitter in `guardDismiss(...)`: while the form
// differs from that snapshot, a close request (Esc, outside click, the ✕,
// Cancel) asks through the styled CrmLeaveConfirmModal first. A close that
// happens during a guarded submit (useAwaitableSubmit closing after the
// parent's handler resolved) is never asked about.
export const useModalForm = <T extends object>(isOpen: () => boolean, emptyForm: () => T, options: UseModalFormOptions = {}) => {
  const form = reactive(emptyForm()) as T
  const formRef = ref<{
    validate: () => Promise<{ valid: boolean }>
    setErrors: (errors: Record<string, string>) => void
    getValues: () => Record<string, unknown>
  } | null>(null)
  const { loading, guard } = useSubmitGuard()
  const overlay = useOverlay()

  const currentState = () => JSON.stringify([form, options.extraState?.()])
  let snapshot = currentState()
  const markClean = () => {
    snapshot = currentState()
  }
  const isDirty = () => currentState() !== snapshot

  watch(isOpen, (value) => {
    if (!value) return
    Object.assign(form, emptyForm())
    markClean()
    nextTick(markClean)
  })

  // Guards against a double Esc stacking a second confirm on the first.
  let pending: Promise<boolean> | null = null
  const confirmDiscard = (): Promise<boolean> => {
    if (pending) return pending
    const modal = overlay.create(LeaveConfirmModal, { destroyOnClose: true })
    pending = Promise.resolve(modal.open().result as Promise<boolean | undefined>)
      .then(leave => leave === true)
      .finally(() => { pending = null })
    return pending
  }

  const guardDismiss = (emitOpen: (value: boolean) => void) => async (value: boolean) => {
    if (value || loading.value || !isDirty()) {
      emitOpen(value)
      return
    }
    if (await confirmDiscard()) emitOpen(false)
  }

  // Pass as useAwaitableSubmit's `onFailure`: puts a 422's `error.fields`
  // from the parent's submitFailure() onto this dialog's inputs (the parent
  // has already toasted). `fieldMap` renames API fields to Field names.
  const showFieldErrors = useApiFieldErrors()
  const showApiFieldErrors = (err: unknown, fieldMap: Record<string, string> = {}) => {
    if (!formRef.value) return
    showFieldErrors(err, formRef.value.setErrors, formRef.value.getValues(), { fieldMap })
  }

  const validateThenSubmit = async (onValid: () => void) => {
    const result = await formRef.value?.validate()
    if (result?.valid) onValid()
  }

  // Wrap the caller's real submit function with this BEFORE passing it to
  // both `<Form @submit>` and `validateThenSubmit(...)` — the Form's own
  // @submit fires directly on Enter-key press, bypassing the footer button
  // (and its click-only loadingAuto) entirely, so the guard has to live on
  // the submit function itself to cover both trigger paths with one `loading`
  // ref. Bind that `loading` to the footer button's `:loading` explicitly.
  return { form, formRef, validateThenSubmit, showApiFieldErrors, loading, guard, guardDismiss, isDirty, markClean }
}
