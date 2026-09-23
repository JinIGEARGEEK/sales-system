// Shared role groupings referenced from more than one place — centralized so
// layouts/default.vue's nav filter and any other UI-only role gate (e.g.
// GlobalSearch) stay in sync instead of redeclaring the same list.
//
// Roles that engage with the sales pipeline entities (Leads/Deals/Tasks/
// Companies/Contacts/Tags) as a primary destination — user-story.md §4 is
// explicit that Production "is not a full user of this CRM; their only
// interaction is keeping a Project's status/reference current," so
// Production is excluded here. Marketing joined on 2026-09-23 (full Sales Rep
// parity on Leads/Deals, FR-CRM-123, alongside the Overview Pipeline page),
// mirroring the backend's `salesPipelineRoles` gate. This started as UI-only (nav visibility,
// search results, dashboard widget visibility) — the backend still allows
// Production's own read access to these resources; nothing here removes
// that. It also happens to be the exact role list the backend's own
// `POST /attachments` and Project-create RBAC enforce (internal/routes/
// routes.go), so every canManageAttachments/canManageProjects computed
// across Lead/Company/Contact/Prospect/Deal/Project pages reuses it too,
// rather than each re-listing the same roles.
export const SALES_PIPELINE_ROLES: Role[] = ['Admin', 'Sales Rep', 'Sales Manager', 'Marketing']

// The other recurring role pairing in this codebase — bulk actions, exports,
// Reports, and Trash are all Admin/Sales Manager only (matches the backend's
// `bulkRoles` middleware group in internal/routes/routes.go). Previously
// re-declared as the same inline `hasRole('Admin', 'Sales Manager')` literal
// in ~16 separate call sites.
export const MANAGER_ROLES: Role[] = ['Admin', 'Sales Manager']

// The Prospect funnel's own role grouping (§3.1a) — Marketing owns it
// day-to-day; Admin/Sales Manager get oversight visibility, and Sales Rep
// works Prospects ahead of the Lead hand-off the same way they work
// Leads/Deals. Matches the backend's RequireRoles(Admin, Marketing,
// Sales Manager, Sales Rep) gate on /prospects* in internal/routes/
// routes.go. Set-equal to TASK_ROLES below as of the Sales Rep addition —
// kept as its own named constant anyway since the two represent different
// concerns (Prospect access vs. Task access) that happened to converge, not
// the same rule; they're free to diverge again later.
export const PROSPECT_ROLES: Role[] = ['Admin', 'Marketing', 'Sales Manager', 'Sales Rep']

// Who uses the Tasks and Campaigns pages (backend's own `/tasks*` route group
// has no role restriction at all, internal/routes/routes.go). Used to be
// SALES_PIPELINE_ROLES plus Marketing; since Marketing joined that constant
// (2026-09-23) the two are set-equal, but it stays its own name since Task
// access and pipeline access are separate rules that may diverge again.
export const TASK_ROLES: Role[] = [...SALES_PIPELINE_ROLES]

// Roles an Admin can temporarily "use as" via the header's
// AdminRoleFocusSwitcher (stores/user.ts's focusRole/effectiveRole) — every
// other role, i.e. all of them minus Admin itself.
export const FOCUSABLE_ROLES: Role[] = ['Sales Rep', 'Sales Manager', 'Marketing', 'Production']
