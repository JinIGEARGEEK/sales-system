// Form-side wrapper around applyApiFieldErrors (useAPI.ts): a 422's
// `error.fields` only goes onto inputs the form actually renders. vee-validate
// files an error for an unregistered name in a hidden bag nobody displays, so
// a field this form doesn't have (e.g. `deal.stage` on a Convert body) would
// otherwise vanish. Returns true only when every API field landed on a
// rendered input — the caller toasts its usual message otherwise.
//
// `fieldNames` is the form's registered Field names: the `values` argument of
// a `<Form @submit>` handler, or the Form ref's `getValues()`. `fieldMap`
// renames API fields to Field names where they differ, as in
// applyApiFieldErrors. Uses `$i18n` rather than useI18n() so it also works
// from composables built outside a component's setup (useModalForm).
export const useApiFieldErrors = () => {
  const i18n = useNuxtApp().$i18n as { t: (key: string) => string, te: (key: string) => boolean }

  return (
    err: unknown,
    setErrors: (errors: Record<string, string>) => void,
    fieldNames: Record<string, unknown> | string[],
    fieldMap: Record<string, string> = {},
  ): boolean => {
    const known = new Set(Array.isArray(fieldNames) ? fieldNames : Object.keys(fieldNames))
    let allShown = false
    applyApiFieldErrors(err, (errors) => {
      const shown = Object.fromEntries(Object.entries(errors).filter(([name]) => known.has(name)))
      const total = Object.keys(errors).length
      allShown = total > 0 && Object.keys(shown).length === total
      setErrors(shown)
    }, key => i18n.t(key), key => i18n.te(key), fieldMap)
    return allShown
  }
}
