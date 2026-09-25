// emit() never returns a listener's result, so a dialog can't await its
// caller's async handler through it (to keep a spinner up, block re-clicks,
// or stay open on failure). This calls the bound `on<Event>` listener(s)
// directly and resolves with what they returned.
export const useAwaitableEmit = <Args extends unknown[]>(event: string) => {
  const instance = getCurrentInstance()
  const prop = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`

  return (...args: Args): Promise<unknown[]> => {
    const bound = instance?.vnode.props?.[prop] as ((...a: Args) => unknown) | ((...a: Args) => unknown)[] | undefined
    const handlers = bound ? (Array.isArray(bound) ? bound : [bound]) : []
    return Promise.all(handlers.map(handler => handler(...args)))
  }
}
