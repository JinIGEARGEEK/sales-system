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

// The dialog-submit shape built on it: emit `event`, await every bound
// handler, and call `close` only when none resolved `false` (a handler that
// failed has already shown its error). A throw propagates without closing,
// so the dialog stays open with the form intact either way. Resolves whether
// it closed. Must be called during setup, like useAwaitableEmit.
export const useAwaitableSubmit = <Args extends unknown[]>(close: () => void, event = 'submit') => {
  const emitAwaitable = useAwaitableEmit<Args>(event)

  return async (...args: Args): Promise<boolean> => {
    const results = await emitAwaitable(...args)
    const succeeded = !results.includes(false)
    if (succeeded) close()
    return succeeded
  }
}
