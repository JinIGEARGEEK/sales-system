import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiResponse, makeQuote } from '../factories'

describe('useSupersedeAcceptedQuotes', () => {
  beforeEach(() => {
    useQuotesStore().$reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('finds the other Accepted quotes on the same deal only', () => {
    useQuotesStore().items = [
      makeQuote({ id: 1, deal_id: 1, status: 'accepted' }),
      makeQuote({ id: 2, deal_id: 1, status: 'sent' }),
      makeQuote({ id: 3, deal_id: 1, status: 'draft' }),
      makeQuote({ id: 4, deal_id: 2, status: 'accepted' }),
    ]
    const { otherAccepted } = useSupersedeAcceptedQuotes()
    expect(otherAccepted(1, 3).map(q => q.id)).toEqual([1])
    expect(otherAccepted(1, 1)).toEqual([])
  })

  it('reloads the deal\'s quotes but keeps the open quote\'s loaded copy', async () => {
    useQuotesStore().items = [makeQuote({ id: 3, deal_id: 1, status: 'draft', notes: 'local' })]
    // The store's (reactive) copy — the editor's `quote` computed holds this one.
    const open = useQuotesStore().items[0]
    vi.spyOn(useNuxtApp().$api, 'get').mockResolvedValue(apiResponse([
      makeQuote({ id: 1, deal_id: 1, status: 'accepted' }),
      makeQuote({ id: 3, deal_id: 1, status: 'draft', notes: 'server' }),
    ]) as never)

    const others = await useSupersedeAcceptedQuotes().loadOtherAccepted(1, 3)

    expect(others.map(q => q.id)).toEqual([1])
    expect(useQuotesStore().items.find(q => q.id === 3)).toBe(open)
  })

  it('rejects the others first when told to, and resolves true', async () => {
    const accepted = makeQuote({ id: 1, deal_id: 1, status: 'accepted' })
    useQuotesStore().items = [accepted]
    const putSpy = vi.spyOn(useNuxtApp().$api, 'put').mockResolvedValue(apiResponse({ ...accepted, status: 'rejected' }) as never)

    const supersede = useSupersedeAcceptedQuotes()
    const result = supersede.resolveOthers([accepted])
    expect(supersede.pending.value?.others).toEqual([accepted])
    supersede.decide('reject')

    expect(await result).toBe(true)
    expect(putSpy).toHaveBeenCalledWith('/quotes/1', expect.objectContaining({ status: 'rejected' }))
    expect(supersede.pending.value).toBeNull()
  })

  it('keeps them on "keep" (still resolving true), and resolves false on cancel', async () => {
    const accepted = makeQuote({ id: 1, deal_id: 1, status: 'accepted' })
    const putSpy = vi.spyOn(useNuxtApp().$api, 'put')
    const supersede = useSupersedeAcceptedQuotes()

    const kept = supersede.resolveOthers([accepted])
    supersede.decide('keep')
    expect(await kept).toBe(true)

    const cancelled = supersede.resolveOthers([accepted])
    supersede.decide('cancel')
    expect(await cancelled).toBe(false)

    expect(putSpy).not.toHaveBeenCalled()
  })

  it('does not ask when there are no others', async () => {
    const supersede = useSupersedeAcceptedQuotes()
    expect(await supersede.resolveOthers([])).toBe(true)
    expect(supersede.pending.value).toBeNull()
  })
})
