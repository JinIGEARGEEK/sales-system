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

    expect(showFieldErrors(err, setErrors, ['assignedTo'], { assigned_to: 'assignedTo' })).toBe(true)
    expect(Object.keys(setErrors.mock.calls[0]![0])).toEqual(['assignedTo'])
  })
})
