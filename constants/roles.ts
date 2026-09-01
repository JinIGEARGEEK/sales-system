// Shared role groupings referenced from more than one place — centralized so
// layouts/default.vue's nav filter and any other UI-only role gate (e.g.
// GlobalSearch) stay in sync instead of redeclaring the same list.
//
// Roles that engage with the sales pipeline entities (Leads/Deals/Tasks/
// Companies/Contacts/Tags) as a primary destination — user-story.md §4 is
// explicit that Production "is not a full user of this CRM; their only
// interaction is keeping a Project's status/reference current," so
// Production is excluded here. This is UI-only (nav visibility, search
// results) — the backend still allows Production's own read access to these
// resources; nothing here removes that.
export const SALES_PIPELINE_ROLES: Role[] = ['Admin', 'Sales Rep', 'Sales Manager']

// The other recurring role pairing in this codebase — bulk actions, exports,
// Reports, and Trash are all Admin/Sales Manager only (matches the backend's
// `bulkRoles` middleware group in internal/routes/routes.go). Previously
// re-declared as the same inline `hasRole('Admin', 'Sales Manager')` literal
// in ~16 separate call sites.
export const MANAGER_ROLES: Role[] = ['Admin', 'Sales Manager']

// The Prospect funnel's own role grouping (§3.1a) — Marketing owns it
// day-to-day, Admin/Sales Manager get oversight visibility, matching the
// backend's RequireRoles(Admin, Marketing, Sales Manager) gate on
// /prospects* in internal/routes/routes.go.
export const PROSPECT_ROLES: Role[] = ['Admin', 'Marketing', 'Sales Manager']
