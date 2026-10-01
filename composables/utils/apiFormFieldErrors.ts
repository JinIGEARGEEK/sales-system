// applyApiFieldErrors (useAPI.ts), limited to the fields a form actually
// renders: a 422 field the form has no input for would otherwise be set
// invisibly and the caller would skip its toast, so the user saw nothing.
// `messages` replaces the generic translated code for specific (form) field
// names, e.g. { assigned_to: 'Pick an active sales user' }. Returns true when
// at least one rendered field got an error.
export interface ApiFormFieldErrorOptions {
  fields: readonly string[]
  fieldMap?: Record<string, string>
  messages?: Record<string, string>
}

export function applyFormApiFieldErrors(
  err: unknown,
  setErrors: (errors: Record<string, string>) => void,
  t: (key: string) => string,
  te: (key: string) => boolean,
  { fields, fieldMap = {}, messages = {} }: ApiFormFieldErrorOptions,
): boolean {
  let matched = false
  applyApiFieldErrors(err, (errors) => {
    const kept: Record<string, string> = {}
    for (const [field, message] of Object.entries(errors)) {
      if (fields.includes(field)) kept[field] = messages[field] ?? message
    }
    matched = Object.keys(kept).length > 0
    if (matched) setErrors(kept)
  }, t, te, fieldMap)
  return matched
}
