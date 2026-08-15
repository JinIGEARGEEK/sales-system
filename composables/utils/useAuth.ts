/**
 * Authentication utilities composable
 */
export const useAuth = () => {
  const getAccessToken = (): string => {
    // Get token from cookie or localStorage
    if (import.meta.client) {
      return localStorage.getItem('access_token') || ''
    }
    return ''
  }

  const setAccessToken = (token: string): void => {
    if (import.meta.client) {
      localStorage.setItem('access_token', token)
    }
  }

  const removeAccessToken = (): void => {
    if (import.meta.client) {
      localStorage.removeItem('access_token')
    }
  }

  const isAuthenticated = (): boolean => {
    return !!getAccessToken()
  }

  const logout = async (): Promise<void> => {
    try {
      const { $api } = useNuxtApp()
      await $api.post('/auth/logout')
    } catch {
      // Best-effort: clear local session regardless of backend result.
    } finally {
      removeAccessToken()
      useUserStore().$reset()
      await navigateTo('/login')
    }
  }

  return {
    getAccessToken,
    setAccessToken,
    removeAccessToken,
    isAuthenticated,
    logout,
  }
}
