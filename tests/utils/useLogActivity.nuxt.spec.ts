import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// useLogActivity -> useI18n() needs the full i18n plugin; the stub echoes the
// key so assertions can check which message was chosen.
vi.mock('vue-i18n', async importOriginal => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key }),
}))

// Spy on the real $api instead of mockNuxtImport('useNuxtApp'): useNotify's
// useToast() resolves the real nuxtApp too (see CLAUDE.md).
const mockPost = () => vi.spyOn(useNuxtApp().$api, 'post')

const activityRow = { id: 10, type: 'call', subject: 'Intro call', notes: '', related_type: 'deal', related_id: 7, created_by: 'Me', created_at: '2026-09-27T03:00:00Z' }
const taskRow = { id: 20, related_type: 'deal', related_id: 7, title: 'Follow up: Intro call', description: '', due_date: '2026-09-30T00:00:00Z', status: 'pending', priority: 'medium', assigned_to: 5, created_at: '2026-09-27T03:00:00Z' }

describe('useLogActivity', () => {
  beforeEach(() => {
    useActivitiesStore().$reset()
    useTasksStore().$reset()
    useUserStore().id = 5
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs just the activity when no follow-up was asked for', async () => {
    const post = mockPost().mockResolvedValue({ data: { data: activityRow } })
    const { logActivity } = useLogActivity()

    const saved = await logActivity('deal', 7, { type: 'call', subject: 'Intro call', notes: '' }, 'Activity logged')

    expect(saved).toBe(true)
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/activities', expect.objectContaining({ related_type: 'deal', related_id: 7, subject: 'Intro call' }))
  })

  it('creates the follow-up task on the same record, assigned to the current user', async () => {
    const post = mockPost()
      .mockResolvedValueOnce({ data: { data: activityRow } })
      .mockResolvedValueOnce({ data: { data: taskRow } })
    const { logActivity } = useLogActivity()
    const due = new Date('2026-09-30')

    const saved = await logActivity('deal', 7, { type: 'call', subject: 'Intro call', notes: '', followUp: { title: 'Follow up: Intro call', due_date: due } }, 'Activity logged')

    expect(saved).toBe(true)
    expect(post).toHaveBeenNthCalledWith(2, '/tasks', expect.objectContaining({ related_type: 'deal', related_id: 7, title: 'Follow up: Intro call', due_date: due, assigned_to: 5 }))
    expect(useTasksStore().items).toHaveLength(1)
  })

  it('resolves a submitFailure (keep the modal open, mark its fields) when the activity fails, without creating the task', async () => {
    const failure = new Error('boom')
    const post = mockPost().mockRejectedValue(failure)
    const { logActivity } = useLogActivity()

    const saved = await logActivity('deal', 7, { type: 'call', subject: 'Intro call', notes: '', followUp: { title: 'x', due_date: new Date() } }, 'Activity logged')

    expect(saved).toEqual(submitFailure(failure))
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('still resolves true when only the follow-up fails, so Save cannot log the activity twice', async () => {
    mockPost()
      .mockResolvedValueOnce({ data: { data: activityRow } })
      .mockRejectedValueOnce(new Error('boom'))
    const { logActivity } = useLogActivity()

    const saved = await logActivity('deal', 7, { type: 'call', subject: 'Intro call', notes: '', followUp: { title: 'x', due_date: new Date() } }, 'Activity logged')

    expect(saved).toBe(true)
  })
})
