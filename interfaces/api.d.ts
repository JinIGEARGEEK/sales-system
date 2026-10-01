interface ApiResponse<T> {
  data: T,
  page: number
  per_page: number
  total: number
  total_page: number
  next: number
  prev: number
}
// The backend's error envelope, `{ error: ApiErrorBody }` (utils.ValidationError
// / Conflict / NotFound …). Read it only through the helpers in
// composables/utils/useAPI.ts (getApiErrorMessage/Code/Fields/Status).
interface ApiErrorBody {
  // Machine-readable, e.g. "VALIDATION_ERROR", "CONFLICT", "WON_DEAL_PROTECTED".
  code?: string
  // English, for logs and as a last-resort toast.
  message?: string
  // A 422's (or a duplicate 409's) field → code list, e.g. { email: ['duplicate'] }.
  fields?: Record<string, string[]>
  // A duplicate 409 on POST /leads|/prospects|/contacts: the matching ids.
  duplicate_of?: unknown[]
}
