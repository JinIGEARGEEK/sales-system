import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// Echo the key plus its params so assertions can see what was interpolated;
// `te` knows only the one real skip reason, so anything else hits the
// `unknown` fallback.
vi.mock('vue-i18n', async importOriginal => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    te: (key: string) => key.endsWith('archiveSkipReason.won_deal_with_money'),
  }),
}))

// Capture the toasts (and the Undo action) without the real toast machinery —
// same approach as tests/utils/useTaskQuickActions.nuxt.spec.ts.
const { successMock, errorMock, warningMock } = vi.hoisted(() => ({ successMock: vi.fn(), errorMock: vi.fn(), warningMock: vi.fn() }))
mockNuxtImport('useNotify', () => () => ({ success: successMock, error: errorMock, info: vi.fn(), warning: warningMock, notify: vi.fn() }))

describe('useBulkArchiveUndo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('offers Undo for the archived ids only and warns about the skipped ones by name and reason', async () => {
    const restore = vi.fn().mockResolvedValue({})
    const refetch = vi.fn()
    const { notifyArchivedWithUndo } = useBulkArchiveUndo()

    notifyArchivedWithUndo({
      ids: [1, 3],
      skipped: [{ id: 2, reason: 'won_deal_with_money' }, { id: 4, reason: 'won_deal_with_money' }],
      nameOf: id => (id === 2 ? 'Big Win' : undefined),
      entity: 'deals',
      restore,
      refetch,
    })

    expect(successMock).toHaveBeenCalledTimes(1)
    expect(successMock.mock.calls[0]![0]).toContain('"count":2')
    expect(warningMock).toHaveBeenCalledTimes(1)
    const warning = warningMock.mock.calls[0]![0] as string
    expect(warning).toContain('archiveSkipped')
    expect(warning).toContain('Big Win, #4')
    // One reason sentence, not one per skipped row.
    expect(warning.match(/archiveSkipReason\.won_deal_with_money/g)).toHaveLength(1)

    // Undo restores exactly what was archived — never the skipped deal.
    await successMock.mock.calls[0]![1].onClick()
    expect(restore.mock.calls.map(c => c[0])).toEqual([1, 3])
    expect(refetch).toHaveBeenCalled()
  })

  it('shows only the skipped warning (no Undo toast) when nothing was archived', () => {
    const { notifyArchivedWithUndo } = useBulkArchiveUndo()

    notifyArchivedWithUndo({ ids: [], skipped: [{ id: 9, reason: 'something_new' }], entity: 'deals', restore: vi.fn(), refetch: vi.fn() })

    expect(successMock).not.toHaveBeenCalled()
    expect(warningMock.mock.calls[0]![0]).toContain('#9')
    expect(warningMock.mock.calls[0]![0]).toContain('archiveSkipReason.unknown')
  })

  it('keeps the plain success + Undo toast for a lead/prospect archive with nothing skipped', () => {
    const { notifyArchivedWithUndo } = useBulkArchiveUndo()

    notifyArchivedWithUndo({ ids: [5], entity: 'leads', restore: vi.fn(), refetch: vi.fn() })

    expect(successMock).toHaveBeenCalledTimes(1)
    expect(warningMock).not.toHaveBeenCalled()
  })
})
