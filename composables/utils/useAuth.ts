/**
 * Authentication utilities composable
 */
export const useAuth = () => {
  const getAccessToken = (): string => {
    // Get token from cookie or localStorage
    if (process.client) {
      return localStorage.getItem('access_token') || ''
    }
    return ''
  }

  const setAccessToken = (token: string): void => {
    if (process.client) {
      localStorage.setItem('access_token', token)
    }
  }

  const removeAccessToken = (): void => {
    if (process.client) {
      localStorage.removeItem('access_token')
    }
  }

  const isAuthenticated = (): boolean => {
    return !!getAccessToken()
  }

  return {
    getAccessToken,
    setAccessToken,
    removeAccessToken,
    isAuthenticated,
  }
}
