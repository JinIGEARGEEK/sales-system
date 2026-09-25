import LeaveConfirmModal from '~/components/Crm/LeaveConfirmModal.vue'

// Warns before a create/edit form's state is lost — via in-app navigation
// (Cancel button, back-arrow, clicking away to another page) or leaving/
// reloading the tab. Nothing in the codebase tracked form dirtiness before
// this, so every long form (Deal, Lead, Quote, etc.) silently discarded
// typed-but-unsaved input on any of those paths.
//
// `getState` returns whatever the page's form state is — usually `() =>
// form` for a single `reactive()` object, or `() => [form, otherRefValue]`
// when a page tracks extra state outside that object (e.g. a dynamically
// added-to array of rows). Dirtiness is determined by deep-comparing its
// current JSON snapshot against the one taken when the guard was installed
// (i.e. the form's initial values). Call `markClean()`:
//  - right before a successful-submit navigation, so that navigation isn't
//    itself treated as an unsaved-changes exit;
//  - on edit pages, once the record has loaded into the form (the snapshot
//    taken at install time is the still-empty form) and again after each
//    successful save that keeps the user on the page.
//
// In-app navigation asks through a styled <CrmLeaveConfirmModal> (opened via
// Nuxt UI's useOverlay, so pages don't have to place it in their template);
// tab close/reload keeps the browser's native beforeunload prompt, since
// browsers don't allow custom UI there.
export const useUnsavedChangesGuard = (getState: () => unknown) => {
  const overlay = useOverlay()

  let snapshot = JSON.stringify(getState())
  const isDirty = () => JSON.stringify(getState()) !== snapshot

  const markClean = () => {
    snapshot = JSON.stringify(getState())
  }

  // Guards against a second navigation attempt (e.g. a double-clicked back
  // button) stacking a second modal on top of the first.
  let pending: Promise<boolean> | null = null

  const confirmLeave = async (): Promise<boolean> => {
    if (pending) return pending
    const modal = overlay.create(LeaveConfirmModal, { destroyOnClose: true })
    pending = Promise.resolve(modal.open().result as Promise<boolean | undefined>)
      .then(leave => leave === true)
      .finally(() => { pending = null })
    return pending
  }

  onBeforeRouteLeave(async () => {
    if (!isDirty()) return
    if (!(await confirmLeave())) return false
  })

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty()) return
    // Modern browsers ignore any custom string and show their own generic
    // confirmation copy — preventDefault (plus setting returnValue, for
    // older engines that still read it) is what actually triggers the prompt.
    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

  return { markClean, isDirty }
}
