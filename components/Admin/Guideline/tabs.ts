// Shared source of truth for the Guideline page's role tabs — RoleTabs.vue
// (tab list) and RoleFocusBanner.vue (per-tab icon) each used to hardcode
// their own copy of this same tab list, which could silently drift (e.g. a
// tab added to one but not the other — this is exactly how the "marketing"
// tab ended up needing changes in both places by hand). Kept as a plain
// module (like ./types.ts) so it isn't picked up by Nuxt's component
// auto-import.
//
// The page's own topicKeysByTab (pages/admin/guideline.vue) stays separate
// and isn't merged into this list — which Guideline topics show on which
// tab is page-specific content routing, not tab metadata every consumer of
// the tab list itself needs.
export const GUIDELINE_TABS = [
  { value: 'salesRep', icon: 'material-symbols:person-outline' },
  { value: 'salesManager', icon: 'material-symbols:supervisor-account-outline' },
  { value: 'admin', icon: 'material-symbols:shield-person-outline' },
  { value: 'marketing', icon: 'material-symbols:campaign-outline' },
  { value: 'production', icon: 'material-symbols:precision-manufacturing-outline' },
] as const
