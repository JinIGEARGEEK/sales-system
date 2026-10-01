import { describe, it, expect, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

const apiError = (status: number, error: Record<string, unknown>) => {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status, statusText: '', headers: {}, config, data: { error },
  })
}

// Translator stand-ins: a key "exists" when it's in `known`.
const known = new Set(['global.apiFieldError.invalid', 'global.apiFieldError.required', 'global.apiFieldError.duplicate'])
const t = (key: string) => `t:${key}`
const te = (key: string) => known.has(key)

describe('applyApiFieldErrors', () => {
  it('sets each field\'s first code, translated, and reports a match', () => {
    const setErrors = vi.fn()
    const err = apiError(422, { code: 'VALIDATION_ERROR', fields: { name: ['required'], email: ['duplicate', 'invalid'] } })

    expect(applyApiFieldErrors(err, setErrors, t, te)).toBe(true)
    expect(setErrors).toHaveBeenCalledWith({
      name: 't:global.apiFieldError.required',
      email: 't:global.apiFieldError.duplicate',
    })
  })

  it('falls back to the generic message for an unknown code and renames via fieldMap', () => {
    const setErrors = vi.fn()
    const err = apiError(422, { fields: { assigned_to: ['not_a_sales_user'] } })

    applyApiFieldErrors(err, setErrors, t, te, { assigned_to: 'assignedTo' })
    expect(setErrors).toHaveBeenCalledWith({ assignedTo: 't:global.apiFieldError.invalid' })
  })

  it('leaves the form alone without `fields` (a plain 409/500, a network error)', () => {
    const setErrors = vi.fn()
    expect(applyApiFieldErrors(apiError(409, { code: 'CONFLICT', message: 'x' }), setErrors, t, te)).toBe(false)
    expect(applyApiFieldErrors(new Error('offline'), setErrors, t, te)).toBe(false)
    expect(setErrors).not.toHaveBeenCalled()
  })
})

describe('getApiErrorCode / getApiErrorFields', () => {
  it('reads the backend envelope', () => {
    const err = apiError(409, { code: 'CONFLICT', fields: { email: ['duplicate'] } })
    expect(getApiErrorCode(err)).toBe('CONFLICT')
    expect(getApiErrorFields(err)).toEqual({ email: ['duplicate'] })
    expect(getApiErrorCode(new Error('x'))).toBeUndefined()
  })
})

describe('shouldRedirectOnApiError', () => {
  it('redirects for GETs (a page\'s own load) and never for mutations by default', () => {
    expect(shouldRedirectOnApiError({ method: 'get' })).toBe(true)
    expect(shouldRedirectOnApiError(undefined)).toBe(true)
    for (const method of ['post', 'put', 'patch', 'delete', 'POST']) {
      expect(shouldRedirectOnApiError({ method })).toBe(false)
    }
  })

  it('lets skipErrorRedirect override either default', () => {
    expect(shouldRedirectOnApiError({ method: 'get', skipErrorRedirect: true })).toBe(false)
    expect(shouldRedirectOnApiError({ method: 'post', skipErrorRedirect: false })).toBe(true)
  })
})

describe('useApiFieldErrors', () => {
  it('only marks fields the form renders, and asks for the toast when one is missing', () => {
    const showFieldErrors = useApiFieldErrors()
    const setErrors = vi.fn()
    const err = apiError(422, { fields: { name: ['required'], 'deal.stage': ['invalid'] } })

    expect(showFieldErrors(err, setErrors, { name: '', email: '' })).toBe(false)
    expect(Object.keys(setErrors.mock.calls[0]![0])).toEqual(['name'])
  })

  it('reports success when every field landed', () => {
    const showFieldErrors = useApiFieldErrors()
    const setErrors = vi.fn()
    const err = apiError(422, { fields: { assigned_to: ['invalid'] } })

    expect(showFieldErrors(err, setErrors, ['assignedTo'], { fieldMap: { assigned_to: 'assignedTo' } })).toBe(true)
    expect(Object.keys(setErrors.mock.calls[0]![0])).toEqual(['assignedTo'])
  })

  it('still marks the rendered fields when some API field has no input, but asks for the toast', () => {
    const showFieldErrors = useApiFieldErrors()
    const setErrors = vi.fn()
    const err = apiError(422, { fields: { amount: ['required'], deal_id: ['invalid'] } })

    expect(showFieldErrors(err, setErrors, ['amount', 'note'])).toBe(false)
    expect(setErrors).toHaveBeenCalledTimes(1)
    expect(Object.keys(setErrors.mock.calls[0]![0])).toEqual(['amount'])
  })

  it('uses a per-field message override instead of the generic code text', () => {
    const showFieldErrors = useApiFieldErrors()
    const setErrors = vi.fn()
    const err = apiError(422, { fields: { assigned_to: ['invalid'], name: ['required'] } })

    expect(showFieldErrors(err, setErrors, ['assigned_to', 'name'], { messages: { assigned_to: 'Pick an active sales user' } })).toBe(true)
    const shown = setErrors.mock.calls[0]![0] as Record<string, string>
    expect(shown.assigned_to).toBe('Pick an active sales user')
    expect(shown.name).toBe(useNuxtApp().$i18n.t('global.apiFieldError.required'))
  })

  it('sets nothing and asks for the toast when no field is rendered or the error has no fields', () => {
    const showFieldErrors = useApiFieldErrors()
    const setErrors = vi.fn()

    expect(showFieldErrors(apiError(422, { fields: { deal: ['invalid'] } }), setErrors, ['name'])).toBe(false)
    expect(showFieldErrors(apiError(500, { message: 'boom' }), setErrors, ['name'])).toBe(false)
    expect(setErrors).not.toHaveBeenCalled()
  })
})
