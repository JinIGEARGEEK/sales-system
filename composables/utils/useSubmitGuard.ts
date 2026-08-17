// Wraps an async submit handler with a `loading` ref plus re-entry protection,
// so a page's own onSave/onSubmit (called directly by a <Form @submit>, a
// footer button's @click, or both) can only ever have one in-flight call at a
// time — pressing Enter twice, or Enter then clicking Save, no longer fires
// the request twice. Bind the returned `loading` to the submit button's
// `:loading` prop so the spinner reflects the guarded call regardless of
// which trigger (Enter-key native form submit, or the button click) started it.
export const useSubmitGuard = () => {
  const loading = ref(false)

  const guard = <Args extends unknown[]>(fn: (...args: Args) => Promise<void> | void) => {
    return async (...args: Args) => {
      if (loading.value) return
      loading.value = true
      try {
        await fn(...args)
      } finally {
        loading.value = false
      }
    }
  }

  return { loading, guard }
}
