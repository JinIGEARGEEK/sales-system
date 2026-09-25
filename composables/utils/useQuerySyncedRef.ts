import type { Ref } from 'vue'

// A list-page filter/search/tab/view ref that lives in the URL: the initial
// value seeds from the route query (so a Dashboard deep link like
// /crm/deals?stage=Won lands pre-filtered, and a refresh restores the view),
// and every later change is written back via router.replace, so a filter
// picked by hand also survives a back-button return to this page.
// `defaultValue` is omitted from the URL once matched, so a filter reset back
// to "all" doesn't leave a stale `?key=all` behind.
//
// It's also two-way the other direction: when route.query[key] changes
// without this page remounting (browser back/forward between two entries of
// the same page, or a nav link to the bare list URL while already on it),
// the ref follows the URL — back to `defaultValue` when the key is absent.
//
// `replace`, not `push`, on purpose: flipping filters shouldn't flood the
// history stack with one entry per keystroke/click.
//
// `debounceMs` (default 0) delays the URL write only — pass the same delay
// as the page's own refetchDebounced (typically 400) for a free-text search
// field, so the address bar doesn't rewrite on every keystroke.
//
// `allowed` (optional) whitelists the values the URL may seed — anything else
// (a hand-edited or stale link) falls back to `defaultValue` instead of
// leaving e.g. a view toggle stuck on a value no branch of the page renders.
//
// Every instance on a page shares one pending-patch queue (module-level, one
// per app since there's one router) rather than each reading/writing
// `route.query` independently: two filters changing in the same tick (or a
// debounced write landing mid-flight of an immediate one) would otherwise
// race — the second call's `router.replace` reads a `route.query` snapshot
// that doesn't yet reflect the first call's still-in-flight write, and
// silently drops it. Queuing merges every pending key into one `replace`
// instead. The queue is tagged with the page path it was queued for and
// dropped if the router has since moved to another page, so a late write
// can never rewrite some other page's query string.
let pendingPatch: Record<string, string | undefined> = {}
let pendingPath: string | null = null
let flushScheduled = false

function queuePatch (router: ReturnType<typeof useRouter>, path: string, key: string, value: string | undefined) {
  if (pendingPath !== null && pendingPath !== path) pendingPatch = {}
  pendingPath = path
  pendingPatch[key] = value
  if (flushScheduled) return
  flushScheduled = true
  nextTick(() => {
    flushScheduled = false
    const patch = pendingPatch
    const targetPath = pendingPath
    pendingPatch = {}
    pendingPath = null
    const current = router.currentRoute.value
    if (current.path !== targetPath) return
    const query = Object.fromEntries(Object.entries({ ...current.query, ...patch }).filter(([, v]) => v !== undefined))
    router.replace({ query })
  })
}

export function useQuerySyncedRef<T extends string = string> (
  key: string,
  // NoInfer: a literal default like 'projects'/'' must not narrow T to that
  // one literal — T stays `string` unless the caller passes it explicitly
  // (e.g. useQuerySyncedRef<'kanban' | 'list'>('view', 'kanban', 0, [...])).
  defaultValue: NoInfer<T> = 'all' as NoInfer<T>,
  debounceMs = 0,
  allowed?: readonly NoInfer<T>[],
): Ref<T> {
  const route = useRoute()
  const router = useRouter()
  const path = route.path

  const parse = (raw: unknown): T => {
    if (typeof raw !== 'string') return defaultValue
    if (allowed && !allowed.includes(raw as T)) return defaultValue
    return raw as T
  }

  const value = ref(parse(route.query[key])) as Ref<T>

  let timeout: ReturnType<typeof setTimeout> | undefined
  // Set while the ref is being updated *from* the URL, so the write-back
  // watcher below doesn't echo that same value straight back into the URL.
  let syncingFromRoute = false
  // The value this instance most recently wrote to the URL, until that write
  // lands. router.replace resolves asynchronously (route middleware runs
  // first), so a user who keeps typing in the meantime would otherwise see
  // their own older write arrive as an "external" URL change and clobber the
  // newer text they just typed.
  let pendingEcho: { value: T } | null = null

  watch(value, (next) => {
    clearTimeout(timeout)
    if (syncingFromRoute) {
      syncingFromRoute = false
      return
    }
    const queue = () => {
      pendingEcho = { value: next }
      queuePatch(router, path, key, next === defaultValue ? undefined : next)
    }
    if (debounceMs > 0) timeout = setTimeout(queue, debounceMs)
    else queue()
  })

  watch(() => router.currentRoute.value.query[key], (raw) => {
    // Ignore the query change that comes with navigating away to another
    // page — resetting filters on the page being left would just fire a
    // pointless refetch on its way out.
    if (router.currentRoute.value.path !== path) return
    const next = parse(raw)
    if (pendingEcho && pendingEcho.value === next) {
      pendingEcho = null
      return
    }
    pendingEcho = null
    // A still-pending debounced write (search typed <400ms ago) means the
    // URL is simply behind the ref, not that the user navigated.
    if (next === value.value) return
    clearTimeout(timeout)
    syncingFromRoute = true
    value.value = next
  })

  onScopeDispose(() => clearTimeout(timeout))

  return value
}
