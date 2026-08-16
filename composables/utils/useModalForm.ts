// Shared boilerplate for the app's "Add X" modals: the form resets to empty
// whenever the modal opens — not on close — so the next open is always blank
// regardless of which button triggered it. Also wraps the manual
// validate-then-submit dance the footer Save button needs, since it lives
// outside the <Form>'s own slot and vee-validate's Form component doesn't
// expose submitForm() on its template ref — only validate() and the field setters.
export const useModalForm = <T extends object>(isOpen: () => boolean, emptyForm: () => T) => {
  const form = reactive(emptyForm()) as T
  const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

  watch(isOpen, (value) => {
    if (value) Object.assign(form, emptyForm())
  })

  const validateThenSubmit = async (onValid: () => void) => {
    const result = await formRef.value?.validate()
    if (result?.valid) onValid()
  }

  return { form, formRef, validateThenSubmit }
}
