import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { apiResponse } from '../factories'
import { snoozedDueDate } from '~/composables/utils/useTaskQuickActions'

// useTaskQuickActions / useApiErrorNotifier call useI18n() directly — same
// mocking approach as tests/utils/useContractGate.nuxt.spec.ts.
vi.mock('vue-i18n', async importOriginal => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key }),
}))

// Capture the toasts (and the Undo action) without the real toast machinery.
// Mocking useNotify — not useNuxtApp — leaves the real $api in place for the
// spyOn below (CLAUDE.md test-mocking guidance).
const { successMock, errorMock } = vi.hoisted(() => ({ successMock: vi.fn(), errorMock: vi.fn() }))
mockNuxtImport('useNotify', () => () => ({ success: successMock, error: errorMock, info: vi.fn(), warning: vi.fn(), notify: vi.fn() }))

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 5,
  related_type: 'deal',
  related_id: 1,
  title: 'Call back',
  description: 'About the renewal',
  due_date: new Date(2026, 8, 28, 7),
  status: 'pending',
  priority: 'high',
  assigned_to: 3,
  created_at: new Date(2026, 8, 1),
  ...overrides,
})

// Thursday 1 Oct 2026, early morning local time.
const NOW = new Date(2026, 9, 1, 6, 30)

describe('snoozedDueDate', () => {
  it('counts from the local today, pinned to local noon', () => {
    expect(snoozedDueDate('tomorrow', NOW)).toEqual(new Date(2026, 9, 2, 12))
    expect(snoozedDueDate('threeDays', NOW)).toEqual(new Date(2026, 9, 4, 12))
    // "Next week" is a flat +7 days, not next Monday.
    expect(snoozedDueDate('nextWeek', NOW)).toEqual(new Date(2026, 9, 8, 12))
  })

  it('crosses a month end on the local calendar', () => {
    expect(snoozedDueDate('nextWeek', new Date(2026, 9, 28, 23, 50))).toEqual(new Date(2026, 10, 4, 12))
  })
})

describe('useTaskQuickActions', () => {
  beforeEach(() => {
    useTasksStore().$reset()
    successMock.mockReset()
    errorMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('marks done at once, then offers an Undo that toggles it back', async () => {
    const task = makeTask()
    const patchSpy = vi.spyOn(useNuxtApp().$api, 'patch')
      .mockResolvedValueOnce(apiResponse({ ...task, status: 'done' }) as never)
      .mockResolvedValueOnce(apiResponse(task) as never)
    const onChanged = vi.fn()

    const { toggleDone } = useTaskQuickActions(onChanged)
    expect(await toggleDone(task)).toBe(true)

    expect(patchSpy).toHaveBeenCalledWith('/tasks/5/toggle')
    expect(onChanged).toHaveBeenCalledWith(5)
    expect(successMock).toHaveBeenCalledWith('crm.components.taskList.markDoneSuccess', expect.objectContaining({ label: 'crm.components.taskList.undo' }))

    const action = successMock.mock.calls[0]![1] as { onClick: () => Promise<void> }
    await action.onClick()
    expect(patchSpy).toHaveBeenCalledTimes(2)
    expect(onChanged).toHaveBeenCalledTimes(2)
    expect(successMock).toHaveBeenLastCalledWith('crm.components.taskList.reopenSuccess')
  })

  it('reopens a done task without a toast', async () => {
    const task = makeTask({ status: 'done' })
    vi.spyOn(useNuxtApp().$api, 'patch').mockResolvedValueOnce(apiResponse({ ...task, status: 'pending' }) as never)

    const { toggleDone } = useTaskQuickActions()
    await toggleDone(task)

    expect(successMock).not.toHaveBeenCalled()
  })

  it('shows no success toast and skips onChanged when the toggle fails', async () => {
    vi.spyOn(useNuxtApp().$api, 'patch').mockRejectedValueOnce(new Error('boom'))
    const onChanged = vi.fn()

    const { toggleDone } = useTaskQuickActions(onChanged)
    expect(await toggleDone(makeTask())).toBe(false)

    expect(onChanged).not.toHaveBeenCalled()
    expect(successMock).not.toHaveBeenCalled()
    expect(errorMock).toHaveBeenCalled()
  })

  it('snoozes with the full-record payload, only due_date changed', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const task = makeTask()
    const patchSpy = vi.spyOn(useNuxtApp().$api, 'patch')
      .mockResolvedValueOnce(apiResponse({ ...task, due_date: new Date(2026, 9, 4, 12) }) as never)
    const onChanged = vi.fn()

    const { snooze } = useTaskQuickActions(onChanged)
    expect(await snooze(task, 'threeDays')).toBe(true)

    expect(patchSpy).toHaveBeenCalledWith('/tasks/5', {
      title: 'Call back',
      description: 'About the renewal',
      due_date: new Date(2026, 9, 4, 12),
      priority: 'high',
      assigned_to: 3,
    })
    expect(onChanged).toHaveBeenCalledWith(5)
    expect(successMock).toHaveBeenCalledWith('crm.components.taskList.snoozeSuccess')
  })
})
