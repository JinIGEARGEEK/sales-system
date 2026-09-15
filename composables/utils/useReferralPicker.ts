// Picks an existing Company or Contact as a Lead's referrer
// (referred_by_type/referred_by_id) — parallel to, not built on top of,
// useRelatedRecordPicker: the field names are deliberately different
// (referred_by_type/referred_by_id, not related_type/related_id) since this
// isn't the same "what is this record about" concept as Task/Activity's
// Relates To, and only Company/Contact are ever valid referrers (no Deal/
// Prospect branch to carry around).
// isHydrating (optional) mirrors useBusinessUnitItemOptions's own last param:
// a detail/edit page that (re)populates this form asynchronously from a
// fetched record needs to suppress the clear-on-type-change watcher below
// while it's doing that assignment, or hydrating referred_by_type would
// immediately wipe the referred_by_id hydrated alongside it. A create page
// with no async hydration can omit it.
export const useReferralPicker = (form: { referred_by_type: string, referred_by_id: string }, isHydrating?: () => boolean) => {
  const contactsStore = useContactsStore()

  const { search: searchContacts, resolve: resolveContact } = useAsyncRecordPicker(
    contactsStore.fetchList, contactsStore.fetchOne, c => c.name, 'name',
  )

  // Mirrors useRelatedRecordPicker's own relatedRecordId proxy: form fields
  // stay plain strings (matching every other InputSelect/InputAsyncSelect-
  // bound field) while InputCompanySelect/InputAsyncSelect want a number.
  const referredById = computed<number | null>({
    get: () => form.referred_by_id ? Number(form.referred_by_id) : null,
    set: value => { form.referred_by_id = value ? String(value) : '' },
  })

  // A Company picked before switching to Contact (or vice versa) would
  // otherwise submit as e.g. a Company id under referred_by_type: 'contact'.
  watch(() => form.referred_by_type, () => {
    if (isHydrating?.()) return
    form.referred_by_id = ''
  })

  return { searchContacts, resolveContact, referredById }
}
