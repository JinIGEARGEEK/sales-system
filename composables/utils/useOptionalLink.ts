import { NuxtLink } from '#components'

// Shared by CrmStatCard/CrmMetricBar's `to` prop — both render a NuxtLink
// wrapper when a deep-link target is set, and a plain `div` (fully inert,
// no click/keyboard/href affordance) when it isn't. Kept as one composable
// rather than duplicating the `:is`/`:to` pair in each component, since a
// third dashboard-card-shaped component is likely to want the same prop.
//
// linkTag resolves to the real NuxtLink component object (imported from
// '#components'), not the bare string 'NuxtLink' — `<component :is="'NuxtLink'">`
// requires Vue to resolve that name via the app's global component registry
// at render time, which silently fails in this app (renders a literal,
// non-functional `<nuxtlink>` custom element instead of a real `<a>` — no
// error, no warning, just a dead-looking-clickable card). Passing the actual
// component reference sidesteps name resolution entirely. Fixed 2026-09-09
// after this affected every to-driven CrmStatCard/CrmMetricBar on the
// Dashboard (Prospects by Status/Source, Total/Open Prospects, etc.) — all
// silently inert since whenever this pattern was introduced.
export function useOptionalLink (to: Ref<string | undefined>) {
  return {
    linkTag: computed(() => (to.value ? NuxtLink : 'div')),
    linkTo: computed(() => to.value || undefined),
  }
}
