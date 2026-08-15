const PUBLIC_URL = [
  '/login',
]

const CHANGE_PASSWORD_URL = '/change-password'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  const userStore = useUserStore()

  const authenticated = isAuthenticated()
  const isPublicPage = PUBLIC_URL.includes(to.path)

  if (!authenticated && !isPublicPage) {
    return navigateTo('/login')
  }

  if (authenticated && isPublicPage) {
    return navigateTo('/')
  }

  // Server-side already blocks every other endpoint until the password is
  // changed (RequirePasswordChanged) — this mirrors that so the user lands on
  // the change-password screen instead of a broken page full of 403s.
  if (authenticated && userStore.must_change_password && to.path !== CHANGE_PASSWORD_URL) {
    return navigateTo(CHANGE_PASSWORD_URL)
  }

  if (authenticated && !userStore.must_change_password && to.path === CHANGE_PASSWORD_URL) {
    return navigateTo('/')
  }
})
