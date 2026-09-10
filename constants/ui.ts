// Shared glass-panel look for filter bars across list pages (Leads/Deals/Companies/
// Contacts/Tags/Users/Activity Log/Dashboard) — centralized so the 8 call sites can't
// drift out of sync the way the ad-hoc per-page classes did before.
// Border tint matches the sidebar nav item's active/focus blue glow
// (layouts/default.vue's `.sidebar-nav-link.is-active`/`:focus-visible` ring,
// rgba(96,165,250,...)) so glass panels read as part of the same visual system.
export const GLASS_PANEL_UI = { root: 'bg-white/65 backdrop-blur-2xl border border-[rgba(96,165,250,0.45)] ring-0 shadow-xl' }

// Fixed categorical color order for chart bars / stat-card icon chips that
// need to distinguish several same-shaped items (pipeline stages, lead
// sources, industries) — validated together (light mode, all 6 checks pass)
// via the dataviz skill's validate_palette.js. Never cycle past this list; a
// 5th+ item should fall back to CHART_FALLBACK_COLOR rather than reusing a hue.
export const CHART_CATEGORICAL_COLORS = [
  { bar: 'bg-(--color-accent-green)', iconClass: 'text-(--color-accent-green)', iconBgClass: 'bg-(--color-accent-green)/25' },
  { bar: 'bg-(--color-info-toast)', iconClass: 'text-(--color-info-toast)', iconBgClass: 'bg-(--color-info-toast)/25' },
  { bar: 'bg-(--color-warning-hover)', iconClass: 'text-(--color-warning-hover)', iconBgClass: 'bg-(--color-warning-hover)/25' },
  { bar: 'bg-(--color-chart-violet)', iconClass: 'text-(--color-chart-violet)', iconBgClass: 'bg-(--color-chart-violet)/25' },
]
export const CHART_FALLBACK_COLOR = { bar: 'bg-(--color-gray)/50', iconClass: 'text-(--color-gray)', iconBgClass: 'bg-(--color-gray)/15' }
