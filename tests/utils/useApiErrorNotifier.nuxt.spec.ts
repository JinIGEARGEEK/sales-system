import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AxiosError } from 'axios'
import { apiError } from '../factories'

// Echo i18n keys back (useI18n needs a component setup); the real useToast; useToast queues additions to the next tick.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const toastTitles = async () => {
  await nextTick()
  return useToast().toasts.value.map(toast => toast.title)
}

describe('useApiErrorNotifier', () => {
  beforeEach(() => {
    useToast().clear()
  })

  describe('notifyLoadError (a detail page\'s own record load)', () => {
    it('does not toast a 404 — the page\'s NotFoundState already says it', async () => {
      const { notifyLoadError } = useApiErrorNotifier()
      notifyLoadError(apiError(404, { code: 'NOT_FOUND', message: 'company not found' }))
      expect(await toastTitles()).toEqual([])
    })

    it('says "no access" for a 403 instead of the API\'s English text', async () => {
      const { notifyLoadError } = useApiErrorNotifier()
      notifyLoadError(apiError(403, { code: 'FORBIDDEN', message: 'forbidden' }))
      expect(await toastTitles()).toEqual(['global.noAccess'])
    })

    it('uses the translated generic message for a 5xx or a network failure', async () => {
      const { notifyLoadError } = useApiErrorNotifier()
      notifyLoadError(apiError(500, { message: 'pq: connection refused' }))
      expect(await toastTitles()).toEqual(['global.genericError'])
      useToast().clear()
      notifyLoadError(new AxiosError('Network Error', 'ERR_NETWORK'))
      expect(await toastTitles()).toEqual(['global.genericError'])
    })

    it('keeps the API\'s message for other errors', async () => {
      const { notifyLoadError } = useApiErrorNotifier()
      notifyLoadError(apiError(400, { message: 'invalid id' }))
      expect(await toastTitles()).toEqual(['invalid id'])
    })
  })

  it('notifyApiError still toasts every error, 404 included', async () => {
    const { notifyApiError } = useApiErrorNotifier()
    notifyApiError(apiError(404, { message: 'company not found' }))
    expect(await toastTitles()).toEqual(['company not found'])
  })
})
