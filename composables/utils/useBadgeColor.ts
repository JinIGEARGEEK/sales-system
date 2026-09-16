// Shared helper for the family of per-entity status-badge-color composables
// (useQuoteStatusColor, useProjectStatusColor, useContractStatusColor,
// useCustomerProductStatusColor, useLeadStatusColor) — each still keeps its own
// file/exported name so call sites read as `useXStatusColor()` per the existing
// per-entity-composable convention, but the repeated status->color switch is
// now a one-line lookup against a map instead of a duplicated switch block.
// useDealStageColor/useProspectStageColor deliberately don't use this: they
// derive color from a store row's is_won_stage/is_disqualified_stage flags,
// not from a fixed status->color map.
export type BadgeColor = 'neutral' | 'info' | 'success' | 'error' | 'warning'

export const badgeColorFromMap = <T extends string>(status: T, map: Partial<Record<T, BadgeColor>>): BadgeColor =>
  map[status] ?? 'neutral'
