import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { AxiosError, type AxiosResponse } from 'axios'
import { getDuplicateConflict } from '~/composables/utils/useDuplicateConflict'

// `te` knows the apiFieldError codes the backend sends here, so
// applyApiFieldErrors translates instead of falling back to "invalid".
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    te: (key: string) => ['global.apiFieldError.duplicate', 'global.apiFieldError.invalid'].includes(key),
  }),
}))

// Same approach as tests/utils/useTaskQuickActions.nuxt.spec.ts: capture the
// toasts without the real toast machinery.
const { successMock, errorMock } = vi.hoisted(() => ({ successMock: vi.fn(), errorMock: vi.fn() }))
mockNuxtImport('useNotify', () => () => ({ success: successMock, error: errorMock, info: vi.fn(), warning: vi.fn(), notify: vi.fn() }))

const apiError = (status: number, error: Record<string, unknown>) =>
  new AxiosError('Request failed', String(status), undefined, undefined, { status, data: { error } } as AxiosResponse)

// The 409 POST /leads|/prospects|/contacts send for a same-email/phone match.
const duplicate409 = (fields: Record<string, string[]>, ids: number[]) =>
  apiError(409, { code: 'CONFLICT', message: 'A lead with the same email already exists', fields, duplicate_of: ids })

describe('getDuplicateConflict', () => {
  it('reads the matched fields and ids off a duplicate 409', () => {
    expect(getDuplicateConflict(duplicate409({ phone: ['duplicate'], email: ['duplicate'] }, [4, 9])))
      .toEqual({ fields: ['email', 'phone'], ids: [4, 9] })
  })

  it('ignores a plain CONFLICT without duplicate_of, a 422, and non-axios errors', () => {
    expect(getDuplicateConflict(apiError(409, { code: 'CONFLICT', message: 'Locked' }))).toBeNull()
    expect(getDuplicateConflict(apiError(422, { code: 'VALIDATION_ERROR', fields: { email: ['duplicate'] }, duplicate_of: [1] }))).toBeNull()
    expect(getDuplicateConflict(new Error('boom'))).toBeNull()
  })
})

describe('useCreateWithDuplicateCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const setup = () => {
    const email = ref('a@example.com')
    const create = vi.fn()
    const onCreated = vi.fn()
    const setErrors = vi.fn()
    const flow = useCreateWithDuplicateCheck({ create, onCreated, resetOn: () => [email.value] })
    return { email, create, onCreated, setErrors, flow }
  }

  it('shows the duplicate instead of a toast, then "Create anyway" resends with allowDuplicate', async () => {
    const { create, onCreated, setErrors, flow } = setup()
    create.mockRejectedValueOnce(duplicate409({ email: ['duplicate'] }, [12]))

    await flow.onSubmit({}, { setErrors })

    expect(create).toHaveBeenLastCalledWith(false)
    expect(flow.conflict.value).toEqual({ fields: ['email'], ids: [12] })
    expect(setErrors).toHaveBeenCalledWith({ email: 'global.apiFieldError.duplicate' })
    expect(errorMock).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()

    create.mockResolvedValueOnce({ id: 13 })
    await flow.createAnyway()

    expect(create).toHaveBeenLastCalledWith(true)
    expect(onCreated).toHaveBeenCalledWith({ id: 13 })
    expect(flow.conflict.value).toBeNull()
  })

  it('clears a stale conflict once the matched value is edited, so "Create anyway" does nothing', async () => {
    const { email, create, flow } = setup()
    create.mockRejectedValueOnce(duplicate409({ email: ['duplicate'] }, [12]))
    await flow.onSubmit({}, { setErrors: vi.fn() })

    email.value = 'b@example.com'
    await nextTick()

    expect(flow.conflict.value).toBeNull()
    await flow.createAnyway()
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('puts a 422 (e.g. an inactive assigned_to) on the field instead of a toast', async () => {
    const { create, setErrors, flow } = setup()
    create.mockRejectedValueOnce(apiError(422, { code: 'VALIDATION_ERROR', message: 'bad', fields: { assigned_to: ['invalid'] } }))

    await flow.onSubmit({}, { setErrors })

    expect(setErrors).toHaveBeenCalledWith({ assigned_to: 'global.apiFieldError.invalid' })
    expect(errorMock).not.toHaveBeenCalled()
    expect(flow.conflict.value).toBeNull()
  })

  it('toasts any other failure with the server message', async () => {
    const { create, flow } = setup()
    create.mockRejectedValueOnce(apiError(500, { code: 'INTERNAL_ERROR', message: 'Failed to create lead' }))

    await flow.onSubmit({}, { setErrors: vi.fn() })

    expect(errorMock).toHaveBeenCalledWith('Failed to create lead')
  })
})
