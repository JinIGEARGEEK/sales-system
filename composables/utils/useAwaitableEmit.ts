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

// What a dialog's parent handler resolves instead of a bare `false` when it
// caught an API error the dialog can show more of — a 422's `error.fields`
// on the matching inputs (see useModalForm's showApiFieldErrors). The parent
// still toasts its own message first, exactly as with `false`.
export interface SubmitFailure {
  submitFailed: true
  error: unknown
}

export const submitFailure = (error: unknown): SubmitFailure => ({ submitFailed: true, error })

const isSubmitFailure = (value: unknown): value is SubmitFailure =>
  typeof value === 'object' && value !== null && (value as SubmitFailure).submitFailed === true

// The dialog-submit shape built on it: emit `event`, await every bound
// handler, and call `close` only when none resolved `false` or a
// submitFailure() (a handler that failed has already shown its error). Each
// submitFailure's error goes to `onFailure`, e.g. to mark the form's fields.
// A throw propagates without closing, so the dialog stays open with the form
// intact either way. Resolves whether it closed. Must be called during
// setup, like useAwaitableEmit.
export const useAwaitableSubmit = <Args extends unknown[]>(
  close: () => void,
  event = 'submit',
  onFailure?: (error: unknown) => void,
) => {
  const emitAwaitable = useAwaitableEmit<Args>(event)

  return async (...args: Args): Promise<boolean> => {
    const results = await emitAwaitable(...args)
    const failures = results.filter(isSubmitFailure)
    failures.forEach(failure => onFailure?.(failure.error))
    const succeeded = !results.includes(false) && failures.length === 0
    if (succeeded) close()
    return succeeded
  }
}
