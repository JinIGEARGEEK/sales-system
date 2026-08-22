// Shared "is this page-level content allowed for the current role" check —
// consolidates what used to be a copy-pasted `const { hasRole } = useRole();
// const canAccess = computed(() => hasRole(...))` across every admin-only
// page (Trash, Activity Log, Pipeline Config, Users) and every Reports page.
// Pair with <AccessGate :can-access="..."> in the template for the "no
// access" rendering, and `guardMounted()` below for data-fetches.
export const usePageAccess = (...roles: Role[]) => {
  const { hasRole } = useRole()
  const canAccess = computed(() => hasRole(...roles))

  // Runs `fn` only while `canAccess` is true — as a `watch` rather than a
  // one-shot `onMounted` check, so a fetch that was skipped because role
  // hydration hadn't resolved yet still fires once it does, instead of
  // leaving the page permanently empty after <AccessGate> reveals it.
  // `immediate: true` covers the normal "already resolved by mount" case
  // that the codebase relies on today (hydrate-auth.client.ts is awaited
  // before app mount), so this is a strict superset of the old
  // `onMounted(() => { if (!canAccess.value) return; fn() })` pattern, not
  // just a defensive extra.
  const guardMounted = (fn: () => void) => {
    watch(canAccess, (value) => {
      if (value) fn()
    }, { immediate: true })
  }

  return { canAccess, guardMounted }
}
