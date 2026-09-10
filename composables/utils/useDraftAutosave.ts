import { useI18n } from 'vue-i18n'

// Debounce-persists a create-form's state to localStorage so a crash, an
// accidental tab close, or a session-expiry redirect (see plugins/axios.ts)
// doesn't throw away everything the rep just typed into a long form (Deal,
// Quote, etc). `key` must be unique per form *type* — a bare create page has
// only one in-flight draft at a time, so no per-record id is needed.
//
// `getState` snapshots whatever the page's form state is (one `reactive()`
// object, or `() => ({ form, items: items.value })` when a page also tracks
// a separate ref, e.g. dynamically added rows); `applyState` writes a
// restored snapshot back into that same live state (via `Object.assign` for
// a reactive object, plus `someRef.value = saved.someRef` for any refs) —
// this can't just be a generic deep-merge because reassigning a nested key
// wholesale (`Object.assign(wrapper, saved)`) would silently detach it from
// the reactive object/ref the template is actually bound to.
//
// Usage: call once per form, call `offerRestoreIfFound()` from `onMounted`
// to show the "restore draft?" toast, and call `discardDraft()` right after
// a successful submit so the next visit doesn't re-offer stale data.
export const useDraftAutosave = <T>(key: string, getState: () => T, applyState: (saved: T) => void) => {
  const storageKey = `draft:${key}`
  const { t } = useI18n()
  const { info } = useNotify()

  const hasDraft = (): boolean => {
    try {
      return localStorage.getItem(storageKey) !== null
    } catch {
      return false
    }
  }

  const restoreDraft = (): boolean => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return false
      applyState(JSON.parse(raw))
      return true
    } catch {
      return false
    }
  }

  const discardDraft = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Ignore — nothing to clean up if storage isn't available.
    }
  }

  // One-liner for the common `onMounted(() => offerRestoreIfFound())` call
  // site — centralizes the toast copy/wiring so every form using this
  // composable offers the same restore prompt instead of hand-rolling it.
  const offerRestoreIfFound = () => {
    if (!hasDraft()) return
    info(t('global.draftFound'), { label: t('global.draftRestore'), onClick: restoreDraft })
  }

  let saveTimer: ReturnType<typeof setTimeout>
  watch(() => JSON.stringify(getState()), (snapshot) => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, snapshot)
      } catch {
        // Ignore — autosave is a convenience, not a requirement.
      }
    }, 800)
  })

  onBeforeUnmount(() => clearTimeout(saveTimer))

  return { hasDraft, restoreDraft, discardDraft, offerRestoreIfFound }
}
