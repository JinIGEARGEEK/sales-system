// Shared boilerplate for the app's "Add X" modals: the form resets to empty
// whenever the modal opens — not on close — so the next open is always blank
// regardless of which button triggered it. Also wraps the manual
// validate-then-submit dance the footer Save button needs, since it lives
// outside the <Form>'s own slot and vee-validate's Form component doesn't
// expose submitForm() on its template ref — only validate() and the field setters.
export const useModalForm = <T extends object>(isOpen: () => boolean, emptyForm: () => T) => {
  const form = reactive(emptyForm()) as T
  const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
  const { loading, guard } = useSubmitGuard()

  watch(isOpen, (value) => {
    if (value) Object.assign(form, emptyForm())
  })

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
  return { form, formRef, validateThenSubmit, loading, guard }
}
