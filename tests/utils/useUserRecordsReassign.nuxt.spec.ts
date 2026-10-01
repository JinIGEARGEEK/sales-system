import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { AxiosError, type AxiosResponse } from 'axios'
import { KEEP_RECORDS, updateLosesRecords } from '~/composables/utils/useUserRecordsReassign'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: unknown) => (params === undefined ? key : `${key} ${JSON.stringify(params)}`),
    te: () => false,
  }),
}))

const { successMock, warningMock, errorMock } = vi.hoisted(() => ({ successMock: vi.fn(), warningMock: vi.fn(), errorMock: vi.fn() }))
mockNuxtImport('useNotify', () => () => ({ success: successMock, error: errorMock, info: vi.fn(), warning: warningMock, notify: vi.fn() }))

const apiError = (status: number, error: Record<string, unknown>) =>
  new AxiosError('Request failed', String(status), undefined, undefined, { status, data: { error } } as AxiosResponse)

const user = (id: number, role: string, isActive = true) =>
  ({ id, first_name: `U${id}`, last_name: '', role, is_active: isActive, deleted_at: null }) as unknown as AdminUser

describe('updateLosesRecords', () => {
  it('mirrors the API: deactivating, or an active pipeline user moving to Production', () => {
    expect(updateLosesRecords(user(1, 'Sales Rep'), { role: 'Sales Rep', status: 'inactive' })).toBe(true)
    expect(updateLosesRecords(user(1, 'Marketing'), { role: 'Production', status: 'active' })).toBe(true)
    expect(updateLosesRecords(user(1, 'Sales Rep'), { role: 'Sales Manager', status: 'active' })).toBe(false)
    expect(updateLosesRecords(user(1, 'Sales Rep', false), { role: 'Production', status: 'inactive' })).toBe(false)
  })
})

describe('useUserRecordsReassign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUsersStore().items = [user(1, 'Admin'), user(2, 'Sales Rep'), user(3, 'Production'), user(4, 'Marketing', false), user(5, 'Marketing')]
  })

  it('offers keep + active sales-role users other than the ones being removed', () => {
    const { reassignOptions, toReassignTo } = useUserRecordsReassign()

    expect(reassignOptions([2]).map(o => o.value)).toEqual([KEEP_RECORDS, '1', '5'])
    expect(toReassignTo(KEEP_RECORDS)).toBeUndefined()
    expect(toReassignTo('5')).toBe(5)
  })

  it('toasts what moved and warns about what is left', () => {
    const { notifyRecordsResult } = useUserRecordsReassign()

    notifyRecordsResult('U2', {
      reassigned: { deals: 2, leads: 0, prospects: 0, tasks: 1, total: 3, user_id: 2, reassign_to: 5 },
      open_records: { deals: 0, leads: 1, prospects: 0, tasks: 0, total: 1 },
    })

    expect(successMock.mock.calls[0]![0]).toContain('admin.users.reassign.moved')
    expect(successMock.mock.calls[0]![0]).toContain('"to":"U5"')
    expect(warningMock.mock.calls[0]![0]).toContain('admin.users.reassign.remaining')
  })

  it('translates the self-change 422, the last-Admin 409 and a bad reassign_to', () => {
    const { userGuardMessage, applyUserFieldErrors } = useUserRecordsReassign()

    expect(userGuardMessage(apiError(409, { code: 'CONFLICT', message: 'last admin' }))).toBe('admin.users.errors.lastAdmin')
    expect(userGuardMessage(apiError(422, { code: 'VALIDATION_ERROR', fields: { ids: ['You cannot…'] } }))).toBe('admin.users.errors.selfChange')

    const setErrors = vi.fn()
    applyUserFieldErrors(apiError(422, { code: 'VALIDATION_ERROR', fields: { status: ['You cannot…'], reassign_to: ['invalid'] } }), setErrors)
    expect(setErrors).toHaveBeenCalledWith({ status: 'admin.users.errors.selfChange', reassign_to: 'admin.users.errors.reassignInvalid' })
  })
})
