import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeDeal, apiResponse } from '../factories'

// useWonFollowUpTask itself calls useI18n() directly, and useApiErrorNotifier
// does too — same mocking approach as tests/utils/useContractGate.nuxt.spec.ts.
// `t` just needs to echo the key back so wonFollowUpTaskTitle can be asserted.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// tasksStore.add goes through useNuxtApp().$api, and useNotify (called on
// success below) needs the real useNuxtApp/useToast machinery intact — same
// spy-on-the-real-instance approach as tests/utils/useContractGate.nuxt.spec.ts
// (mocking the whole useNuxtApp() auto-import breaks useToast's own internal
// call to it).
const mockPost = () => vi.spyOn(useNuxtApp().$api, 'post')

describe('useWonFollowUpTask', () => {
  beforeEach(() => {
    useTasksStore().$reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('does nothing when the deal ref is null', () => {
    const postSpy = mockPost()
    const dealRef = ref<Deal | null>(null)
    const { createWonFollowUpTask } = useWonFollowUpTask(1, dealRef)

    createWonFollowUpTask()

    expect(postSpy).not.toHaveBeenCalled()
  })

  it('creates a task related to the deal, due 3 days out, assigned to the deal owner', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'))
    const deal = makeDeal({ id: 42, assigned_to: 7 })
    const dealRef = ref<Deal | null>(deal)
    const createdTask = { id: 1, related_type: 'deal', related_id: 42, title: 'crm.deals.detail.wonFollowUpTaskTitle', description: '', due_date: new Date('2026-06-04'), status: 'pending', priority: 'medium', assigned_to: 7, created_at: new Date() } as Task
    const postSpy = mockPost().mockResolvedValueOnce(apiResponse(createdTask) as never)

    const { createWonFollowUpTask } = useWonFollowUpTask(42, dealRef)
    createWonFollowUpTask()

    expect(postSpy).toHaveBeenCalledWith('/tasks', expect.objectContaining({
      related_type: 'deal',
      related_id: 42,
      title: 'crm.deals.detail.wonFollowUpTaskTitle',
      priority: 'medium',
      assigned_to: 7,
    }))
    const [, payload] = postSpy.mock.calls[0] as [string, { due_date: Date }]
    expect(payload.due_date.toISOString().slice(0, 10)).toBe('2026-06-04')
  })
})
