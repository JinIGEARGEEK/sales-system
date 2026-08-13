const PUBLIC_URL = [
  '/login',
]

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  const authenticated = isAuthenticated()
  const isPublicPage = PUBLIC_URL.includes(to.path)

  if (!authenticated && !isPublicPage) {
    return navigateTo('/login')
  }

  if (authenticated && isPublicPage) {
    return navigateTo('/')
  }
})
