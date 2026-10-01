// An inline status select where some target statuses ask first (§5.7 "Hard-to-reverse
// inline changes"). Bind `pending` to a confirm modal, `resetKey` into the
// select's :key (bumped on cancel/failure so it snaps back to the saved status),
// and call request() from the select's update:model-value.
// A function declaration so unimport doesn't read the `, T` type parameter
// as an exported name (see useScopedFetch).
export function useConfirmedStatusChange<S extends string, T extends { id: number, status: S }> ({ confirmStatuses, save, notifyError }: {
  confirmStatuses: readonly S[]
  // Persists the change (and toasts success); a throw is reported and reverts the select.
  save: (record: T, status: S) => Promise<unknown>
  // Reports a failed save — defaults to the API's message (notifyApiError);
  // pass one to translate entity-specific errors (e.g. quote 409s).
  notifyError?: (err: unknown) => void
}) {
  const { notifyApiError } = useApiErrorNotifier()
  const reportError = notifyError ?? notifyApiError

  const pending = ref<{ record: T, status: S } | null>(null) as Ref<{ record: T, status: S } | null>
  const resetKey = ref(0)

  // InputSelect can report one pick twice (its own USelect and the wrapping
  // vee-validate Field both emit update:model-value) — collapse that into one save/confirm.
  const inFlight = new Map<number, S>()

  const run = async (record: T, status: S) => {
    try {
      await save(record, status)
    } catch (err) {
      reportError(err)
      resetKey.value++
    }
  }

  const request = async (record: T, status: S) => {
    if (status === record.status || inFlight.get(record.id) === status) return
    if (confirmStatuses.includes(status)) {
      pending.value = { record, status }
      return
    }
    inFlight.set(record.id, status)
    try {
      await run(record, status)
    } finally {
      inFlight.delete(record.id)
    }
  }

  const cancel = () => {
    pending.value = null
    resetKey.value++
  }

  const confirm = async () => {
    const current = pending.value
    if (!current) return
    await run(current.record, current.status)
    pending.value = null
  }

  return { pending, resetKey, request, cancel, confirm }
}
