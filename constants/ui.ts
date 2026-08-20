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
  { bar: 'bg-[var(--color-accent-green)]', iconClass: 'text-[var(--color-accent-green)]', iconBgClass: 'bg-[var(--color-accent-green)]/25' },
  { bar: 'bg-[var(--color-info-toast)]', iconClass: 'text-[var(--color-info-toast)]', iconBgClass: 'bg-[var(--color-info-toast)]/25' },
  { bar: 'bg-[var(--color-warning-hover)]', iconClass: 'text-[var(--color-warning-hover)]', iconBgClass: 'bg-[var(--color-warning-hover)]/25' },
  { bar: 'bg-[var(--color-chart-violet)]', iconClass: 'text-[var(--color-chart-violet)]', iconBgClass: 'bg-[var(--color-chart-violet)]/25' },
]
export const CHART_FALLBACK_COLOR = { bar: 'bg-[var(--color-gray)]/50', iconClass: 'text-[var(--color-gray)]', iconBgClass: 'bg-[var(--color-gray)]/15' }
