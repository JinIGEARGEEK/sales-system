import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { isAxiosError } from 'axios'

// Extracts the backend's `{ error: { message } }` payload from an axios error so
// catch blocks can surface the real reason instead of a single generic string.
// Falls back to the given message when the error isn't an axios error or has no
// structured message (e.g. network failure, unexpected shape).
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message as string
  }
  return fallback
}

// Checks a ValidationError's `fields[field]` code list for `code` — e.g. the
// Deal Won gate's `{"stage":["requires_signed_contract"]}` (FR-CRM-045) —
// so a catch block can show a specific, actionable message instead of just
// the generic backend string getApiErrorMessage above returns.
export function apiErrorHasFieldCode(err: unknown, field: string, code: string): boolean {
  if (!isAxiosError(err)) return false
  const codes = err.response?.data?.error?.fields?.[field] as string[] | undefined
  return Array.isArray(codes) && codes.includes(code)
}

// The backend's machine-readable `error.code` (e.g. "CONFLICT",
// "WON_DEAL_PROTECTED", "REASON_REQUIRED"), or undefined.
export function getApiErrorCode(err: unknown): string | undefined {
  if (!isAxiosError(err)) return undefined
  return err.response?.data?.error?.code as string | undefined
}

// The backend's `error.fields` map (field → code list) from a 422 or a
// duplicate 409, or undefined when there is none.
export function getApiErrorFields(err: unknown): Record<string, string[]> | undefined {
  if (!isAxiosError(err)) return undefined
  const fields = err.response?.data?.error?.fields
  return fields && typeof fields === 'object' ? fields as Record<string, string[]> : undefined
}

// Puts a 422's `error.fields` onto the form's own inputs (vee-validate
// `setErrors` from the <Form @submit> handler's second argument), translated
// via `global.apiFieldError.<code>` with a generic fallback. `fieldMap`
// renames API fields to the form's Field names where they differ
// (e.g. { assigned_to: 'assignedTo' }). Returns true when at least one field
// matched, so the caller can skip its generic toast.
export function applyApiFieldErrors(
  err: unknown,
  setErrors: (errors: Record<string, string>) => void,
  t: (key: string) => string,
  te: (key: string) => boolean,
  fieldMap: Record<string, string> = {},
): boolean {
  const fields = getApiErrorFields(err)
  if (!fields) return false
  const errors: Record<string, string> = {}
  for (const [field, codes] of Object.entries(fields)) {
    const code = codes?.[0] ?? 'invalid'
    const key = `global.apiFieldError.${code}`
    errors[fieldMap[field] ?? field] = te(key) ? t(key) : t('global.apiFieldError.invalid')
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

