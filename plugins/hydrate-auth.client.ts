/**
 * On app init, rehydrates the user store from the backend when a valid access
 * token already exists in localStorage (e.g. after a page refresh) — without
 * this, the JWT survives but the store (name/role shown in the UI) is empty
 * until the next login.
 */
import { MOCK_DEV_TOKEN, MOCK_DEV_USER } from '~/constants/mockData'

export default defineNuxtPlugin(async () => {
  const { isAuthenticated, getAccessToken, removeAccessToken } = useAuth()

  if (!isAuthenticated()) {
    return
  }

  const userStore = useUserStore()

  // Dev-only mock session — rehydrate locally instead of calling the backend.
  if (import.meta.dev && getAccessToken() === MOCK_DEV_TOKEN) {
    userStore.setUser(MOCK_DEV_USER)
    return
  }

  const { $api } = useNuxtApp()

  try {
    const response = await $api.get<ApiResponse<User>>('/auth/me')
    userStore.setUser(response.data.data)
  } catch {
    // Expired/invalid token — clear it and let the auth middleware redirect
    // to /login on the next navigation.
    removeAccessToken()
  }
})
