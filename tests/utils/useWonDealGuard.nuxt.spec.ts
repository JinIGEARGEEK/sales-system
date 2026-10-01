import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeDeal, apiResponse, apiError } from '../factories'

// Echo i18n keys back; spy on the real $api instance (useNotify needs the
// real useNuxtApp/useToast machinery intact — see CLAUDE.md).
vi.mock('vue-i18n', async importOriginal => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key }),
}))

const reasonRequired = () => apiError(409, { code: 'REASON_REQUIRED', message: 'pass ?reason= to move it out of Won' })
const protectedDeal = () => apiError(409, { code: 'WON_DEAL_PROTECTED', message: 'only a manager can delete it' })
const toastTitles = () => useToast().toasts.value.map(toast => toast.title)

describe('useWonDealGuard', () => {
  beforeEach(() => {
    useDealsStore().$reset()
    useToast().clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('asks a manager for a reason on REASON_REQUIRED and retries the move with ?reason=', async () => {
    const api = useNuxtApp().$api
    const moved = makeDeal({ id: 5, stage: 'Negotiation', status: 'open' })
    const patchSpy = vi.spyOn(api, 'patch')
      .mockRejectedValueOnce(reasonRequired())
      .mockResolvedValueOnce(apiResponse(moved) as never)
    const askReason = vi.fn().mockResolvedValue('Customer cancelled the contract')
    const store = useDealsStore()

    const { run } = useWonDealGuard({ askReason })
    const result = await run('unwin', reason => store.updateStage(5, 'Negotiation', undefined, undefined, reason))

    expect(askReason).toHaveBeenCalledWith('unwin')
    expect(patchSpy).toHaveBeenCalledTimes(2)
    // First attempt without the reason, so a non-protected deal moves as before.
    expect(patchSpy.mock.calls[0]).toEqual(['/deals/5/stage', { stage: 'Negotiation', position: undefined, lost_reason: undefined }])
    expect(patchSpy.mock.calls[1]).toEqual([
      '/deals/5/stage',
      { stage: 'Negotiation', position: undefined, lost_reason: undefined },
      { params: { reason: 'Customer cancelled the contract' } },
    ])
    expect(result?.id).toBe(5)
  })

  it('retries a delete with the reason the manager gave', async () => {
    const api = useNuxtApp().$api
    const deleteSpy = vi.spyOn(api, 'delete')
      .mockRejectedValueOnce(reasonRequired())
      .mockResolvedValueOnce({ data: {} } as never)
    const store = useDealsStore()
    store.items = [makeDeal({ id: 8, status: 'won' })]

    const { run } = useWonDealGuard({ askReason: async () => 'Entered twice' })
    const result = await run('delete', async (reason) => {
      await store.remove(8, reason)
      return true
    })

    expect(result).toBe(true)
    expect(deleteSpy).toHaveBeenLastCalledWith('/deals/8', { params: { reason: 'Entered twice' } })
    expect(store.items).toHaveLength(0)
  })

  it('does nothing more when the manager dismisses the reason prompt', async () => {
    const api = useNuxtApp().$api
    const patchSpy = vi.spyOn(api, 'patch').mockRejectedValue(reasonRequired())
    const askReason = vi.fn().mockResolvedValue(null)

    const { run } = useWonDealGuard({ askReason })
    const result = await run('unwin', reason => useDealsStore().updateStage(5, 'Lead', undefined, undefined, reason))

    expect(result).toBeNull()
    expect(patchSpy).toHaveBeenCalledTimes(1)
    expect(toastTitles()).toEqual([])
  })

  it('explains WON_DEAL_PROTECTED without asking for a reason', async () => {
    const askReason = vi.fn()
    const fn = vi.fn().mockRejectedValue(protectedDeal())

    const { run } = useWonDealGuard({ askReason })
    const result = await run('delete', fn)

    expect(result).toBeNull()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(askReason).not.toHaveBeenCalled()
    expect(toastTitles()).toEqual(['crm.deals.wonDeal.protected.delete'])
  })

  it('rethrows any other error for the caller to report', async () => {
    const failure = apiError(422, { code: 'VALIDATION_ERROR', fields: { lost_reason: ['required'] } })
    const askReason = vi.fn()

    const { run } = useWonDealGuard({ askReason })

    await expect(run('unwin', () => Promise.reject(failure))).rejects.toBe(failure)
    expect(askReason).not.toHaveBeenCalled()
  })

  it('returns the first result untouched when the deal is not protected', async () => {
    const askReason = vi.fn()
    const fn = vi.fn().mockResolvedValue('moved')

    const { run } = useWonDealGuard({ askReason })

    expect(await run('unwin', fn)).toBe('moved')
    expect(fn).toHaveBeenCalledWith()
    expect(askReason).not.toHaveBeenCalled()
  })
})
