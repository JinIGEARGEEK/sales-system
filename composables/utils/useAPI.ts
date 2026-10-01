import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { isAxiosError } from 'axios'

// The backend's `{ error: {...} }` body off an axios error, or undefined (a
// network failure, a non-axios throw, an unexpected shape). Every helper below
// reads through this, so no caller needs its own isAxiosError/`as` dance.
const apiErrorBody = (err: unknown): ApiErrorBody | undefined => {
  if (!isAxiosError(err)) return undefined
  const body = (err.response?.data as { error?: unknown } | undefined)?.error
  return body && typeof body === 'object' ? body as ApiErrorBody : undefined
}

// The HTTP status of a failed request, or undefined for a network failure or a
// non-axios error.
export function getApiErrorStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined
}

// The backend's `error.message`, so a catch block can surface the real reason
// instead of a single generic string; `fallback` when there is none.
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const message = apiErrorBody(err)?.message
  return typeof message === 'string' && message ? message : fallback
}

// The backend's machine-readable `error.code` (e.g. "CONFLICT",
// "WON_DEAL_PROTECTED", "REASON_REQUIRED"), or undefined.
export function getApiErrorCode(err: unknown): string | undefined {
  const code = apiErrorBody(err)?.code
  return typeof code === 'string' ? code : undefined
}

// The backend's `error.fields` map (field → code list) from a 422 or a
// duplicate 409, or undefined when there is none.
export function getApiErrorFields(err: unknown): Record<string, string[]> | undefined {
  const fields = apiErrorBody(err)?.fields
  return fields && typeof fields === 'object' ? fields : undefined
}

// Whether `error.fields[field]` lists `code` — e.g. the Deal Won gate's
// `{"stage":["requires_signed_contract"]}` (FR-CRM-045) — so a catch block can
// show a specific, actionable message instead of the generic backend string.
export function apiErrorHasFieldCode(err: unknown, field: string, code: string): boolean {
  const codes = getApiErrorFields(err)?.[field]
  return Array.isArray(codes) && codes.includes(code)
}

// A duplicate 409's `error.duplicate_of` ids (POST /leads|/prospects|/contacts),
// or undefined when the error isn't one. See getDuplicateConflict.
export function getApiErrorDuplicateIds(err: unknown): number[] | undefined {
  if (getApiErrorStatus(err) !== 409) return undefined
  const ids = apiErrorBody(err)?.duplicate_of
  return Array.isArray(ids) ? ids.map(Number).filter(Number.isFinite) : undefined
}

type Translate = (key: string) => string
type TranslationExists = (key: string) => boolean

// One field-error code in words: `global.apiFieldError.<code>`, else the
// generic "not valid" text. The single place that maps API codes to messages.
export function apiFieldErrorMessage(code: string | undefined, t: Translate, te: TranslationExists): string {
  const key = `global.apiFieldError.${code ?? 'invalid'}`
  return te(key) ? t(key) : t('global.apiFieldError.invalid')
}

// The low-level half of useApiFieldErrors (prefer that one in a form): every
// `error.fields` entry, its first code translated via apiFieldErrorMessage,
// handed to `setErrors` under its Field name (`fieldMap` renames API fields,
// e.g. { assigned_to: 'assignedTo' }). Returns true when there was any field.
export function applyApiFieldErrors(
  err: unknown,
  setErrors: (errors: Record<string, string>) => void,
  t: Translate,
  te: TranslationExists,
  fieldMap: Record<string, string> = {},
): boolean {
  const fields = getApiErrorFields(err)
  if (!fields) return false
  const errors: Record<string, string> = {}
  for (const [field, codes] of Object.entries(fields)) {
    errors[fieldMap[field] ?? field] = apiFieldErrorMessage(codes?.[0], t, te)
  }
  setErrors(errors)
  return Object.keys(errors).length > 0
}

// Whether plugins/axios.ts may navigate away on a 403/404 for this request:
// an explicit `skipErrorRedirect` wins, else only GETs (a page's own load) do —
// a mutation always just rejects so the form keeps the user's input.
export function shouldRedirectOnApiError(config?: AxiosRequestConfig): boolean {
  if (config?.skipErrorRedirect !== undefined) return !config.skipErrorRedirect
  return (config?.method ?? 'get').toLowerCase() === 'get'
}

// CREATE / UPDATE / DELETE transactions
export const useMutateApi = <T, D>(path: string) => {
  const { $api } = useNuxtApp()
  const loading = ref(false)
  const data = ref()
  const mutateMiddleware = <E>(
    execute: (path: string, payload?: E) => Promise<AxiosResponse<ApiResponse<T>>>,
  ) => async (payload?: E) => {
      loading.value = true
      try {
        const response = await execute(path, payload)
        data.value = response.data.data
        return response.data
      } finally {
        loading.value = false
      }
    }
  return {
    get: mutateMiddleware<AxiosRequestConfig<D>>($api.get),
    put: mutateMiddleware<D>($api.put),
    post: mutateMiddleware<D>($api.post),
    delete: mutateMiddleware<AxiosRequestConfig<D>>($api.delete),
    data,
    loading,
  }
}

