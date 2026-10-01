// A Deal should have one Accepted Quote — the receivable, the revenue and
// the payment defaults all read the latest one (dealReceivable). Before a
// Quote is accepted while others on the same Deal already are, ask whether
// to mark those Rejected. Bind `pending` to CrmSupersedeAcceptedQuotesModal
// and call `decide()` from it.
//
// Order matters: the others are rejected FIRST, then the new one accepted,
// so the Deal never has two Accepted quotes at once (the API may enforce one
// Accepted Quote per Deal with a 409). Declining keeps them Accepted and
// accepts anyway — if the API refuses that, its error reaches the caller's
// notifier like any other.
export type SupersedeDecision = 'reject' | 'keep' | 'cancel'

export const useSupersedeAcceptedQuotes = () => {
  const quotesStore = useQuotesStore()
  const pending = ref<{ others: Quote[], resolve: (decision: SupersedeDecision) => void } | null>(null)

  // The other Accepted quotes already in the store for this Deal.
  const otherAccepted = (dealId: number, quoteId: number) =>
    quotesStore.forDeal(dealId).filter(q => q.id !== quoteId && q.status === 'accepted')

  // Re-reads the Deal's quotes first (the editor page loads only its own),
  // keeping the open Quote's loaded copy so its form isn't reset.
  const loadOtherAccepted = async (dealId: number, quoteId: number) => {
    await quotesStore.fetchForDeal(dealId, quoteId)
    return otherAccepted(dealId, quoteId)
  }

  // Resolves 'cancel' straight away if a question is already open (e.g. a
  // select reporting the same pick twice).
  const ask = (others: Quote[]) => new Promise<SupersedeDecision>((resolve) => {
    if (pending.value) {
      resolve('cancel')
      return
    }
    pending.value = { others, resolve }
  })

  const decide = (decision: SupersedeDecision) => {
    const current = pending.value
    pending.value = null
    current?.resolve(decision)
  }

  // One at a time, so a failure stops before the new quote is accepted.
  const rejectAll = async (others: Quote[]) => {
    for (const other of others) await quotesStore.updateStatus(other.id, 'rejected')
  }

  // Asks about `others` (if any) and rejects them when told to. false =
  // the user cancelled, so the acceptance shouldn't happen.
  const resolveOthers = async (others: Quote[]): Promise<boolean> => {
    if (others.length === 0) return true
    const decision = await ask(others)
    if (decision === 'cancel') return false
    if (decision === 'reject') await rejectAll(others)
    return true
  }

  return { pending, decide, otherAccepted, loadOtherAccepted, resolveOthers }
}

export type SupersedeAcceptedQuotes = ReturnType<typeof useSupersedeAcceptedQuotes>
