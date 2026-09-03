# API System Specification — I GEAR GEEK Sales CRM

**Companion document to:** `feature-spec.md` (business requirements), `user-story.md` (role acceptance criteria), `design-system.md` (frontend conventions)
**Purpose:** The contract for the backend API this frontend is built against. This frontend (`sales-system`) is now wired up to a real Go/Postgres backend (the sibling `sales-system-api` repo) for the resources marked 🟢 below — those Pinia stores make real `$api` calls (via `plugins/axios.ts` / `composables/utils/useAPI.ts`) instead of reading from `constants/mockData/`. A handful of narrower items are still mock-only or unbuilt; check each endpoint's status marker rather than assuming everything below is live. This document remains the contract the backend repo is kept in sync against as remaining resources get wired up.
**Audience:** Backend engineering team / AI coding agent implementing the API in another repository.
**Version:** 1.3 (adds `forecast_trend` to `/dashboard/summary`, documents Quote `EffectiveStatus`/`expired` derivation across all Quote endpoints, corrects Quote CRUD status markers to 🟢, notes the Kanban board's per-stage pagination fix, and documents Owner History as an `/audit-log` consumer)
**Date:** 2026-08-17

> **Status legend** (mirrors `feature-spec.md`'s legend, applied per endpoint):
> 🟢 **Built** — a real backend endpoint exists and the matching frontend Pinia store calls it (no more mock data for this resource).
> 🔜 **Planned** — supports a `feature-spec.md` requirement that isn't built in the frontend yet either. Check each endpoint's own marker below rather than assuming a whole resource is done or not — most of §§1–9 has moved to 🟢 since this legend was first written; only individually-marked 🔜 items (see `feature-spec.md`'s §9 gap summary for the current list) remain outstanding.

---

## บทบาทผู้ใช้และกรณีการใช้งาน (สรุปภาษาไทย)

> สรุปสั้น ๆ สำหรับทีม Backend ก่อนเข้าสู่รายละเอียดสัญญา API ด้านล่าง — ดูรายละเอียดเต็มที่ `feature-spec.md` และ `user-story.md`

### บทบาทผู้ใช้ (ใช้กำหนดสิทธิ์ระดับ API — ดูรายละเอียดที่ §1.7)

| บทบาท | สิทธิ์การเข้าถึง API โดยสรุป |
|---|---|
| **แอดมิน (Admin)** | เข้าถึงได้ทุก Resource รวมถึง Users, Tags และ (เมื่อสร้างแล้ว) Product Catalog / การตั้งค่า Pipeline |
| **เซลล์ / ผู้ดูแลลูกค้า (Sales Rep / Account Manager)** | CRUD เต็มรูปแบบบน Leads/Companies/Contacts/Deals/Activities/Tasks/Quotes/Payments ที่ตนรับผิดชอบหรือยังไม่มีผู้รับผิดชอบ อ่านข้อมูลของเพื่อนร่วมทีมได้ |
| **หัวหน้าทีมขาย (Sales Manager)** | เหมือนเซลล์ แต่เพิ่มสิทธิ์อ่านข้อมูลของทุกคนในทีมและทุก endpoint ใน `/reports/*` รวมถึงการโยกย้าย Deal |
| **ทีม Production (สิทธิ์จำกัด)** | เขียนได้เฉพาะ `status` และ `production_reference` ของ `Project` เท่านั้น (§8.3) — ไม่มีสิทธิ์เข้าถึง Resource อื่นใดเลย |

### กรณีการใช้งานที่ผูกกับ Endpoint จริง (ตัวอย่าง)

- **เซลล์ปิด Deal สำเร็จ** → เรียก `PATCH /deals/:id/stage` ด้วย `{ stage: 'Won' }` → ฝั่ง frontend สร้างงานติดตาม (Task) อัตโนมัติผ่าน `POST /tasks` ทันที (ดู §7.6) โดยยังไม่ผูกกับ CustomerProduct เนื่องจาก Product Catalog ยังไม่ถูกสร้าง (§8.2)
- **เซลล์ดูงานติดตามทั้งหมดของตน** → เรียก `GET /tasks?status=pending` (ไม่ระบุ `related_type`/`related_id`) เพื่อรวมงานจากทุก Deal/Contact/Company ในหน้าเดียว (§7.6) — endpoint เดียวกันนี้ยังขับเคลื่อนวิดเจ็ต "Upcoming Follow-ups" บน Dashboard (§9)
- **หัวหน้าทีมดูภาพรวมทีม** → เรียก `GET /dashboard/summary` พร้อม query filter ตามช่วงเวลา/Business Unit/Channel (§9) แทนที่จะดึงข้อมูลดิบทั้งหมดมาคำนวณฝั่ง frontend

---

## 1. Conventions

These apply to every endpoint below unless a section says otherwise.

### 1.1 Base URL & versioning

- Base URL comes from a single env var the frontend already reads: `API_URL` (see `nuxtApp.$config.public.API_URL` in `plugins/axios.ts`). No hardcoded host anywhere in the frontend.
- Prefix all routes with `/api/v1` (not yet reflected in the frontend's config value, but assumed by this spec so the backend can version breaking changes later without touching every consumer).
- JSON only. `Content-Type: application/json` for all requests except file uploads (§6), which use `multipart/form-data`.

### 1.2 Authentication

- Bearer JWT in the `Authorization` header: `Authorization: Bearer <access_token>`. The frontend already attaches this on every request via an axios interceptor (`plugins/axios.ts`) reading the token from `localStorage` (`useAuth` composable, `composables/utils/useAuth.ts`).
- The frontend's response interceptor already special-cases three status codes — the backend must return exactly these for the redirect logic in `plugins/axios.ts` to work:

| Status | Frontend behavior | When to return it |
|---|---|---|
| `401` | Redirects to `/login` | Missing/expired/invalid token |
| `403` | Redirects to `/` | Authenticated but not authorized for this resource/action |
| `404` | Redirects to `/error404` | Resource not found |

> **Forced password change is a special `403`.** Every route except `/auth/me`, `/auth/logout`, and `/auth/change-password` returns `403` with `error.code: "PASSWORD_CHANGE_REQUIRED"` for an account whose `must_change_password` is still `true` (§2.1) — set whenever an Admin creates the account or resets its password (§2.2), cleared only by a successful `POST /auth/change-password`. The frontend's blanket "`403` → redirect to `/`" rule (row above) needs a carve-out for this code — otherwise the account bounces to `/`, which immediately 403s again on its own API calls. Check `error.code` in the axios response interceptor and route to a dedicated "set your password" page instead when it's `PASSWORD_CHANGE_REQUIRED`.

- No refresh-token flow exists in the frontend today. Recommend a long-lived access token (or add refresh in the API without requiring a frontend change for v1 — `useAuth` would need a follow-up change to consume it).

#### Endpoints

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| `POST` | `/auth/login` | none | 🟢 | Body: `{ email: string, password: string }` (frontend field names, see `pages/login.vue`). Returns `{ access_token: string, user: User }`. |
| `POST` | `/auth/logout` | Bearer | 🟢 | Invalidates the token server-side if using a blocklist; frontend clears `localStorage` regardless (`useAuth().removeAccessToken()`). |
| `GET` | `/auth/me` | Bearer | 🟢 | Returns the current `User` (§2.1). Used to hydrate `stores/user.ts` on load instead of trusting client state alone. |
| `POST` | `/auth/change-password` | Bearer | 🟢 | Body: `{ current_password: string, new_password: string, confirm_password: string }`. Verifies `current_password`, requires `new_password === confirm_password` and at least 8 characters and different from the current password, then clears `must_change_password`. Returns the updated `User`. This is the only way to satisfy a `PASSWORD_CHANGE_REQUIRED` block (see the note above the status table), so it stays reachable even while that block is active. |

### 1.3 Response envelope

Two shapes, matching the frontend's existing `ApiResponse<T>` type (`interfaces/api.d.ts`) and the plain single-record pattern it implies:

**List responses** (paginated):

```json
{
  "data": [ /* T[] */ ],
  "page": 1,
  "per_page": 20,
  "total": 134,
  "total_page": 7,
  "next": 2,
  "prev": null
}
```

`next`/`prev` are `null` when there is no next/previous page (not omitted — the frontend's `TableData`/`TablePagination` components check for presence, not truthiness-only nullability edge cases).

**Single-record responses** (get one / create / update):

```json
{ "data": { /* T */ } }
```

**Delete**: `204 No Content`, empty body.

### 1.4 Pagination & filtering query params

All list endpoints accept:

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | number | `1` | 1-indexed, matches `TableData`'s `v-model:page` |
| `per_page` | number | `20` | Matches `useTablePagination` composable's default page size |
| `search` | string | — | Free-text match; each resource section below lists which fields it searches |
| `sort` | string | resource-specific | e.g. `sort=-created_at` (leading `-` = descending) |

Resource-specific filter params (status, stage, date range, etc.) are listed per section.

### 1.5 Error response shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "fields": { "email": ["Email already in use"] }
  }
}
```

`fields` is present only for `422` validation errors and keys by the same field names used in request bodies (snake_case, matching the TS interfaces below) so the frontend's Vee-Validate error display (`components/Input/FormField.vue`) can map them directly onto the right input.

### 1.6 Field & entity conventions

Every resource shares these unless noted:

- **`id`**: number, server-generated, auto-increment or equivalent. The frontend never generates IDs client-side for real records (mock stores use a local `nextId()` helper purely as a stand-in — see `stores/helpers.ts` — real IDs always come from the API).
- **Timestamps**: ISO 8601 strings in transit (`2026-08-14T09:30:00Z`); the frontend parses them to `Date` at the store boundary. Every entity has `created_at`; most have `updated_at`.
- **Soft delete + audit trail**: the base `User` shape (`interfaces/auth.d.ts`) already models `created_at/updated_at/deleted_at` + `created_by/updated_by/deleted_by` (user IDs). Apply the same pattern to every resource below — "delete" on Lead/Deal/Company/Contact sets `deleted_at`/`deleted_by` (recoverable via `/trash` + `/:id/restore`); Tag/Product instead flip their own `status` field inactive/archived — either way, never a hard row delete, so history and audit-log (§9) stay intact.
- **Enums**: transmitted as their literal string values (e.g. `"Qualified"`, not an integer code) — see each resource's TypeScript type for the exact allowed values, taken verbatim from `interfaces/crm.d.ts`.

### 1.7 Roles & authorization

Per `feature-spec.md` §2.2 / `user-story.md`. `FR-CRM-080` (RBAC enforcement) is 🟢 **Built** — enforced server-side via `RequireRoles` route middleware; the frontend mirrors it via `useRole()`/`hasRole()` only to hide actions the backend would reject (e.g. `canExport`/`canViewOwnerHistory` checks scattered across `pages/crm/**`), never as the actual security boundary — UI-only hiding alone would still be insufficient (`NFR-001`).

| Role | Summary |
|---|---|
| **Admin** | Full access to every resource, including Users, Tags, and (once built) Product Catalog / pipeline config |
| **Sales Rep / Account Manager** | Full CRUD on Leads/Companies/Contacts/Deals/Activities/Tasks/Quotes/Payments they're assigned to or that are unassigned; read access to teammates' records |
| **Sales Manager** | Same as Sales Rep, plus read access to all reps' data and all `/reports/*` endpoints, plus deal/lead reassignment, bulk actions (reassign/tag/archive) on Deals and Leads, and trash/restore on Deals, Leads, Companies, and Contacts. Also has access to `/prospects*` for oversight, alongside Marketing. |
| **Marketing** | Added 2026-09-01 for the Prospect funnel (§3a) — full CRUD on `/prospects*` (bulk/trash/restore stay Admin/Sales-Manager-only, same restriction as Leads), plus whatever Company/Contact access those records need (reuses the existing `/companies`/`/contacts` endpoints, no Marketing-specific restriction there). No access to Leads/Deals/Quotes/Contracts/Payments — a Prospect converting to a Lead is where Marketing's involvement ends. Not part of the original spec's role table — see `feature-spec.md`'s Prospect Management section |
| **Production (limited)** | Write access to *only* `status` and `production_reference` on `Project` records (§8.3) — no access to any other resource |

Suggested enforcement: role on the JWT claims, checked server-side per route — not by trusting a client-sent role header.

---

## 2. Auth & Users

### 2.1 `User` (base) / `AdminUser` (staff account)

Mirrors `interfaces/auth.d.ts` + `interfaces/admin.d.ts`:

```ts
interface User {
  id: number
  first_name: string
  last_name: string
  tel: string
  email: string   // login identifier; must be unique and on the @igeargeek.com domain
  accepted_consent_id: number | null
  is_active: boolean
  must_change_password: boolean   // true until the holder sets their own password via POST /auth/change-password
  latest_login: string | null   // ISO 8601
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  created_by: number
  updated_by: number
  deleted_by: number
}

interface AdminUser extends User {
  role: 'Admin' | 'Editor' | 'Viewer'
}
```

> Note: `feature-spec.md` §2.2 names three business roles (Admin, Sales Rep, Sales Manager) but the built `AdminUser.role` enum today is `Admin | Editor | Viewer` (from `pages/admin/users/`'s `ROLE_OPTIONS`). Reconcile this naming mismatch with the product owner before the backend hard-codes an enum — this spec keeps the enum as currently implemented, but flags it as unresolved.

### 2.2 Endpoints

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | `/users` | Admin | 🟢 | List staff accounts. Filters: `role`, `status` (`active`/`inactive` derived from `is_active`), `search` (name/email). Backs `pages/admin/users/index.vue`. |
| `POST` | `/users` | Admin | 🟢 | Create a staff account. Body per `AdminUserForm` fields: `first_name, last_name, email, tel, role, status, notes` (and optionally `password` — a random one is generated if omitted). `email` doubles as the login identifier and must be a valid address on the company domain (`@igeargeek.com`) — enforced server-side, not just a frontend hint. `must_change_password` is always set `true` on the created row — not a client-settable field — so every new account is forced through `POST /auth/change-password` on first use. |
| `GET` | `/users/:id` | Admin | 🟢 | Single staff record — `pages/admin/users/[id].vue`. |
| `PUT` | `/users/:id` | Admin | 🟢 | Full update. `email` is required and re-validated against the same `@igeargeek.com` rule as create. Supplying a non-empty `password` resets it and re-sets `must_change_password: true`, same as a fresh create. |
| `DELETE` | `/users/:id` | Admin | 🟢 | Soft-delete (deactivate), not a hard delete — see §1.6. |
| `GET` | `/team-members` | any authenticated | 🟢 | Lightweight `{ id, name, email }[]` list (`TeamMember` in `interfaces/crm.d.ts`) for assignee dropdowns (`CrmTeamMemberSelect`) — do not require Admin role for this one, every Sales role needs it to assign Leads/Deals/Tasks. |

---

## 3. Leads

`interfaces/crm.d.ts` → `Lead`:

```ts
type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Disqualified'
type LeadSource = 'Referral' | 'Website' | 'Event' | 'Ads' | 'Other'

interface Lead {
  id: number
  name: string
  // Replaced free-text company_name 2026-08-24 — a real Company FK, same as
  // Deal.company_id/Contact.company_id, instead of a bare string. Nullable
  // (unlike Deal/Contact): a Lead can still exist with no company picked,
  // matching company_name's old optional-ness. Existing rows were
  // backfilled from their old company_name text at migration time — exact
  // case-insensitive match against Companies where one existed, otherwise a
  // new Company created from that text (backend's `backfillLeadCompanyIDs`).
  company_id: number | null
  email: string
  phone: string
  source: LeadSource
  status: LeadStatus
  notes: string
  assigned_to: number | null   // User.id
  tags: string[] | null        // free-text array, same convention as Company/Contact.tags
  converted_deal_id: number | null   // Deal.id once converted, else null — see /leads/:id/convert
  score: number                // FR-CRM-006 — server-computed, sum of matching active LeadScoringCriterion weights; never client-settable
  classification: 'none' | 'mql' | 'sql'   // FR-CRM-007 — server-computed mql/none from `score` vs the Admin-configurable threshold (§8.7a), unless the request body explicitly sets `classification: 'sql'` (see POST/PUT rows below)
  // Mirrors Deal.business_unit/business_unit_item (§7.1) — added 2026-09-03,
  // same nullable/free-text-item shape and IsValidBusinessUnit enum guard.
  // Carried forward to the Deal on conversion (POST /leads/:id/convert's
  // `deal.business_unit`/`deal.business_unit_item`, pre-filled client-side
  // from this Lead by pages/crm/deals/create.vue, same as channel/company_id/
  // assigned_to already are — not auto-defaulted server-side, unlike
  // Prospect→Lead below, since this Convert already takes a full Deal-style
  // payload from the frontend form).
  business_unit: 'Project' | 'Product' | null
  business_unit_item: string | null
  deleted_at?: string | null   // present only on GET /leads/trash rows
  created_at: string
}
```

`Lead` (and `Deal`, §7.1) soft-delete — `DELETE` sets `deleted_at`/`deleted_by` instead of removing the row, recoverable via `/trash` + `/:id/restore` below.

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/leads` | 🟢 | Filters: `status`, `source`, `assigned_to`, `company_id` (exact match, added 2026-08-24), `search` (name/email/**company name**, via a join now that `company_name` is a real FK — preserves what `search` could already match before the 2026-08-24 migration off free-text `company_name`, unlike Deal/Contact's own `search`, which was never company-name-aware to begin with), `exclude_converted=true` (returns only Leads with `converted_deal_id IS NULL` — used by the Deals Pipeline board, see §7.1, so already-converted Leads don't show up as cards alongside their own resulting Deal). `sort=company_name`/`-company_name` also joins to `companies`, same pattern as Deal/Contact's existing company-name sort special-case (§7.1/§3 elsewhere) — the two joins are shared/deduplicated, not applied twice. A Lead with no `company_id` at all still matches on `name`/`email` and still appears in an otherwise-unfiltered list (`LEFT JOIN`, not `JOIN`). **Updated 2026-09-01**: this nullable-company-id join+search logic is now a shared pair of helpers, `utils.ApplyNullableCompanySearch`/`ApplyNullableCompanySort`, used by both this endpoint and `GET /prospects` below (previously duplicated inline in `LeadHandler.List` only, back when Lead was the only resource with a nullable `company_id` needing it). Backs `pages/crm/leads/index.vue`. |
| `POST` | `/leads` | 🟢 | Create. `company_id`, if supplied, is **not** validated against an existing Company row — unlike Deal/Contact, which require and validate it, Lead's stays optional and unchecked, matching the old `company_name`'s complete lack of validation. If the request body omits `assigned_to` (or sends `null`), the backend auto-assigns the new Lead via `pickAutoAssignee()` (`internal/handlers/leads.go`) — a least-open-load strategy that picks whichever active Sales Rep currently has the fewest open Leads/Deals, not a literal round-robin index. This only fires on creation with no explicit assignee; bulk-reassign and Kanban-drag reassignment flows are untouched. `score`/`classification` are computed server-side after create (`computeAndClassify()`) — an optional `classification: 'sql'` in the body is honored as a manual override, any other value is ignored in favor of the auto mql/none result. |
| `GET` | `/leads/:id` | 🟢 | Single lead. |
| `PUT` | `/leads/:id` | 🟢 | Update (including status transitions). **Not a true partial update** — every `leadForm` field (`name`, `company_id`, `email`, `phone`, `source`, `status`, `notes`, `assigned_to`) is overwritten from whatever the request body contains, so a caller must resend the full current record, not just the changed field(s) — note this means omitting `company_id` clears the link entirely, unlike Contact's Update, which only touches `company_id` if non-zero/present. `score` is always recomputed. `classification` is the one exception with real partial-update semantics: omitting it (or sending anything other than `'sql'`) leaves an existing `'sql'` override in place and otherwise falls through to the auto mql/none result — only an explicit `classification: 'sql'` in the body sets/keeps it. Frontend: `pages/crm/leads/[id].vue`'s "Mark Sales Ready" button. |
| `DELETE` | `/leads/:id` | 🟢 | Soft-delete (sets `deleted_at`/`deleted_by`) — recoverable, see below. |
| `GET` | `/leads/trash` | 🟢 | Admin/Sales Manager only. Paginated list of soft-deleted Leads (same envelope as `GET /leads`). Backs `pages/admin/trash.vue`. |
| `POST` | `/leads/:id/restore` | 🟢 | Admin/Sales Manager only. Clears `deleted_at`/`deleted_by`. |
| `PATCH` | `/leads/bulk-reassign` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[], assigned_to: number \| null}`. `FR-CRM-025`-adjacent bulk operation for the Leads table's multi-select. |
| `PATCH` | `/leads/bulk-tag` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[], tags: string[], mode: 'add' \| 'set'}` (`mode` defaults to `add`, which merges without duplicating). |
| `PATCH` | `/leads/bulk-archive` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[]}`. Soft-deletes every id in one transaction. |
| `POST` | `/leads/:id/convert` | 🟢 | Converts a Qualified Lead into a Deal (and Company/Contact if new) — `FR-CRM-004`. Body: `{ company_id?: number, contact_id?: number, deal: { title, value, stage, ... } }`. **Updated 2026-08-24**: company resolution now checks three things in order — (1) an explicit `company_id` on this request, if supplied, always wins; (2) otherwise, the Lead's own `company_id` (set at create/edit time via the frontend's company combobox, `InputCompanySelect`) is reused directly; (3) only if the Lead has neither does it fall back to creating a brand-new, unnamed Company, exactly as it always did for a Lead with no company. Step (2) is new — previously this endpoint *always* created a fresh Company here (seeded from the now-removed `company_name` text), so converting two Leads that both named the same company created two duplicate Company rows; a Lead already linked to a real Company no longer does that. If step (2)'s Company has since been soft-deleted, it falls through to step (3)'s fresh-Company behavior rather than erroring the whole conversion — that id was never caller-supplied on this request, unlike an explicit `company_id` in step (1), which still fails loudly if invalid. `contact_id`, if omitted, is still created from the Lead's `email`/`phone` same as before. Sets the new Deal's `lead_id` and the Lead's `converted_deal_id` in the same transaction. Response: `{ data: { deal: Deal, company: Company, contact: Contact } }`. Returns `409 CONFLICT` if the Lead has already been converted (`converted_deal_id` already set) — guards against a double-fire from the Kanban drag-to-convert flow (§7.1). This is now the **only** path that creates a Deal from a Lead: `pages/crm/deals/create.vue`'s manual "Convert to Deal" form (reached from the Leads list/detail page, letting a rep pick an existing Company/Contact instead of auto-creating new ones) also calls this endpoint rather than plain `POST /deals` — a bug fixed on 2026-08-16 where the manual form created a Deal referencing the Lead without ever marking the Lead converted, leaving it stuck showing "Convert" forever and duplicated on the pipeline board. |

### 3.1 Lead scoring criteria (`FR-CRM-006`)

Admin-configurable weighted rules `computeAndClassify()` sums against a Lead to produce its `score` (§3 above). Same row-per-option config shape as `/admin/pipeline-stages`/`/admin/lead-sources` (§8.7).

```ts
interface LeadScoringCriterion {
  id: number
  name: string
  field: 'source' | 'has_company_name' | 'has_phone'   // what to match against the Lead — not admin-extensible beyond these 3 today; adding a 4th requires a backend code change to computeLeadScore()
  match_value: string   // only meaningful when field === 'source' (compared against Lead.source); ignored otherwise
  weight: number
  is_active: boolean
  created_at: string
}
```

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` / `POST` | `/admin/lead-scoring-criteria` | 🟢 | Admin only. List (always both active + inactive rows) / create. Seeded with 5 default criteria on first run (referral/website/event source, has-company-name, has-phone). |
| `PATCH` / `DELETE` | `/admin/lead-scoring-criteria/:id` | 🟢 | Admin only. Update / deactivate (`DELETE` is a soft `is_active: false` flip, same convention as `/admin/pipeline-stages`, not a hard row delete). |

The MQL threshold itself (`score >=` this value → `classification: 'mql'`) lives on the `AppSettings` singleton, not a `LeadScoringCriterion` row — see `lead_scoring_mql_threshold` in §8.7a.

---

## 3a. Prospects (`FR-CRM-105`/`FR-CRM-106`)

The pre-Lead marketing funnel entity — Marketing works a Prospect (with an optional linked Company/Contact, same nullable-FK shape as `Lead.company_id`) before it's ready to hand off to Sales via Convert. Endpoint/handler/model shape deliberately mirrors Leads one funnel stage earlier — see §3 for the pattern this is modeled on.

`interfaces/crm.d.ts` → `Prospect`:

```ts
type ProspectStatus = 'New' | 'Engaging' | 'Nurturing' | 'Disqualified' | 'Converted'
// ProspectStatus is a fixed enum, not admin-configurable (mirrors LeadStatus,
// not the admin-configurable PipelineStage) — Marketing's funnel stage is a
// simple closed set. 'Converted' is set only by POST /prospects/:id/convert,
// never chosen directly.

interface Prospect {
  id: number
  name: string
  company_id: number | null   // nullable FK, same optional-ness as Lead.company_id
  email: string
  phone: string
  // Plain string, not LeadSource. Updated 2026-09-01: Prospect has its own
  // admin-configurable source list (ProspectSourceOption,
  // /admin/prospect-sources) — deliberately separate from Lead/Deal's
  // (LeadSourceOption), since Marketing's actual channels (Social Media,
  // LINE OA, Email Campaign, Content/SEO, Cold Outreach, Marketing
  // Campaign) don't overlap well with Sales's lead-capture sources
  // (Referral/Website/Event/Ads/Other). Originally shared Lead's list; split
  // out same day once Marketing's real channel mix turned out not to fit it.
  source: string
  status: ProspectStatus
  notes: string
  assigned_to: number | null  // User.id
  tags: string[] | null
  converted_lead_id: number | null   // Lead.id once converted, else null — see /prospects/:id/convert
  // Mirrors Deal.business_unit/business_unit_item (§7.1) — added 2026-09-03.
  // Carried over to the new Lead automatically, server-side, on Convert
  // (unlike Lead→Deal, which takes its own Deal-style payload from the
  // frontend form and pre-fills client-side instead — see Lead's own doc
  // above) — the same pass-through treatment already given to `source`.
  business_unit: 'Project' | 'Product' | null
  business_unit_item: string | null
  deleted_at?: string | null  // present only on GET /prospects/trash rows
  created_at: string
}
```

`Prospect` soft-deletes the same as `Lead`/`Deal` — `DELETE` sets `deleted_at`/`deleted_by`, recoverable via `/trash` + `/:id/restore`.

Every `/prospects*` route requires the **Admin**, **Marketing**, or **Sales Manager** role (§1.7) — a plain Sales Rep has no legitimate reason to see the pre-Lead funnel and is `403`'d at the route group, before any per-record ownership check.

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/prospects` | 🟢 | Filters: `status`, `source`, `assigned_to` (`unassigned` matches `IS NULL`), `company_id` (exact match), `search` (name/email/company name, via the same `LEFT JOIN companies` pattern as `GET /leads`), `exclude_converted=true` (`converted_lead_id IS NULL`). `sort=company_name`/`-company_name` also joins to `companies`. Backs `pages/crm/prospects/index.vue`. |
| `POST` | `/prospects` | 🟢 | Create. `source` is validated against Prospect's own active `ProspectSourceOption` config (`/admin/prospect-sources`, Admin-only — see below), separate from Lead/Deal's `LeadSourceOption`. `status` defaults to `New` when omitted. `status: 'Converted'` is rejected with `422` (see the Convert row's status guard below) — a client can't fake that state without a Lead behind it. No Lead-style scoring/classification — that's Lead-specific. `tags` is settable directly here, unlike Lead's own `leadForm` (which only exposes tags via `PATCH /leads/bulk-tag`) — mirrors Contact's simpler pattern instead, added 2026-09-02 once single-record tag editing on `pages/crm/prospects/[id].vue` turned out to be a real Marketing workflow, not just a bulk-select action. |
| `GET` | `/prospects/:id` | 🟢 | Single prospect. |
| `PUT` | `/prospects/:id` | 🟢 | Update (including status transitions). Not a true partial update — every field is overwritten from the request body, same as `PUT /leads/:id`. Same `status: 'Converted'` guard as Create: rejected with `422` unless the Prospect is already `Converted` (a client harmlessly resubmitting an unchanged record's status is allowed through — only an attempted *transition* into `Converted` from anything else is blocked). |
| `DELETE` | `/prospects/:id` | 🟢 | Soft-delete. |
| `GET` | `/prospects/trash` | 🟢 | Admin/Sales Manager only. Paginated list of soft-deleted Prospects. |
| `POST` | `/prospects/:id/restore` | 🟢 | Admin/Sales Manager only. |
| `PATCH` | `/prospects/bulk-reassign` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[], assigned_to: number \| null}`. |
| `PATCH` | `/prospects/bulk-tag` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[], tags: string[], mode: 'add' \| 'set'}`. |
| `PATCH` | `/prospects/bulk-archive` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[]}`. |
| `POST` | `/prospects/:id/convert` | 🟢 | Converts a Prospect into a Lead (and Company/Contact if new) — `FR-CRM-106`, mirroring `POST /leads/:id/convert`'s Company-resolution precedence exactly, one funnel stage earlier: (1) an explicit `company_id` on this request always wins; (2) otherwise the Prospect's own `company_id` is reused directly (falling back to a fresh Company if that one's since been soft-deleted); (3) with neither, a fresh, unnamed Company is created. `contact_id`, if omitted, is created from the Prospect's `name`/`email`/`phone`. Body: `{ company_id?: number, contact_id?: number, lead?: { assigned_to?: number } }` — the new Lead's `assigned_to` defaults to the Prospect's own `assigned_to` if not overridden in the request. The new Lead is created with `status: 'New'` and `prospect_id` set to this Prospect's id (mirrors `Deal.lead_id`). Any Prospect attachments (`related_type: 'prospect'`) are re-pointed to the new Lead in the same transaction, same as Lead→Deal's attachment carry-over (§8.6). Sets the Prospect's `status: 'Converted'` and `converted_lead_id` in the same transaction. Response: `{ data: { lead: Lead, company: Company, contact: Contact } }`. Returns `409 CONFLICT` if the Prospect has already been converted. |

> **Source carry-over on Convert (added 2026-09-01):** the new Lead's `source` is set directly from the Prospect's `source` string, even though Prospect and Lead now validate against separate option lists (`ProspectSourceOption` vs. `LeadSourceOption` — see above). The resulting Lead can end up with a `source` value that isn't one of Lead's own configured options (e.g. `"LINE OA"`) — intentional, to preserve real origination info rather than lossily mapping it to `"Other"`. The frontend's Lead detail page (`pages/crm/leads/[id].vue`) keeps that value selectable in its Source picker even though it won't appear for new Leads going forward, same pattern as `pages/crm/contacts/[id].vue`'s `role_title` handling a deactivated option.

> **Known gap, both Convert endpoints (flagged 2026-09-01, not fixed as part of adding Prospect — it's Lead's existing, unchanged behavior and changing it here was out of scope):** `CanWrite` is only checked against the *source* record's `assigned_to` (the Lead/Prospect being converted) — the request body's `deal.assigned_to` / `lead.assigned_to` for the *newly created* target record is never itself ownership-checked. In practice this means a Sales Rep converting a Lead/Prospect they own could assign the resulting Deal/Lead to a teammate without Sales-Manager privileges, the one write `CanWrite` would otherwise block via a direct `PUT`. Worth a real look if/when Lead's Convert behavior is revisited, but not addressed here to avoid changing established Lead semantics as a side effect of adding Prospect.

---

## 4. Companies

`interfaces/crm.d.ts` → `Company`:

```ts
type ActiveArchivedStatus = 'active' | 'archived'

interface Company {
  id: number
  name: string
  industry: string
  size: string
  website: string
  tags: string[]        // Tag.name values
  notes: string
  status: ActiveArchivedStatus
  // Registered-party details, used on Contract PDF exports (§8.1) — optional,
  // most Companies predate these fields.
  legal_name?: string | null
  address?: string | null
  tax_id?: string | null
  created_at: string
  updated_at: string
}
```

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/companies` | 🟢 | Filters: `status`, `tag`, `industry`, `search` (name). Backs `pages/crm/companies/index.vue`. |
| `POST` | `/companies` | 🟢 | Create. |
| `GET` | `/companies/:id` | 🟢 | Single company — `pages/crm/companies/[id].vue`'s Overview tab. |
| `PUT` | `/companies/:id` | 🟢 | Update. |
| `DELETE` | `/companies/:id` | 🟢 | Soft-delete (sets `deleted_at`/`deleted_by`, same pattern as Leads/Deals, §1.6) — never a hard delete, since Deals/Contacts/Payments reference `company_id`. Note this is distinct from the `status: 'active' \| 'archived'` field above, which is untouched by Delete and still exists as its own toggle — recoverable via `/trash` + `/:id/restore` below. |
| `GET` | `/companies/trash` | 🟢 | Admin/Sales Manager only. Paginated list of soft-deleted Companies (same envelope as `GET /companies`). Backs `pages/admin/trash.vue`. |
| `POST` | `/companies/:id/restore` | 🟢 | Admin/Sales Manager only. Clears `deleted_at`/`deleted_by`. |
| `POST` | `/companies/import` | 🟢 | Bulk import — see §6.2. `FR-CRM-014`. |

---

## 5. Contacts

`interfaces/crm.d.ts` → `Contact`:

```ts
interface Contact {
  id: number
  company_id: number
  name: string
  email: string
  phone: string
  role_title: string
  tags: string[]
  status: ActiveArchivedStatus
  created_at: string
}
```

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/contacts` | 🟢 | Filters: `company_id`, `status`, `tag`, `search` (name/email). Backs `pages/crm/contacts/index.vue` and the Company detail page's contact list. Also the source of truth for `pages/crm/deals/create.vue`'s "Primary Contact" field, which must only offer contacts belonging to the Deal's selected Company — done client-side today via `contactsStore.byCompany(company_id)` (a thin wrapper over this same `company_id` relationship) since the store already holds every contact from one unfiltered fetch; a backend serving this at scale should either keep that filter server-side per request or ensure the frontend switches to `?company_id=` here instead of fetching everything. |
| `POST` | `/contacts` | 🟢 | Create. |
| `GET` | `/contacts/:id` | 🟢 | Single contact — `pages/crm/contacts/[id].vue`. |
| `PUT` | `/contacts/:id` | 🟢 | Update. |
| `DELETE` | `/contacts/:id` | 🟢 | Soft-delete (sets `deleted_at`/`deleted_by`, same pattern as Companies above) — distinct from the separate `status: 'active' \| 'archived'` field, which Delete no longer touches. Recoverable via `/trash` + `/:id/restore` below. |
| `GET` | `/contacts/trash` | 🟢 | Admin/Sales Manager only. Paginated list of soft-deleted Contacts (same envelope as `GET /contacts`). Backs `pages/admin/trash.vue`. |
| `POST` | `/contacts/:id/restore` | 🟢 | Admin/Sales Manager only. Clears `deleted_at`/`deleted_by`. |
| `POST` | `/contacts/import` | 🟢 | Bulk import — see §6.2, same FlowAccount-export path as Companies. |

> `FR-CRM-012` ("one Contact marked Primary per Company") is 🔜 **Planned** — no `is_primary` field exists in the frontend interface today. If added, it should live here as a boolean with a uniqueness constraint per `company_id`.

---

## 6. File uploads & bulk import

### 6.1 Conventions

- `multipart/form-data`, single field named `file`.
- Response for a single-file upload (Quote PDF, Contract signed doc): `{ data: { file_name: string, file_url: string, file_size: number, uploaded_at: string } }` — matches the optional fields already on `Quote` (`interfaces/crm.d.ts`).
- Max file size: recommend 10 MB; return `413` with the standard error envelope (§1.5) if exceeded.
- Store files in object storage (S3-compatible) and return a durable `file_url`, not a local path.

### 6.2 Bulk import (Companies/Contacts)

Backs `components/Crm/ImportContactsModal.vue` — currently a **client-side-only** CSV/XLS/XLSX parser with no backend call; this endpoint replaces that parsing with a real server-side import so duplicate detection can be authoritative instead of best-effort in the browser.

| Method | Path | Status | Description |
|---|---|---|---|
| `POST` | `/companies/import` | 🟢 | Body: `file` (CSV/XLS/XLSX, FlowAccount export layout — see `ImportContactsModal.vue` for the exact column mapping it currently expects client-side). Response: `{ data: { created: number, updated: number, skipped: number, errors: { row: number, message: string }[] } }`. |
| `POST` | `/contacts/import` | 🟢 | Same shape, for the Contacts half of the same import file. |

> `FR-CRM-014` specifies dedup by email/domain; the current frontend parser dedupes by company **name** instead. The backend (`internal/handlers/import.go`) now implements this per-spec for Companies: `findExistingCompany` dedupes primarily by normalized Website domain (`extractDomain`), falling back to a case-insensitive/whitespace-trimmed name match when either side has no website — Company has no dedicated email field, so this is domain-based rather than literally email. Contact import dedupes by email only. This remains a deliberate improvement over, not a mirror of, the frontend-only parser's name-only behavior.

---

## 7. Deals, Activities, Tags, Quotes, Payments, Tasks

### 7.1 Deals

```ts
type DealStage = 'Lead' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost'
type DealStatus = 'open' | 'won' | 'lost'
type BusinessUnit = 'Project' | 'Product'

type LostReason = 'price' | 'timing' | 'competitor' | 'no_budget' | 'other'

interface Deal {
  id: number
  company_id: number
  contact_id: number
  title: string
  value: number
  stage: DealStage
  status: DealStatus
  probability: number | null   // 0-100; defaulted per-stage (StageDefaultProbability) at write time, always manually overridable — feeds /dashboard/summary's forecasted_revenue (§9)
  lost_reason: LostReason | null   // required once stage/status resolves to Lost; cleared automatically if the Deal moves off Lost
  expected_close_date: string | null
  assigned_to: number | null
  channel: LeadSource
  business_unit: BusinessUnit | null
  business_unit_item: string | null   // free-text label, e.g. specific product/project name
  tags: string[] | null        // free-text array, same convention as Company/Contact.tags
  lead_id: number | null   // set when auto-created via /leads/:id/convert, else null
  deleted_at?: string | null   // present only on GET /deals/trash rows
  created_at: string
}
```

> Won/Lost resolution (for `status`, and for whether `lost_reason` is required) is **not** a hardcoded `stage === 'Won' | 'Lost'` string match — it reads the configured `PipelineStage` row's `is_won_stage`/`is_lost_stage` flags (§8.7) via `IsWonStage`/`IsLostStage`, so an Admin-renamed or custom-added stage still resolves correctly. `PATCH /deals/:id/stage`, `POST /deals`, and `PUT /deals/:id` all share this same resolution logic.

> **Unified pipeline board:** `pages/crm/deals/index.vue`'s Kanban also renders unconverted Leads (`GET /leads?exclude_converted=true`, §3) as cards in the `Lead`/`Qualified` columns, plus Disqualified Leads in `Lost`. Dragging a Lead card within `Lead`/`Qualified`/`Lost` just updates its `status` (`PUT /leads/:id`); dragging it into `Proposal Sent`, `Negotiation`, or `Won` instead fires `POST /leads/:id/convert` (§3) with `stage` set to the dropped column, turning the card into a real Deal in place.

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/deals` | 🟢 | Filters: `stage`, `status`, `company_id`, `assigned_to`, `business_unit`, `channel`, `search` (title). Backs `pages/crm/deals/index.vue`'s Kanban board **and** its List-view toggle (`components/Crm/DealsTable.vue`), plus the dashboard's `filteredDeals`. |
| `POST` | `/deals` | 🟢 | Create. |
| `GET` | `/deals/:id` | 🟢 | Single deal — Overview tab, `pages/crm/deals/[id]/index.vue` (the Deal detail page was split from one file into `pages/crm/deals/[id].vue` as a thin `<NuxtPage/>` parent holding the header/tab bar, plus one nested route file per tab). |
| `PUT` | `/deals/:id` | 🟢 | Full update. |
| `PATCH` | `/deals/:id/stage` | 🟢 | Body: `{ stage: DealStage }`. Dedicated endpoint for the Kanban drag-and-drop (`CrmPipelineBoard`'s `@move`) so the backend can also update `status` (open/won/lost) in one transaction. **Does not** fire an auto Customer-Product creation on `Won` — `FR-CRM-064` was confirmed 2026-08-22 as intentionally not built (see §8.2 below); CustomerProduct creation stays a manual, client-triggered action (FR-CRM-065) regardless of stage transitions. **FR-CRM-045** (added 2026-08-22): when `AppSettings.require_signed_contract_before_won` (§8.7a) is enabled, moving *into* Won 422s (`"a signed contract is required before marking this deal Won"`) unless the Deal already has ≥1 Contract with `status: 'signed'` — checked before `status`/`stage` are saved, so a blocked transition mutates nothing. The check only fires on the actual transition (the Deal's stored `status` wasn't already Won) — re-saving a Deal that's already Won (e.g. editing an unrelated field) does not re-check, so enabling the toggle later never retroactively locks editing of pre-existing Won deals that predate it. `POST /deals` enforces the same check unconditionally when the submitted `stage`/`status` resolves to Won (a brand-new Deal has no prior state to compare against). `PUT /deals/:id` enforces it with the same transition-only guard as `PATCH /deals/:id/stage`. |
| `DELETE` | `/deals/:id` | 🟢 | Soft-delete (sets `deleted_at`/`deleted_by`) — recoverable, see below. |
| `PATCH` | `/deals/:id/reassign` | 🟢 | Admin/Sales Manager only. Body: `{ assigned_to: number \| null }`. Separate from the general `PUT` so a reassignment always writes its own `reassigned` audit-log entry (§8.5), regardless of what else changed. |
| `GET` | `/deals/trash` | 🟢 | Admin/Sales Manager only. Paginated list of soft-deleted Deals (same envelope as `GET /deals`). Backs `pages/admin/trash.vue`. |
| `POST` | `/deals/:id/restore` | 🟢 | Admin/Sales Manager only. Clears `deleted_at`/`deleted_by`. |
| `PATCH` | `/deals/bulk-reassign` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[], assigned_to: number \| null}`. Backs the Deals List view's multi-select bulk toolbar. |
| `PATCH` | `/deals/bulk-tag` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[], tags: string[], mode: 'add' \| 'set'}` (`mode` defaults to `add`). |
| `PATCH` | `/deals/bulk-archive` | 🟢 | Admin/Sales Manager only. Body: `{ids: number[]}`. Soft-deletes every id in one transaction. |

### 7.2 Activities

```ts
type ActivityType = 'call' | 'email' | 'meeting'
type ActivityRelatedType = 'contact' | 'company' | 'deal' | 'prospect'   // 'prospect' added 2026-09-01 for Marketing's Prospect Tasks tab (§3a) — Activity/Task share this union

interface Activity {
  id: number
  type: ActivityType
  subject: string
  notes: string
  related_type: ActivityRelatedType
  related_id: number
  created_by: string
  created_at: string
}
```

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/activities` | 🟢 | Filters: `related_type`, `related_id` (required together), `type`. Backs the timeline on Deal/Company/Contact detail pages. |
| `POST` | `/activities` | 🟢 | Create — `FR-CRM-031`'s manual entry form. |
| `DELETE` | `/activities/:id` | 🟢 | Delete. |

### 7.3 Tags

```ts
type TagCategory = 'Tier' | 'Industry' | 'Priority'
type TagStatus = 'active' | 'inactive'

interface Tag {
  id: number
  name: string
  category: TagCategory
  description: string
  status: TagStatus
  created_at: string
}
```

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/tags` | 🟢 | Filters: `category`, `status`, `search` (name). Backs `pages/crm/tags/index.vue`. |
| `POST` | `/tags` | 🟢 | Create. |
| `PUT` | `/tags/:id` | 🟢 | Update. |
| `DELETE` | `/tags/:id` | 🟢 | Soft-delete (`status: 'inactive'`). |

### 7.4 Quotes

```ts
type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
type QuotePriceType = 'excl_tax' | 'incl_tax'

interface QuoteItem {
  description: string
  qty: number
  price: number
  product_id?: number | null   // optional — set by the item's Product picker (CrmQuoteItemsEditor); the
                          // handler snapshots that Product's current name/price into description/price
                          // at save time (not a live reference), then the item behaves like any other
                          // row. Left unset, the item is pure free-text, unchanged from before this
                          // field existed. FR-CRM-062.
  discount_percent?: number   // 0-100, reduces this item's own line total — independent of the
                          // whole-quote discount_total below. Added 2026-08-23 (quotation-builder
                          // rebuild), closing the discount gap noted on FR-CRM-040.
}

interface Quote {
  id: number
  deal_id: number
  items: QuoteItem[]
  number?: string   // generated document number (e.g. "QT2026080004"), assigned once at create time,
                          // never user-edited. Quotes created before this field existed have none.
                          // Added 2026-08-23.
  scope_of_work: string   // added 2026-08-22 — whole-quote narrative (deliverables/phases/terms),
                            // distinct from each QuoteItem's own short description
  validity_date: string | null
  status: QuoteStatus
  file_name?: string
  file_url?: string
  file_size?: number
  uploaded_at?: string
  // All added 2026-08-23 (quotation-builder rebuild) — see composables/utils/useQuoteTotals.ts for how
  // they combine into the totals block, mirroring the backend's utils.ComputeQuoteTotals so the two
  // never disagree (subtotal -> discount_total -> vat -> wht -> grand total).
  reference_number?: string | null
  issue_date: string | null
  credit_days: number
  price_type: QuotePriceType
  vat_enabled: boolean
  wht_enabled: boolean
  wht_rate: number
  discount_total: number
  notes: string | null
  internal_notes: string | null
  // Set only on Quotes created via Upload below — the outcome of best-effort
  // field extraction from a FlowAccount PDF export (internal/utils/flowaccount_extract.go).
  // Added 2026-08-23.
  extraction_status?: 'ok' | 'partial' | 'failed'
  extraction_warnings?: string[]
}
```

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/deals/:dealId/quotes` | 🟢 | List quotes for a Deal — `FR-CRM-040`/`041`. Real per-Deal CRUD (`internal/handlers/quotes.go`, `stores/quotes.ts`), no longer a mock array embedded in the Deal detail page. |
| `POST` | `/deals/:dealId/quotes` | 🟢 | Create a line-item quote — accepts `items`/`scope_of_work`/`validity_date`/`status` only; the rest of `Quote`'s fields are edited afterward on `pages/crm/quotes/[id].vue` via `PUT`, not set at create time. |
| `POST` | `/deals/:dealId/quotes/upload` | 🟢 | Upload a PDF quote in place of line items (§6.1) — sets `file_name/file_url/file_size/uploaded_at`. **Widened 2026-08-23**: if the PDF looks like a FlowAccount quotation export, `utils.ExtractFlowAccountQuote` (`internal/utils/flowaccount_extract.go`) also best-effort pre-fills `items` (incl. per-item `discount_percent`), `scope_of_work`, `reference_number`, `issue_date`, `vat_enabled`, `wht_enabled`/`wht_rate`, and `notes` from it, recording the outcome on `extraction_status`/`extraction_warnings`. Purely additive and never fatal — a PDF that isn't a FlowAccount export, or one extraction can't make sense of, still uploads exactly as before (`items` empty, `extraction_status: 'failed'`, no error surfaced); a `'partial'` result still pre-fills what it found; the rep reviews/corrects everything on `pages/crm/quotes/[id].vue` before Sending regardless, same trust model as the Deal pre-fill (`FR-CRM-046`). See the doc comment on `flowAccountGlyphFix` for the one FlowAccount-template-specific text-extraction bug it corrects (a broken glyph mapping in the embedded font, not a general Thai-PDF limitation). |
| `GET` | `/quotes/:id` | 🟢 | **Added 2026-08-23** — fetch a single Quote by id, read-only (same access level as List/Export-PDF, no `CanWrite` check). Added for the quotation-builder rebuild's full-page Quote editor (`pages/crm/quotes/[id].vue`), reached by direct link/URL rather than always arriving with a known parent Deal already loaded the way the old modal flow did. |
| `PUT` | `/quotes/:id` | 🟢 | **Widened 2026-08-23** — updates every field above except `id`/`deal_id`/`number`/`file_*`/`uploaded_at`: `items` (incl. per-item `discount_percent`), `scope_of_work`, `validity_date`, `status`, `reference_number`, `issue_date`, `credit_days`, `price_type`, `vat_enabled`, `wht_enabled`, `wht_rate`, `discount_total`, `notes`, `internal_notes` (`stores/quotes.ts`'s `QuoteUpdatePayload`). Existed on the backend before this rebuild but had no UI caller until the new editor page. |
| `DELETE` | `/quotes/:id` | 🟢 | Delete. |
| `GET` | `/quotes/:id/export-pdf` | 🟢 | `FR-CRM-042` — returns a generated PDF (`github.com/go-pdf/fpdf`): line items table, Deal/Company/Contact header, validity date, status. Read-only, same access level as List (no `CanWrite` ownership check). **Updated 2026-08-22**: renders `scope_of_work` (if set) as a wrapped paragraph above the line-items table; `utils.RenderLineItemsTable` (shared with Contract's export, §8.1) now wraps a multi-line `QuoteItem.description` onto a properly height-sized row (via `SplitLines`+`MultiCell`) instead of clipping it to a fixed single-line cell. |

> **`expired` is read-derived, never stored.** `Quote.Status` in the database is only ever `draft`/`sent`/`accepted`/`rejected` — `expired` is computed at read time by `Quote.EffectiveStatus()` (`internal/models/quote.go`): a `sent` Quote whose `validity_date` has passed reports as `expired` without mutating the stored `status` column. `internal/handlers/quotes.go` applies this via `withEffectiveStatus`/`withEffectiveStatuses` so **every** endpoint above that serializes a Quote — List, Get, Create, Update, and Export-PDF — returns/renders the effective status, not the raw stored one.

> **`FR-CRM-046` data hand-off is frontend-only, no API change.** `POST /deals/:dealId/quotes`'s request body is unchanged — `pages/crm/quotes/create.vue` (the modal's 2026-08-23 full-page replacement, `CrmAddQuoteModal` before it) pre-fills `scope_of_work` with `deal.title` and one `items[]` row with `qty: 1, price: deal.value` (description left blank, all fields editable) client-side before the same request fires, so the request the backend receives looks identical to a manually-typed one. `QuoteItem.description` has never had a backend-side non-empty check — it's only ever been a frontend `rules="required"` on the form field, and that rule was removed 2026-08-23 alongside this change.

### 7.5 Payments

```ts
type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other'

interface Payment {
  id: number
  deal_id: number
  amount: number
  paid_at: string
  method: PaymentMethod
  note: string
}
```

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/deals/:dealId/payments` | 🟢 | List installments for a Deal, plus a computed `total_paid`. Backs the Deal detail page's Payments tab (`stores/payments.ts`'s `forDeal`/`totalForDeal` getters — move that sum server-side once real). |
| `POST` | `/deals/:dealId/payments` | 🟢 | Create — backs `components/Crm/AddPaymentModal.vue`. |
| `DELETE` | `/payments/:id` | 🟢 | Delete. |

### 7.6 Tasks

```ts
type TaskStatus = 'pending' | 'done'
type TaskRelatedType = ActivityRelatedType   // 'contact' | 'company' | 'deal' | 'prospect'
// Plain triage label, no workflow behavior attached (unlike TaskStatus) — added 2026-08-22.
type TaskPriority = 'low' | 'medium' | 'high'

interface Task {
  id: number
  related_type: TaskRelatedType
  related_id: number
  title: string
  description: string   // added 2026-08-22 — free-text elaboration on title, optional
  due_date: string
  status: TaskStatus
  priority: TaskPriority   // added 2026-08-22 — defaults 'medium'
  assigned_to: number | null
  notified_at: string | null   // set once the due-date reminder email has been sent for this Task, so the 15-min ticker doesn't re-send it
  created_at: string
}
```

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/tasks` | 🟢 | Filters: `related_type`+`related_id`, `status`, `assigned_to`. `status=pending` powers the dashboard's "Upcoming Follow-ups" widget across all related records — support that query without requiring `related_type`/`related_id`. |
| `POST` | `/tasks` | 🟢 | Create. Body now also accepts `description`/`priority` (both optional, `priority` defaults `medium` server-side if omitted/blank). |
| `PATCH` | `/tasks/:id` | 🟢 **added 2026-08-22** | Update `title`/`description`/`due_date`/`priority`/`assigned_to` — `related_type`/`related_id` stay immutable after creation (same immutability rule as Contract's `quote_id` and CustomerProduct's `product_id`), and `status` changes still go through the dedicated toggle endpoint below, not this one. Ownership-gated via `CanWrite` against both the task's current assignee and the incoming `assigned_to`, mirroring `BulkReassign`. |
| `PATCH` | `/tasks/:id/toggle` | 🟢 | Flips `pending`⇄`done` — mirrors `stores/tasks.ts`'s `toggleDone`. |
| `DELETE` | `/tasks/:id` | 🟢 | Delete. |
| — | *(reminder notifications)* | 🟢 | `FR-CRM-032`'s "notification on due" is now built as email: a new `internal/notifier` package runs a 15-minute ticker, sends via `internal/utils/mailer.go`, and sets `Task.notified_at` so a Task is only ever notified once. It degrades safely (silently no-ops) if no `SMTP_*` env vars (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USERNAME`/`SMTP_PASSWORD`/`SMTP_FROM`, see `.env.example`) are configured — an operator must supply real SMTP credentials for reminders to actually send. Push notification is not built. |

---

## 8. Planned entities

This section was originally written with nothing built on either side. That's no longer true for any subsection: §8.1 (Contracts), §8.2 (Products/Customer-Products), §8.3 (Projects), §8.4 (Reports), and §8.5 (Audit log) all now have real backend handlers **and** frontend pages/stores/interfaces consuming them — treat all of §8 as 🟢 **Built**, kept under "Planned entities" only to avoid re-plumbing every cross-reference into an earlier section. See `feature-spec.md` §3.5/§3.6/§3.7/§3.8 for the corresponding requirement-level status.

### 8.1 Contracts (`FR-CRM-043`–`045`)

```ts
type ContractStatus = 'draft' | 'sent' | 'signed' | 'expired'

interface Contract {
  id: number
  deal_id: number
  // Optional — links the Contract to the Quote its PDF export prices from.
  quote_id: number | null
  status: ContractStatus
  signed_file_url: string | null
  signed_date: string | null
}
```

| Method | Path | Description |
|---|---|---|
| `GET` | `/deals/:dealId/contracts` | List. |
| `POST` | `/deals/:dealId/contracts` | Create. Body: `{status?, quote_id?}`. |
| `PUT` | `/contracts/:id` | Update. Body: `{status?, quote_id?}`. |
| `POST` | `/contracts/:id/upload` | Upload the signed document (§6.1) → sets `signed_file_url`/`signed_date`, flips status to `signed`. |
| `GET` | `/contracts/:id/export-pdf` | 🟢 — returns a generated PDF (`github.com/go-pdf/fpdf`, same renderer as the Quote export): party details (Company `legal_name`/`address`/`tax_id`, Contact name/role), Deal info, the linked Quote's `scope_of_work` and line items/total (if `quote_id` is set), status, signed date, and a signature-line placeholder. Read-only, same access level as List (no `CanWrite` check). Shares the 2026-08-22 `RenderLineItemsTable` multi-line-description fix noted in §7.4, and (2026-08-22) now also renders the linked Quote's `scope_of_work` as a wrapped paragraph above the pricing table — Contract is meant to be "a single source of truth for what was agreed" (S-17), so its export shouldn't capture price without the scope it was priced against. |

Frontend: a "Contracts" tab on the Deal detail page (`pages/crm/deals/[id]/contracts.vue`, nested under the `pages/crm/deals/[id].vue` tab-bar parent), backed by `stores/contracts.ts` and `components/Crm/AddContractModal.vue` (which lets the user optionally link one of the Deal's existing Quotes, defaulting to the most recently Accepted one — `FR-CRM-047`, frontend-only, no API change).

> **`FR-CRM-048` (auto-create-Project-on-Signed) is also frontend-only.** Whenever `POST /deals/:dealId/contracts` or `POST /contracts/:id/upload` resolves to `status: 'signed'`, `contracts.vue` opens the same `CrmAddProjectModal` the Deal-Won flow uses (via the shared `useCreateProjectFromDeal` composable), which then calls `POST /companies/:companyId/projects` (§8.3) same as any other Project creation — no new backend endpoint. The composable also guards against opening the prompt when `projectsStore` already has a Project for this Deal (`forDeal` getter, one-Project-per-Deal assumption), since the Won and Signed triggers can both fire for the same Deal.

### 8.2 Product Catalog & Customer-Product tracking (`FR-CRM-060`–`066`)

```ts
interface Product {
  id: number
  name: string
  category: string
  description: string
  is_active: boolean
}

type CustomerProductStatus = 'Interested' | 'Trial' | 'Active' | 'Churned'

interface CustomerProduct {
  id: number
  company_id: number
  product_id: number
  status: CustomerProductStatus
  start_date: string
  end_date: string | null
  source_deal_id: number | null
}
```

| Method | Path | Description |
|---|---|---|
| `GET` / `POST` | `/products` | Product Catalog list/create (any authenticated role — the catalog is a shared resource, not Admin-gated). |
| `PATCH` | `/products/:id` | Full edit of the catalog entry's own fields (name/category/description/is_active) — distinct from Deactivate below, which is left as the dedicated "remove from catalog" action. |
| `PATCH` | `/products/:id/deactivate` | Sets `is_active: false` rather than deleting. |
| `GET` | `/companies/:companyId/products` | List a Company's Customer-Product records — powers the Company profile's "Products in use" section (`FR-CRM-066`). |
| `POST` | `/companies/:companyId/products` | Manually add/change status independent of a Deal (`FR-CRM-065`). Body also accepts `start_date` (optional, defaults to now server-side) and `source_deal_id` (optional — lets a rep manually link the new record back to a Deal, e.g. via `AddCustomerProductModal.vue`'s Deal picker, independent of the still-unimplemented Won-triggered auto-create in the row below). **Fixed 2026-08-22**: `start_date` was previously parsed from the request but never applied to the record (`internal/handlers/products.go`'s `AddForCompany`), so every manually-created row silently got Go's zero-value date regardless of what was sent — now applied (or defaulted to now). |
| `PATCH` | `/customer-products/:id` | Update a Customer-Product's own `status`/`end_date` after creation (e.g. Interested → Trial → Active → Churned) — `company_id`/`product_id` are immutable. Writes a `customer_product`/`status_changed` audit entry (§8.5) when `status` actually changes. `end_date` remains settable only here, never at creation. |
| ~~Side effect, not a separate endpoint~~ | — | **Rejected 2026-08-22, not deferred.** This row previously specified auto-creating/updating a `CustomerProduct` (`status: 'Active'`) for each Quote Product when a Deal is marked `Won` (`FR-CRM-064`). Confirmed with the business owner that this is the wrong behavior, not an unbuilt one: `Product`/`CustomerProduct` model the company's own packaged products/subscriptions — sold via Contract, charged once/annually — which is a largely separate population of deals from the custom-software-project deals that make up most Won Deals (those become a `Project` instead, via the Quote/Contract flow and `scope_of_work`, §7.4). Do not implement this side effect; `POST /companies/:companyId/products` (manual, FR-CRM-065) is the intended and only path. |

### 8.3 Projects (`FR-CRM-067`–`071`)

```ts
type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled'

interface Project {
  id: number
  company_id: number
  deal_id: number | null
  name: string
  status: ProjectStatus
  start_date: string
  target_end_date: string | null
  // Added 2026-09-03 — planning estimates set by Sales before work is
  // confirmed, distinct from start_date (record-creation time, not a
  // schedule) and target_end_date (the deadline FR-CRM-098's projects-at-risk
  // report checks). Both nullable; no report/automation reads them yet.
  expected_proposal_date: string | null
  expected_start_date: string | null
  production_reference: string | null   // free-text ID and/or URL into Production's own system
  notes: string
  company_name?: string   // only present on GET /projects rows (see below) — the per-company list doesn't merge this in
}
```

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/companies/:companyId/projects` | any | List — Company profile's "Projects" section (`FR-CRM-070`). |
| `POST` | `/companies/:companyId/projects` | Sales/Admin | Create manually, or prompted when a Deal is marked Won (`FR-CRM-068`). |
| `GET` | `/projects` | any | Cross-company list — a global Projects view, since `/companies/:companyId/projects` can only show one company at a time. Supports `status`, `company_id` filters; each row's `company_name` is merged in the same way `/companies/:companyId/products` merges Product into CustomerProduct. |
| `PATCH` | `/projects/:id` | Sales/Admin **or** Production (§1.7) | Production's role is scoped to `status` and `production_reference` only — enforce field-level, not just endpoint-level, authorization here: reject the request if the body contains any other key, don't just silently drop them. Writes a `project`/`status_changed` audit entry (§8.5) when `status` actually changes, same as `PATCH /customer-products/:id`. `components/Crm/AddProjectModal.vue` mirrors this client-side — a Production caller only ever sees/submits `status`/`production_reference`, since submitting the full field set would 403 against this same restriction. |

Do **not** add sub-resources for tasks/sprints/milestones under `/projects/:id` — `FR-CRM-071` explicitly rules this out; a Project here is a summary record, never a delivery-management tool.

### 8.4 Reports (`FR-CRM-054`, `056`, `093`–`098`)

All eight report endpoints are Admin/Sales-Manager only (`RequireRoles`) and have real frontend pages under `pages/crm/reports/` (a small landing page linking to each, gated the same way):

| Method | Path | Description |
|---|---|---|
| `GET` | `/reports/lead-source-conversion?assigned_to=&date_from=&date_to=` | Conversion rate by `Lead.source` (`FR-CRM-054`). `assigned_to`/date-range filters are `FR-CRM-055`. No `company_tag` filter — `Lead` has no Company foreign key (only a free-text `company_name`), so tag-filtering by company doesn't apply here. |
| `GET` | `/reports/customers-by-product-status?product_id=&status=&company_tag=` | "Which customers use Product X" / "have a Project in status Y" (`FR-CRM-056`) — do not confuse with the `business_unit`/`channel` filters in §9, which are lightweight Deal tags, not this real relationship query. `company_tag` (`FR-CRM-055`) filters to Companies whose `tags` array contains the given value. |
| `GET` | `/reports/win-loss-reasons?date_from=&date_to=&assigned_to=` | `FR-CRM-093`. Every closed Deal (won or lost), grouped by `"won"` or its `lost_reason` code. |
| `GET` | `/reports/stalled-deals?min_days=&assigned_to=` | `FR-CRM-094`. Open Deals with no logged Activity for at least `min_days` (default 14) — `last_activity_at` is `COALESCE(MAX(activities.created_at), deals.created_at)`. |
| `GET` | `/reports/outstanding-balance?company_tag=&assigned_to=` | `FR-CRM-095`. Won Deals whose recorded Payments sum to less than the Deal's value. Not date-bucketed 30/60/90-day aging — `Payment` has no `due_date` field, only `paid_at` (when actually received) — this is a flat "who still owes what" list until that field exists. |
| `GET` | `/reports/quotes-expiring-soon?within_days=` | `FR-CRM-096`. Sent quotes whose `validity_date` falls within the next `within_days` (default 7) — the forward-looking mirror of `Quote.EffectiveStatus`'s already-expired check, same dual-format (RFC3339 / bare date) parsing. |
| `GET` | `/reports/contracts-stuck?min_days=` | `FR-CRM-097`. Draft/Sent contracts unsigned for at least `min_days` (default 14) — `Contract` has no start/end date, only `signed_date`, so this tracks staleness before signature, not true expiration. |
| `GET` | `/reports/projects-at-risk` | `FR-CRM-098`. Projects past `target_end_date` that aren't `Completed` or `Cancelled`. |
| `GET` | `/reports/sales-cycle?assigned_to=&date_from=&date_to=` | `FR-CRM-099`, extending `FR-CRM-057`'s single average. Response shape (not a bare row array like the others — see below): `{ by_stage: SalesCycleBucketRow[], by_rep: SalesCycleBucketRow[], by_source: SalesCycleBucketRow[], avg_sales_cycle_days: number, closed_deal_count: number }` where `SalesCycleBucketRow = { key: string, avg_days: number, count: number }` (`key` is a stage name, a Sales Rep user id as a string, or a Lead source name depending on which array it's in). Derived entirely from `"deal"` `stage_changed` `audit_log_entries` rows (§8.5) — walks each Deal's transitions in creation order, measuring the gap between consecutive ones (and from `Deal.created_at` to the first one); only completed segments count toward `by_stage`/`by_rep`/`by_source`, not a Deal's current still-open stage. `avg_sales_cycle_days`/`closed_deal_count` cover Won/Lost Deals only, measured from `created_at` to the audit entry where `after.status` first matches the Deal's final resolved status. `fetchSalesCycle` itself takes plain `assignedTo`/`dateFrom`/`dateTo` params (refactored from `*fiber.Ctx` on 2026-08-21) specifically so `GET /dashboard/summary`'s own `avg_sales_cycle_days` (§9) — previously a hardcoded `0` stub — could call the exact same computation rather than duplicating it; see §9's note. |

All seven new endpoints (`sales-cycle` included) return `[]`/an explicit shape (never `null`) for an empty result — a real bug hit while building them: a `var rows []T` Go destination that `Scan` never touches (zero matching rows) stays a nil slice, and `encoding/json` marshals a nil slice as `null`, which crashes the frontend calling `.map()`/`.length` on the response body. Every new handler in `internal/handlers/reports.go` initializes its result slice as `rows := []T{}` specifically to avoid this — keep that pattern for any report added after these.

### 8.5 Audit log (`FR-CRM-082`)

```ts
interface AuditLogEntry {
  id: number
  entity_type: string       // 'deal' | 'project' | 'customer_product' | ...
  entity_id: number
  action: string             // e.g. 'stage_changed', 'status_changed'
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  actor_id: number
  created_at: string
}
```

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/audit-log` | Admin | Filters: `entity_type`, `entity_id`, `actor_id`, date range. Must be **append-only** at the storage layer (`NFR-007`) — no `PUT`/`DELETE` route should exist for this resource at all. |

At minimum, write an entry whenever: a Deal's `stage` changes, a Deal's `status` becomes `won`/`lost`, or a `CustomerProduct`/`Project` `status` changes (per `FR-CRM-082`'s explicit minimum scope) — all four are now implemented (`deals.go` for the Deal events, `projects.go`/`products.go` for the other two). The frontend's `/admin/activity-log` page is already repointed at this real endpoint.

`entity_type`+`entity_id` filtering (already supported above) also now backs a second, narrower consumer: the Deal detail page's Admin-only "Owner History" card (`pages/crm/deals/[id]/index.vue`) calls `GET /audit-log?entity_type=deal&entity_id=:id&per_page=200`, then filters client-side to `reassigned`/`bulk_reassigned` actions to show that one Deal's prior owners. No endpoint changes were needed for this — it's a straightforward second consumer of the existing filter. The explicit `per_page=200` override (the store's own default is 20, sized for the paginated Activity Log list view) exists because there's no server-side `action` filter to narrow the query to just reassignments — without it, a Deal with more than 20 total audit-log rows of any action type could silently drop older reassignments off this card. Same class of "unbounded-but-capped" limitation as NFR-003 below, just smaller-radius.

### 8.6 Attachments (`FR-CRM-085`–`090`)

Generic file/link attachments for Leads, Deals, Companies, and Projects — quotations, proposals, estimations, plans, and other supporting material — as distinct from the two narrower, purpose-specific file fields that already exist: `Quote`'s exported PDF (§7.4) and `Contract.signed_file_url` (§8.1). Those keep their own dedicated upload endpoints; this is the general-purpose one for everything else.

```ts
type AttachmentCategory = 'Quotation' | 'Proposal' | 'Estimation' | 'Plan' | 'Support' | 'Other'
type AttachmentRelatedType = 'lead' | 'deal' | 'company' | 'project' | 'prospect'

interface Attachment {
  id: number
  related_type: AttachmentRelatedType
  related_id: number
  category: AttachmentCategory
  file_name: string
  file_url: string | null       // set when uploaded as a binary file (§6.1 convention)
  external_url: string | null   // set when linking an external doc instead (e.g. Google Sheets/Docs/Drive) — link, not upload, since Google Workspace files aren't downloaded/re-hosted
  file_size: number | null      // bytes; null when external_url is set
  mime_type: string | null      // null when external_url is set
  uploaded_by: number
  created_at: string
}
```

Exactly one of `file_url`/`external_url` must be present on every row — reject a create request that sets both or neither, same as `productionAllowedKeys`-style field-level validation elsewhere in this spec (§8.3).

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/attachments` | any | Filters: `related_type`, `related_id` (required together), `category`. Backs a shared "Attachments" panel usable on Lead/Deal/Company/Project detail pages, the same way `/activities` (§7.2) backs the shared timeline — note `Activity` itself doesn't cover Lead, so this is one step broader than that existing pattern. |
| `POST` | `/attachments` | Sales/Admin (same RBAC as Project create, §8.3) | Two request shapes depending on which field is set: `multipart/form-data` with a `file` part (§6.1 convention: max 10 MB, allow-listed MIME types — PDF, PNG/JPG, XLSX/XLS/CSV) when uploading, or a plain JSON body `{ related_type, related_id, category, external_url }` when linking. Always also takes `related_type`/`related_id`/`category` either as form fields or JSON. |
| `DELETE` | `/attachments/:id` | Sales/Admin, or the original uploader | Deletes the metadata row only — the file itself is left in object storage (no orphan-cleanup job in v1, matching §6.1's general storage approach). |

> **Lead → Deal conversion (`POST /leads/:id/convert`, §3):** re-point any `Attachment` rows with `related_type: 'lead'` and `related_id: <the converted lead>` to `related_type: 'deal'`/the newly created Deal's id, in the same transaction as the conversion — don't leave them stranded on a Lead record that no longer appears in any list view once converted.
>
> **Prospect → Lead conversion (`POST /prospects/:id/convert`, §3a):** same re-pointing, one funnel stage earlier — `related_type: 'prospect'` rows move to `related_type: 'lead'`/the newly created Lead's id, in the same transaction as the conversion.

### 8.7 Admin pipeline configuration (`FR-CRM-021`, `FR-CRM-081`)

```ts
interface PipelineStage {
  id: number
  name: string          // the DealStage string value used elsewhere (e.g. "Proposal Sent")
  display_label: string | null   // optional Admin-set label shown in the UI instead of name (e.g. "Proposition")
  sort_order: number
  is_won_stage: boolean    // Deal.status resolves to "won" when its stage matches a row with this flag
  is_lost_stage: boolean   // Deal.status resolves to "lost" when its stage matches a row with this flag, and lost_reason becomes required
  is_active: boolean
}

interface LeadSourceOption {
  id: number
  name: string   // the LeadSource string value used elsewhere
  is_active: boolean
}

// Added 2026-09-01 — Prospect's own source list, separate from
// LeadSourceOption above (see §3a's Prospect.source comment for why).
interface ProspectSourceOption {
  id: number
  name: string
  is_active: boolean
}
```

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` / `POST` | `/admin/pipeline-stages` | Admin | List/create pipeline stage rows. Seeded from the previously hardcoded `DEAL_STAGE_OPTIONS` list on first run so existing Deals keep resolving the same way. |
| `PUT` / `DELETE` | `/admin/pipeline-stages/:id` | Admin | Update/deactivate a stage. `is_won_stage`/`is_lost_stage` are read by `internal/handlers/deals.go`'s `IsWonStage`/`IsLostStage` helpers, so renaming or adding a custom stage with these flags set is honored by Won/Lost resolution across Create/Update/`PATCH /deals/:id/stage`. |
| `GET` / `POST` | `/admin/lead-sources` | Admin | List/create Lead source rows. Seeded from the previously hardcoded `CHANNEL_OPTIONS`/`LEAD_SOURCE_OPTIONS` lists on first run. |
| `PUT` / `DELETE` | `/admin/lead-sources/:id` | Admin | Update/deactivate a Lead source. |
| `GET` / `POST` | `/admin/prospect-sources` | Admin | List/create Prospect source rows — Marketing's own funnel-source taxonomy (§3a), Admin-only same as every other option list here even though Marketing owns day-to-day Prospect data. Seeded with 6 defaults on first run: Social Media, LINE OA, Email Campaign, Content/SEO, Cold Outreach, Marketing Campaign. |
| `PATCH` / `DELETE` | `/admin/prospect-sources/:id` | Admin | Update/deactivate a Prospect source (soft `is_active: false` flip, not a hard delete). |

Frontend: `pages/admin/pipeline-config.vue`, backed by `stores/pipelineStages.ts`/`stores/leadSources.ts`/`stores/prospectSources.ts`. The old frontend-only `DEAL_STAGE_OPTIONS`/`CHANNEL_OPTIONS`/`LEAD_SOURCE_OPTIONS` constants (`constants/mockData/deals.ts`, `leads.ts`) were removed — these stores are now the source of truth. Tags and Product Catalog remain outside this config screen (`FR-CRM-081` is still partial on those two).

### 8.7a Admin app settings (`FR-CRM-058`, `FR-CRM-091`, `FR-CRM-045`)

```ts
interface AppSettings {
  id: number                    // always 1 — singleton row
  quarterly_sales_target: number
  annual_revenue_goal: number
  lead_scoring_mql_threshold: number   // FR-CRM-007 — a Lead's `score` (§3.1) at or above this value classifies it 'mql'
  require_signed_contract_before_won: boolean   // FR-CRM-045 — default false ("configurable, not hard-enforced by
                                                  // default"); see §7.1's DealHandler note for the enforcement side
  updated_at: string            // surfaced in the Admin UI as a "last updated" hint —
                                 // neither figure resets itself on a new quarter/year
}
```

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/settings` | Admin | Loads the singleton `AppSettings` row (`id: 1`), falling back to the seeded default rather than erroring if it's somehow missing. |
| `PATCH` | `/admin/settings` | Admin | Updates it — `quarterly_sales_target` and `annual_revenue_goal` are required on every PATCH (this predates `lead_scoring_mql_threshold`/`require_signed_contract_before_won` and existing callers/tests only ever sent these two), each must be `>= 0`. `lead_scoring_mql_threshold` and `require_signed_contract_before_won` are both **optional** on PATCH — added later, so omitting either just leaves its current value in place rather than 422ing a PATCH that predates it; `lead_scoring_mql_threshold` must also be `>= 0` when present. Writes an `audit_log_entries` row (`entity_type: "settings"`, `action: "updated"`, before/after values, actor) whenever any of the four values actually changes — a no-op PATCH (identical values) does not write one. A real change also clears `GET /dashboard/summary`'s response cache (§9) immediately, rather than leaving the Admin who just changed a figure looking at their own stale pre-PATCH value for up to that cache's TTL. |

> **FR-CRM-045 enforcement lives in `DealHandler`, not here.** `PATCH /admin/settings` only stores the toggle — the actual block happens in `internal/handlers/deals.go`'s `Create`/`Update`/`UpdateStage` (§7.1), via a shared `validateContractSignedBeforeWon(dealID)` helper: when the toggle is true and the submitted form would move the Deal into Won (by stage or by `status`), it counts that Deal's Contracts with `status: 'signed'` and 422s (`"a signed contract is required before marking this deal Won"`) if that count is 0. `dealID` is `0` for a brand-new Deal created directly as Won, which naturally also blocks (a Deal can't have a Contract before it exists) with no special-casing needed.

Backend: `internal/models/settings.go` (`AppSettings`, seeded via `DefaultAppSettings` the same way `PipelineStage`/`LeadSourceOption` seed), `internal/handlers/settings.go` (its `Update` handler uses `utils.SaveWithAudit`, the same helper `deals.go`'s stage-change/reassign endpoints use, rather than a plain `db.Save` — this was a gap until FR-CRM-091 added it, since app settings changes previously left no audit trail unlike every other Admin-configurable resource; on a real change it also calls `dashboard.go`'s `InvalidateDashboardCache()`). `internal/handlers/dashboard.go`'s `appSettings()` reads this row instead of the old hardcoded `QUARTERLY_SALES_TARGET`-style constant (§9 below), feeding both `quarterlySalesTarget` (FR-CRM-058) and `annualRevenueGoal` (FR-CRM-091). Frontend: a "Sales Quota & Revenue Goals" card on `pages/admin/pipeline-config.vue`, backed by `stores/appSettings.ts`, showing a "last updated" hint sourced from `updated_at`.

### 8.7b Per-quarter/per-year sales targets (`FR-CRM-092`)

`quarterly_sales_target` above (`FR-CRM-058`) is one flat figure, always treated as "whatever the current quarter is" — an Admin who wants Q4's target to differ from Q3's had to remember to edit the singleton the moment Q4 started, and there was no way to pre-set a future year's targets in advance. This section adds a separate, additive CRUD resource on top of it rather than changing §8.7a's fixed two-required-field PATCH contract.

```ts
interface SalesTarget {
  id: number
  year: number
  quarter: number         // valid range 1-4, enforced server-side (§8.7b's
                          // validation below) — modeled as a plain number in
                          // interfaces/crm.d.ts, not a 1|2|3|4 literal union,
                          // since TS can't narrow a plain form-payload number
                          // down to a literal union without an assertion
  target_value: number   // the true quarterly figure directly — NOT divided
                          // by 4 the way quarterly_sales_target is derived
  created_at: string
  updated_at: string
}
```

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/sales-targets` | Admin | List every `SalesTarget` row, oldest-to-newest by `(year, quarter)`. Optional `?year=2026` filters to one year. |
| `POST` | `/admin/sales-targets` | Admin | Create a row for one `(year, quarter)` — any year 2000–2100, quarter 1–4, past/current/future. Rejected (`422`) if a row for that exact period already exists (`PATCH` it instead) or `target_value < 0`. |
| `PATCH` | `/admin/sales-targets/:id` | Admin | Update an existing row's `year`/`quarter`/`target_value`. Same period-collision check as `POST` if `year`/`quarter` change. |
| `DELETE` | `/admin/sales-targets/:id` | Admin | Hard-deletes the row (unlike `PipelineStage`'s soft `is_active` flip — nothing else references a `SalesTarget` row by ID). That period reverts to the flat `quarterly_sales_target / 4` fallback; re-adding a row for the same period restores the override. |

Every write (`POST`/`PATCH`/`DELETE`) writes an `audit_log_entries` row (`entity_type: "sales_target"`, action `created`/`updated`/`deleted`) via the same `utils.SaveWithAudit` helper §8.7a uses, and calls `dashboard.go`'s `InvalidateDashboardCache()` on success — identical plumbing to the `AppSettings` PATCH, since a `SalesTarget` change also silently changes `GET /dashboard/summary`'s `pipeline_coverage_ratio` without touching the `deals` table.

Backend: `internal/models/sales_target.go` (`SalesTarget`, unique index on `(year, quarter)`), `internal/handlers/sales_targets.go`. `internal/handlers/dashboard.go`'s new `currentQuarterTarget()` resolves the actual figure `pipeline_coverage_ratio` divides `open_pipeline_value` by: a `SalesTarget` row for *today's* calendar `(year, quarter)` if one exists, else `quarterly_sales_target / 4` (§9 below, unchanged). Frontend: a "Quarterly Sales Targets" card on `pages/admin/pipeline-config.vue` below the existing quota card, backed by `stores/salesTargets.ts` and `components/Crm/SalesTargetModal.vue` — a Year/Quarter/Target table with add/edit/delete, each row badged Current/Upcoming/Past relative to today's date so an Admin can see at a glance which period is live.

### 8.7c Workflow notification rules (`FR-CRM-100`–`102`)

Admin-configurable rules a new background ticker (`internal/notifier/workflow_rules.go`, same 15-minute cadence as the Task due-date reminder ticker, §7.6, but its own separate goroutine) evaluates and emails on. One fixed condition per `entity_type` — not a free-form condition-expression engine — so adding a rule of an existing entity type is pure config, but a genuinely new condition shape would still need a backend code change (`FR-CRM-102`'s "generic within three supported shapes," not a full rule DSL).

```ts
type NotificationEntityType = 'deal' | 'quote' | 'contract' | 'prospect'
type NotificationRecipientRole = 'owner' | 'owner_and_managers'

interface NotificationRule {
  id: number
  name: string
  entity_type: NotificationEntityType
  threshold_days: number
  recipient_role: NotificationRecipientRole
  is_active: boolean
  created_at: string
}
```

Per-`entity_type` condition (fixed, not configurable beyond `threshold_days`):

| `entity_type` | Fires when | Reuses the definition from |
|---|---|---|
| `deal` | An open Deal (`status: 'open'`) has held its current stage for at least `threshold_days`, measured from its most recent `"deal"`/`"stage_changed"` audit log entry (or `Deal.created_at` if it never changed stage) — `FR-CRM-100`. | New — no prior report matched this exactly. |
| `quote` | A `sent` Quote's `validity_date` falls within `threshold_days` from now — `FR-CRM-101`. | `GET /reports/quotes-expiring-soon` (`FR-CRM-096`). |
| `contract` | A `draft`/`sent` Contract has been unsigned for at least `threshold_days` since `created_at` — `FR-CRM-101`. | `GET /reports/contracts-stuck` (`FR-CRM-097`). |
| `prospect` | **Added 2026-09-03.** A Prospect not yet `Converted`/`Disqualified` (still actively worked) has gone at least `threshold_days` since `updated_at` with no change — `FR-CRM-107`. Uses `updated_at` rather than an audit-log stage-history lookup like `deal` — Prospect status changes aren't separately audited the way Deal stage is, so `updated_at` is the closest available "last touched" signal. | New — Marketing's own funnel had no staleness signal at all before this. |

`recipient_role` resolves to the owner's email (`owner`), or the owner plus every currently-active Sales Manager (`owner_and_managers`) — there's no per-rep manager hierarchy in this schema to notify one specific manager (this also applies to `prospect` rules: "managers" still means Sales Manager, who already has oversight visibility into Prospects per `PROSPECT_ROLES`, not Marketing itself). Idempotency is per `(rule_id, entity_id, context)` via a `NotificationLog` row (`context` is the Deal's stage at fire time for `deal` rules, or the Prospect's status for `prospect` rules — so re-idling in a new stage/status can re-fire; empty string for `quote`/`contract` rules, which only ever need to fire once per entity). Degrades safely (no-op) with no `SMTP_*` env vars configured, same as the Task reminder ticker.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` / `POST` | `/admin/notification-rules` | Admin | List (always active + inactive) / create. `threshold_days` must be `> 0`. |
| `PATCH` / `DELETE` | `/admin/notification-rules/:id` | Admin | Update / deactivate (`DELETE` is a soft `is_active: false` flip, same convention as `/admin/pipeline-stages`). |
| `GET` | `/notification-log` | any | **Added 2026-08-21, extended 2026-09-03 for `prospect` firings.** Recent firings, in-app — previously email-only, so a rep with no/misconfigured SMTP had zero visibility. Not `RequireRoles`-gated; scoping happens per-row inside the handler via the existing `CanWrite(c, assignedTo)` helper (`internal/handlers/ownership.go`, used throughout `leads.go`/`deals.go`/`prospects.go`) — a Sales Rep only sees firings for Deals they own, a Prospect's own assignee sees their `prospect` firings, Admin/Sales Manager see everything. This approximates `recipientEmails()`'s owner/owner_and_managers resolution without a persisted per-firing recipient list. Response: `{ id, rule_name, entity_type, deal_id?, deal_title?, prospect_id?, prospect_name?, notified_at }[]`, newest first, capped at 20 (over-fetches 200 `NotificationLog` rows before per-viewer scoping + the cap, so a Sales Rep still sees a full list of their own even if their relevant firings aren't among the newest 20 company-wide). `deal_id`/`deal_title` are only present for `deal`/`quote`/`contract` firings (Quote/Contract resolve to their Deal via one extra hop, same as `checkQuoteExpiringRule`/`checkContractStuckRule`); `prospect_id`/`prospect_name` only for `prospect` firings — additive fields, not a rename, so the existing dashboard "Recent Alerts" widget (Deal-only) is unaffected. Backend: `internal/handlers/notification_log.go`. Frontend: a "Recent Alerts" widget on `pages/index.vue` (dashboard), backed by `stores/notificationLog.ts` — modeled directly on the existing "Upcoming Follow-ups" Task widget rather than a new bell-icon/unread-count UI pattern, since nothing like that exists elsewhere in this app and `NotificationLog` doesn't model per-user read state anyway. That widget still only renders Deal-linked firings; a `prospect` firing has nothing for it to link to yet (Marketing's own dashboard surface is a separate, later addition, not part of this widget). |

Backend: `internal/models/notification_rule.go`, `internal/models/notification_log.go`, `internal/handlers/notification_rules.go`, `internal/handlers/notification_log.go`, `internal/notifier/workflow_rules.go`. Frontend: a "Notification Rules" tab on `pages/admin/pipeline-config.vue` (§8.7d), backed by `stores/notificationRules.ts`; the dashboard's "Recent Alerts" widget backed by `stores/notificationLog.ts`.

### 8.7d Admin pipeline-config page layout

`pages/admin/pipeline-config.vue` moved from one long scrolling page of stacked `UCard` sections to a 4-tab layout on 2026-08-21 (pure frontend template reorganization, no API/store/handler changes): **Pipeline Stages**, **Sales Quota & Targets** (quota + per-quarter targets), **Lead Sources & Scoring** (lead/deal sources + lead scoring criteria), **Notification Rules**. Local-`ref` tabs (`activeTab`, resets to "Pipeline Stages" on reload) — same convention as `pages/crm/companies/[id].vue`/`pages/admin/trash.vue`, not the route-backed child-route pattern `pages/crm/deals/[id].vue` uses (this page has no natural sub-routes). The "Related Configuration" (Tags) banner stays above the tabs, since it's a nav-out link, not a config section of its own.

### 8.8 CSV export (`FR-CRM-083`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/companies/export` | Admin/Sales Manager | Streams a CSV of every non-deleted Company matching the same filter params as `GET /companies` (§4), skipping pagination entirely so the file covers the full dataset. |
| `GET` | `/contacts/export` | Admin/Sales Manager | Same pattern, Contacts (§5). |
| `GET` | `/deals/export` | Admin/Sales Manager | Same pattern, Deals (§7.1). |
| `GET` | `/products/export` | Admin/Sales Manager | Same pattern, Product Catalog (§8.2). |
| `GET` | `/projects/export` | Admin/Sales Manager | Same pattern, Projects (§8.3). |

Backend: `internal/handlers/export.go`'s `ExportHandler`, gated by the same `bulkRoles` (Admin/Sales Manager) middleware as the trash/bulk-action routes. Frontend: an export button per list page + `composables/utils/useCsvExport.ts` (`downloadCsvBlob(path, filename)`).

---

## 9. Dashboard / reporting aggregates

`pages/index.vue` (Sales Pipeline Dashboard) currently computes every stat client-side from the full `deals`/`companies`/`contacts`/`tasks` store contents. That doesn't scale past mock-data volumes (`NFR-003` targets 2s page loads up to ~10,000 records) — replace the client-side computation with one aggregate endpoint instead of shipping full record sets to the browser.

| Method | Path | Status | Description |
|---|---|---|---|
| `GET` | `/dashboard/summary` | 🟢 | Query params mirror the dashboard's filter bar exactly: `date_from`, `date_to` (or a `period` preset: `all\|month\|quarter\|year\|last6\|last12`), `business_unit`, `business_unit_item`, `channel`, `assigned_to` (Sales Rep user id, `FR-CRM-055`), `company_tag` (`FR-CRM-055`). Returns every stat card + chart the page renders in one response (shape below). |

The response is cached process-wide for 30s per exact querystring (`internal/handlers/dashboard.go`'s `summaryCache`/`summaryCacheTTL`) — the ~11 underlying aggregate queries are too expensive to repeat on every dashboard refresh under concurrent viewers, and Deal data doesn't need to be second-fresh. `internal/handlers/settings.go`'s `PATCH /admin/settings` (§8.7a) and `internal/handlers/sales_targets.go`'s `POST`/`PATCH`/`DELETE /admin/sales-targets` (§8.7b) are the write paths that change this response's data (`quarterly_sales_target`/`annual_revenue_goal`/`pipeline_coverage_ratio`) without touching the `deals` table the cache is otherwise implicitly kept fresh against, so each explicitly calls `dashboard.go`'s exported `InvalidateDashboardCache()` on a real change — without that call, an Admin who just edited a goal or target would see their own stale pre-write value reflected back for up to the 30s TTL.

Response shape (one object covering every widget on `pages/index.vue`):

```json
{
  "data": {
    "open_pipeline_value": 4820000,
    "won_value": 1250000,
    "win_rate": 42,
    "open_deals_count": 18,
    "forecasted_revenue": 1740000,
    "avg_deal_size": 185000,
    "avg_sales_cycle_days": 34,
    "pipeline_coverage_ratio": 1.6,
    "quarterly_sales_target": 3000000,
    "annual_revenue_goal": 12000000,
    "annual_revenue_actual": 5230000,
    "annual_revenue_progress_ratio": 0.44,
    "annual_revenue_trend": [ { "label": "Jan", "actual": 1100000, "goal_pace": 1000000 }, "...Jan through the current month" ],
    "revenue_trend": [ { "label": "Mar", "value": 320000 }, "...6 months" ],
    "forecast_trend": [ { "label": "Mar", "value": 410000 }, "...6 months forward" ],
    "stage_breakdown": [ { "stage": "Qualified", "value": 900000, "count": 4 }, "...per DealStage" ],
    "industry_breakdown": [ { "industry": "Retail", "win_rate": 55, "won_count": 6 }, "..." ],
    "team_performance": [ { "user_id": 3, "name": "...", "won_count": 5, "won_value": 620000, "win_rate": 60 }, "..." ],
    "upsell_opportunities": [ /* stale-contact candidates grouped by tier, see FR in dashboard hint copy */ ]
  }
}
```

> **`avg_sales_cycle_days` is fixed as of 2026-08-21.** It was previously a hardcoded `0` stub (this doc briefly, incorrectly, documented it as working) — `Summary()` now calls `(&ReportHandler{DB: h.DB}).fetchSalesCycle(...)` (the same computation §8.4's `GET /reports/sales-cycle` uses, §8.4's `FR-CRM-099`), passing through only `assigned_to`/`date_from`/`date_to` from this endpoint's own query params (not `business_unit`/`channel`/`company_tag`, which `fetchSalesCycle` doesn't support), rounded to the nearest whole day. A query error leaves it at `0` rather than failing the whole dashboard summary.

`quarterly_sales_target` and `annual_revenue_goal` are both sourced server-side from the same `AppSettings` singleton row (§8.7a, `FR-CRM-058`/`FR-CRM-091` — Admin-configurable via `GET`/`PATCH /admin/settings`) rather than a hardcoded frontend constant. `pipeline_coverage_ratio` itself, however, divides `open_pipeline_value` by `currentQuarterTarget()` (§8.7b, `FR-CRM-092`) rather than `quarterly_sales_target / 4` directly: it first checks for a `SalesTarget` row matching *today's* calendar `(year, quarter)`, and only falls back to the flat `quarterly_sales_target / 4` if no such row exists — so the `quarterly_sales_target` value returned in this same response is always the flat singleton figure, which may or may not be what `pipeline_coverage_ratio` was actually computed against for the current quarter. `annual_revenue_actual` is the sum of Won Deal value since Jan 1 of the current calendar year — a fixed company-wide figure that deliberately ignores this endpoint's own filter params (`business_unit`/`channel`/`assigned_to`/`company_tag`/date range), the same convention `revenue_trend`/`forecast_trend` already follow, since the annual goal tracks the whole company against one company-wide target rather than a filtered slice. `annual_revenue_progress_ratio` is `annual_revenue_actual ÷ annual_revenue_goal` (0 if the goal is 0). The frontend's on-track indicator for this stat compares that ratio against how far through the calendar year it currently is (pro-rated), not a flat 100% bar — unlike `pipeline_coverage_ratio`'s on-track threshold, which is a flat `>= 1`.

`annual_revenue_trend` (`internal/handlers/dashboard.go`'s `annualRevenueTrend()`) is the same annual-goal figure broken out by month instead of one snapshot ratio: one point per elapsed month (Jan through the current month), each `actual` a *cumulative* running total (not that month's own delta) and each `goal_pace` a straight-line `annual_revenue_goal × months-elapsed/12` for the same point — lets the "Annual Goal Pace" chart on `pages/index.vue` show whether the company is ahead of or behind pace over the year, not just infer it from today's single ratio. Its last point's `actual` is also where `annual_revenue_actual` above comes from — one grouped query, not a duplicate `SUM`.

`forecast_trend` (`internal/handlers/dashboard.go`'s `forecastTrend()`) is the forward-looking counterpart to `revenue_trend`: instead of bucketing *won* Deal value by month for the trailing 6 months, it buckets *open* Deal value × probability by `expected_close_date` for the current month + 5 forward, mirroring `revenueTrend()`'s exact shape (`{label, value}[]`). Deals with no `expected_close_date` are excluded from these monthly buckets but are still counted in the headline `forecasted_revenue` total above — the two numbers are not required to reconcile bucket-by-bucket. Backs the new "Forecast Trend" chart card on `pages/index.vue`, next to Revenue Trend.

---

## 10. Cross-cutting non-functional requirements

Carried over from `feature-spec.md` §5 where they bear directly on the API:

| ID | Requirement |
|---|---|
| NFR-001 | RBAC (§1.7) enforced server-side on every route — never rely on the frontend hiding a button. |
| NFR-003 | List/dashboard endpoints must respond within budget for ~10,000 Company/Contact/Deal rows — this is the reason §9 is one aggregate endpoint instead of the frontend fetching full tables. Resolved for the list views: the Leads (`pages/crm/leads/index.vue`), Contacts (`pages/crm/contacts/index.vue`), Companies (`pages/crm/companies/index.vue`) list pages and the Deals List sub-view (`components/Crm/DealsTable.vue`) now call a new `fetchList()` store action (via `composables/utils/useServerListPage.ts`), which sends `page`/`per_page`/filters to the API and paginates server-side — no more fetching a single `per_page: 200` page and slicing it client-side. **Formerly known exception, now resolved:** the Deals Kanban board (`pages/crm/deals/index.vue`) no longer calls `dealsStore.fetchAll()`. It now fetches each active pipeline stage's Deals separately and in parallel via `dealsStore.fetchList({ stage, per_page: 40, page: 1 })`, with a `columnCounts` prop + `column-footer` "Load more" slot on `components/Crm/PipelineBoard.vue` (§design-system.md's component table) so a column can page in more Deals past the first 40 without ever loading the full unbounded set. **Found and resolved 2026-08-24, then swept across Deal/Contact/Lead the same day:** every `fetchAll()` action (Company/Deal/Contact/Lead) is capped at 200 rows, newest-first, same as every other list endpoint (`internal/utils/response.go`'s `Pagination` clamps `per_page` to 200 and silently falls back to 20 above that, so raising the frontend's requested page size doesn't help). Past ~200 records of a given type, older ones were invisible to every dropdown/picker/detail-page lookup built on that store's cached `items` — this is exactly how a user could add a Company (or Deal/Contact/Lead) and then be unable to find or even open it. Fixed comprehensively:
> - **Detail pages resolving their own subject record** (previously `someStore.items.find(id)`, which fails outright for a record past the cap): `pages/crm/companies/[id].vue`, `pages/crm/contacts/[id].vue`, `pages/crm/leads/[id].vue`, and `composables/utils/useCurrentDeal.ts` (shared by the whole `/crm/deals/:id` tree) now all use each store's new `fetchOne(id)` action (`GET /companies|deals|contacts|leads/:id`, upserts into `items`) when the record isn't already cached.
> - **Pickers/dropdowns/search boxes** (previously `someStore.items.map/filter(...)`, unscoped over the whole table): `components/Input/CompanySelect.vue` (Lead create/edit, Deal create, Contact create/edit, Task modal's Company branch) and the new generic `components/Input/AsyncSelect.vue` (Task modal's Deal/Contact branches) search the server live via `fetchList({ search })` (debounced via the new `composables/utils/useDebouncedSearch.ts`) instead of filtering a preloaded list. `components/Crm/GlobalSearch.vue`'s all four result groups (Deals/Companies/Contacts/Leads) do the same — as a side effect, its Leads group now matches by Company name again too, since `GET /leads?search=` joins to `companies` server-side. `pages/crm/contacts/index.vue`'s Company filter dropdown (missed in the first pass) was converted the same way, inline (kept its "All Companies" sentinel option, which the reusable components don't model).
> - **Related-record display lookups off an already-loaded parent** (lower severity — the parent page still loaded, only a label/sub-list could break): scoped to the specific record's actual company/deal instead of the global cache, via `fetchOne`/`fetchList({ company_id })`, in `pages/crm/quotes/[id].vue` (Deal/Company/Contact), `pages/crm/deals/[id]/index.vue` (Company/Contact name), `pages/crm/companies/[id].vue` and `pages/crm/contacts/[id].vue` (their own Deals/Contacts tabs, now scoped-fetched per-company rather than filtered from the global cache), `pages/crm/quotes/create.vue` and `pages/crm/deals/create.vue` (pre-fill from an originating Deal/Lead — the latter also gained scoped Contact/open-Deal fetches for its Company picker's dependent fields and duplicate-deal check), `pages/crm/projects/index.vue`/`components/Crm/AddProjectModal.vue`/`components/Crm/AddCustomerProductModal.vue` (linked-Deal name/picker), `composables/utils/useBusinessUnitItemOptions.ts` (Project items, now `fetchForCompany`-backed reactively instead of relying on a caller's blanket preload), and `composables/utils/useRelatedRecord.ts` (the Task/Activity related-record resolver shared by the dashboard follow-ups widget and the all-tasks list, now with in-flight-request deduping since it's called once per row).
>
> Not converted: a handful of genuinely bounded/small-scale lookups (e.g. `AddProjectModal`'s own Company picker when used standalone, without a fixed company context) were left as-is — flagged during this sweep as lower-risk, not silently missed. |
| NFR-004 | HTTPS/TLS only; passwords hashed (bcrypt/argon2) — never returned in any response, including the `User` shape in §2.1. |
| NFR-007 | Audit log (§8.5) is append-only — no update/delete route. |

---

## 11. Build order recommendation

1. **Auth + Users** (§2) — everything else needs a bearer token to test.
2. **Companies + Contacts** (§4–5), including import (§6.2) — every other entity hangs off these (per `feature-spec.md` §8's own build-order note).
3. **Leads + Deals** (§3, §7.1), including the `/deals/:id/stage` Kanban endpoint.
4. **Activities + Tasks + Tags + Payments** (§7.2, §7.3, §7.5, §7.6) — needed for the Deal/Company detail pages to be feature-complete against what's already built in the frontend.
5. **Dashboard aggregate** (§9) — once Deals/Companies exist with real volume, replace the frontend's client-side computation.
6. **Everything in §8** (Quotes, Contracts, Products/Projects, Audit log) — build alongside the corresponding frontend work, since none of it exists on either side yet. Start with Product Catalog + Customer-Product (§8.2), since `feature-spec.md` calls it out as the highest-value gap.
