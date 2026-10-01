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

// Display label for a status enum value, read from `global.status.<group>`
// (en + th) — the companion to badgeColorFromMap, so a badge never prints the
// raw API value ("accepted", "In Progress"). `keys` maps a value onto its
// locale key where the two differ (e.g. 'In Progress' -> 'inProgress'); an
// unknown value (a status the frontend doesn't know yet) falls back to the
// raw value rather than an i18n key path. Reads the app's i18n instance at
// call time, like useFormatter's currency(), so it works outside setup().
export const statusLabelFromGroup = <T extends string>(
  group: string,
  status: T,
  keys?: Partial<Record<T, string>>,
): string => {
  const { t, te } = useNuxtApp().$i18n
  const key = `global.status.${group}.${keys?.[status] ?? status}`
  return te(key) ? t(key) : status
}
