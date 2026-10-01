// One colour rule for every on/off record-status badge — Company/Contact
// active vs archived, Tag/User/Product/option-list/stage/rule active vs
// inactive, API key active vs revoked: active is `success`, the off state is
// `neutral` (it isn't an error). Labels stay per entity and are passed in,
// since "Archived", "Inactive" and "Revoked" mean different things.
export const activeStatusColor = (active: boolean): BadgeColor => (active ? 'success' : 'neutral')

export const useActiveStatusBadge = () => {
  const { toBadge } = useFormatter()

  // A TableData STATUS-cell badge ({ title, color, isNoData }).
  const activeBadge = (active: boolean, activeLabel: string, inactiveLabel: string) =>
    toBadge(active ? activeLabel : inactiveLabel, activeStatusColor(active))

  return { activeStatusColor, activeBadge }
}
