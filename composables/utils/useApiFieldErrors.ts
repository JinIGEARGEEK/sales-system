// Form-side wrapper around applyApiFieldErrors (useAPI.ts) — the one helper
// for putting a 422's `error.fields` onto a form. One rule:
//   - every API field the form renders gets its error on its input;
//   - it returns true only when *every* API field was shown that way, so the
//     caller still toasts whenever something had no input to land on.
// vee-validate files an error for an unregistered name in a hidden bag nobody
// displays, so a field this form doesn't have (e.g. `deal.stage` on a Convert
// body) would otherwise vanish without a word.
//
// `fieldNames` is the form's rendered Field names: the `values` argument of a
// `<Form @submit>` handler, the Form ref's `getValues()`, or an explicit list.
// `fieldMap` renames API fields to Field names where they differ (as in
// applyApiFieldErrors); `messages` replaces the generic translated code for
// specific (Field) names, e.g. { assigned_to: 'Pick an active sales user' }.
// Uses `$i18n` rather than useI18n() so it also works from composables built
// outside a component's setup (useModalForm).
export interface ApiFieldErrorOptions {
  fieldMap?: Record<string, string>
  messages?: Record<string, string>
}

export type ShowApiFieldErrors = (
  err: unknown,
  setErrors: (errors: Record<string, string>) => void,
  fieldNames: Record<string, unknown> | readonly string[],
  options?: ApiFieldErrorOptions,
) => boolean

export const useApiFieldErrors = (): ShowApiFieldErrors => {
  const i18n = useNuxtApp().$i18n as { t: (key: string) => string, te: (key: string) => boolean }

  return (err, setErrors, fieldNames, { fieldMap = {}, messages = {} } = {}) => {
    const known = new Set<string>(Array.isArray(fieldNames) ? fieldNames : Object.keys(fieldNames))
    let allShown = false
    applyApiFieldErrors(err, (errors) => {
      const shown: Record<string, string> = {}
      for (const [name, message] of Object.entries(errors)) {
        if (known.has(name)) shown[name] = messages[name] ?? message
      }
      const total = Object.keys(errors).length
      allShown = total > 0 && Object.keys(shown).length === total
      if (Object.keys(shown).length) setErrors(shown)
    }, key => i18n.t(key), key => i18n.te(key), fieldMap)
    return allShown
  }
}

// The usual page-form catch built on it: mark what the form renders, and toast
// the API's message (else the generic one) unless every field was shown —
// `catch (err) { showFormErrors(err, setErrors, values) }`.
export const useApiFormErrors = () => {
  const showFieldErrors = useApiFieldErrors()
  const { error } = useNotify()
  const i18n = useNuxtApp().$i18n as { t: (key: string) => string }

  return (...args: Parameters<ShowApiFieldErrors>) => {
    if (!showFieldErrors(...args)) error(getApiErrorMessage(args[0], i18n.t('global.genericError')))
  }
}
