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

