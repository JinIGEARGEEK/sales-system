// Shared by CrmStatCard/CrmMetricBar's `to` prop — both render a NuxtLink
// wrapper when a deep-link target is set, and a plain `div` (fully inert,
// no click/keyboard/href affordance) when it isn't. Kept as one composable
// rather than duplicating the `:is`/`:to` pair in each component, since a
// third dashboard-card-shaped component is likely to want the same prop.
export function useOptionalLink (to: Ref<string | undefined>) {
  return {
    linkTag: computed(() => (to.value ? 'NuxtLink' : 'div')),
    linkTo: computed(() => to.value || undefined),
  }
}
