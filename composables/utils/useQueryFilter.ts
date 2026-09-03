// Seeds a list-page filter ref from a route query param at setup, falling
// back to 'all' the same way every filter on these pages already defaults —
// used by Deals'/Prospects' dashboard deep-link seeding (see
// biz_spec/design-system.md's "Dashboard card deep-linking" note) so each
// filter doesn't repeat its own `typeof query[key] === 'string' ? ... : 'all'`
// ternary. Read once, not reactive to later query changes — matches how
// every other filter here is a plain ref the user drives by hand afterward,
// not something that stays synced to the URL as they keep changing it.
export function useQueryFilter (query: Record<string, unknown>, key: string) {
  const value = query[key]
  return ref(typeof value === 'string' ? value : 'all')
}
