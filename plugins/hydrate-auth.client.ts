/**
 * On app init, rehydrates the user store from the backend when a valid access
 * token already exists in localStorage (e.g. after a page refresh) — without
 * this, the JWT survives but the store (name/role shown in the UI) is empty
 * until the next login.
 */
export default defineNuxtPlugin(async () => {
  const { isAuthenticated, removeAccessToken } = useAuth()

  if (!isAuthenticated()) {
    return
  }

  const { $api } = useNuxtApp()
  const userStore = useUserStore()

  try {
    const response = await $api.get<ApiResponse<User>>('/auth/me')
    userStore.setUser(response.data.data)
  } catch {
    // Expired/invalid token — clear it and let the auth middleware redirect
    // to /login on the next navigation.
    removeAccessToken()
  }
})
