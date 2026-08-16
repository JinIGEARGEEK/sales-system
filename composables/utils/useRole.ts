// Mirrors the backend's middleware.RequireRoles(...roles) allow-list check
// (internal/middleware/auth.go) so the frontend can hide/disable actions the
// backend would 403 anyway, instead of letting the user hit a dead end.
export const useRole = () => {
  const userStore = useUserStore()

  const hasRole = (...roles: Role[]): boolean => roles.includes(userStore.role)

  return { hasRole }
}
