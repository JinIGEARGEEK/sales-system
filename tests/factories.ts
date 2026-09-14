// Shared test-data builders for `tests/stores/*` and `tests/utils/*` specs.
// Extracted 2026-09-14: `makeDeal`, `makeContract`, and the paginated-envelope
// `apiResponse` helper were each hand-copied into 4-5 separate spec files with
// identical shapes (only the per-test `overrides` differed) — import from
// here instead of re-declaring a local copy. Add a new shared builder here
// only once a shape is actually reused by a second spec file; a one-off
// factory used by a single spec should stay local to it (e.g. `makeQuote`,
// `makePayment`, `makeEntry` in their respective spec files today).

export const makeDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 1,
  company_id: 1,
  contact_id: 1,
  title: 'Deal',
  value: 100,
  stage: 'Lead',
  status: 'open',
  expected_close_date: null,
  assigned_to: null,
  channel: 'Referral',
  business_unit: null,
  business_unit_item: null,
  lead_id: null,
  probability: null,
  lost_reason: null,
  forecast_category: null,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
} as Deal)

export const makeContract = (overrides: Partial<Contract> = {}): Contract => ({
  id: 1,
  deal_id: 1,
  quote_id: null,
  status: 'draft',
  signed_file_url: null,
  signed_date: null,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
} as Contract)

// Wraps `data` in the API's standard paginated envelope, as an Axios-shaped
// `{ data }` response — pass `extra` to override any envelope field (e.g. a
// non-default `total`/`page`) for a test that cares about pagination itself.
export const apiResponse = <T>(data: T, extra: Partial<ApiResponse<T>> = {}): { data: ApiResponse<T> } => ({
  data: {
    data,
    page: 1,
    per_page: 200,
    total: Array.isArray(data) ? data.length : 1,
    total_page: 1,
    next: 0,
    prev: 0,
    ...extra,
  },
})
