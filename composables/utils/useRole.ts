import { useI18n } from 'vue-i18n'

// Mirrors the backend's middleware.RequireRoles(...roles) allow-list check
// (internal/middleware/auth.go) so the frontend can hide/disable actions the
// backend would 403 anyway, instead of letting the user hit a dead end.
export const useRole = () => {
  const { t } = useI18n()
  const userStore = useUserStore()

  // Reads `effectiveRole`, not `role` — Admin's optional "use as" override
  // (stores/user.ts's focusRole) lives here so every existing hasRole()
  // call site reacts to it automatically without a separate code path.
  const hasRole = (...roles: Role[]): boolean => roles.includes(userStore.effectiveRole)

  // Shared with RoleFocusSwitcher.vue's dropdown and layouts/default.vue's
  // focus-mode banner, so the `layout.roleFocus.roles.*` key path lives in
  // one place instead of being templated at each call site.
  const roleLabel = (role: Role): string => t(`layout.roleFocus.roles.${role}`)

  return { hasRole, roleLabel }
}
