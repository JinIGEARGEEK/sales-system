// Coerces the plain-string referred_by_type/referred_by_id form fields
// (matching every other InputSelect/InputAsyncSelect-bound field) into the
// API's null-or-typed shape — shared by every place that submits a Lead
// (create.vue's onSubmit, [id].vue's onSave/onMarkSql) so the coercion and
// the 'company' | 'contact' literal type exist in exactly one place.
export const toReferredByPayload = (form: { referred_by_type: string, referred_by_id: string }) => ({
  referred_by_type: (form.referred_by_type || null) as 'company' | 'contact' | null,
  referred_by_id: form.referred_by_id ? Number(form.referred_by_id) : null,
})
