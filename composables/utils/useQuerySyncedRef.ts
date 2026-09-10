// Two-way version of useQueryFilter: the initial value still seeds from the
// route query (same deep-link behavior), but every later change is also
// written back via router.replace, so a filter/search picked by hand also
// survives a back-button return to this page — not just an initial deep
// link into it. `defaultValue` is omitted from the URL once matched, so a
// filter reset back to "all" doesn't leave a stale `?key=all` behind.
//
// `debounceMs` (default 0) delays the URL write only — pass the same delay
// as the page's own refetchDebounced (typically 400) for a free-text search
// field, so the address bar doesn't rewrite on every keystroke.
//
// Every instance on a page shares one pending-patch queue (module-level, one
// per app since there's one router) rather than each reading/writing
// `route.query` independently: two filters changing in the same tick (or a
// debounced write landing mid-flight of an immediate one) would otherwise
// race — the second call's `router.replace` reads a `route.query` snapshot
// that doesn't yet reflect the first call's still-in-flight write, and
// silently drops it. Queuing merges every pending key into one `replace`
// instead.
let pendingPatch: Record<string, string | undefined> = {}
let flushScheduled = false

function queuePatch (router: ReturnType<typeof useRouter>, route: ReturnType<typeof useRoute>, key: string, value: string | undefined) {
  pendingPatch[key] = value
  if (flushScheduled) return
  flushScheduled = true
  nextTick(() => {
    flushScheduled = false
    const query = { ...route.query, ...pendingPatch }
    pendingPatch = {}
    router.replace({ query })
  })
}

export function useQuerySyncedRef (key: string, defaultValue = 'all', debounceMs = 0) {
  const route = useRoute()
  const router = useRouter()
  const initial = route.query[key]
  const value = ref(typeof initial === 'string' ? initial : defaultValue)

  let timeout: ReturnType<typeof setTimeout> | undefined
  watch(value, (next) => {
    clearTimeout(timeout)
    const queue = () => queuePatch(router, route, key, next === defaultValue ? undefined : next)
    if (debounceMs > 0) timeout = setTimeout(queue, debounceMs)
    else queue()
  })

  return value
}
