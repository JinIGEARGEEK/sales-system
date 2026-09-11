// Collapsed-group state for layouts/default.vue's collapsible sidebar nav
// groups (e.g. "Settings" — Pipeline Config/Staff/API Keys). A per-viewer UI
// preference, not shared data, so it lives in localStorage (client-only,
// same guard convention as composables/utils/useAuth.ts) rather than a
// store/backend field — keyed by each MenuGroup's own stable `key` so a
// future second group doesn't fight this one over a single flag.
//
// Both the read and the write are wrapped in try/catch, unlike a plain
// `localStorage.getItem` — this one also JSON.parses the value, and unlike
// useAuth.ts's bare string read, a parse can fail (corrupted/edited value, a
// future incompatible format). This runs at the root layout's setup, so an
// uncaught throw here would fail the whole app shell's mount for that
// browser profile, not just this feature — same risk useDraftAutosave.ts's
// own try/catch around this exact JSON.parse(localStorage read) pattern
// already guards against elsewhere in this app.
const STORAGE_KEY = 'sidebar-collapsed-groups'

const readStoredCollapsedKeys = (): Set<string> => {
  if (!import.meta.client) return new Set()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Set()
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

export const useCollapsedNavGroups = () => {
  const collapsed = ref<Set<string>>(readStoredCollapsedKeys())

  const isCollapsed = (key: string) => collapsed.value.has(key)

  const toggle = (key: string) => {
    const next = new Set(collapsed.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    collapsed.value = next
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // Storage disabled/full (private browsing, quota) — collapse still
        // works for this page visit, it just won't persist to the next one.
      }
    }
  }

  return { isCollapsed, toggle }
}
