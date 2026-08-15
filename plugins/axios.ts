import axios from 'axios'

let loading = 0

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const loadingStore = useLoadingStore()

  const loadingFinished = async () => {
    await sleep(100)
    loading -= 1
    if (loading === 0) {
      loadingStore.enable()
    }
  }

  const apiBase = (nuxtApp.$config.public.API_URL || '').replace(/\/$/, '')
  const api = axios.create({
    baseURL: `${apiBase}/api/v1`,
    headers: {
      common: {},
    },
  })

  const { getAccessToken } = useAuth()
  api.interceptors.request.use((config) => {
    loadingStore.disable()
    loading += 1
    const accessToken = getAccessToken()

    config.headers.Authorization = `Bearer ${accessToken}`
    return config
  })

  api.interceptors.response.use((response) => {
    loadingFinished()
    return response
  }, (error) => {
    loadingFinished()
    // Auth endpoints report 401 for bad credentials / expired sessions, not for
    // "you got logged out mid-app" — let callers (e.g. the login form) handle
    // those directly instead of force-redirecting away from the request itself.
    const isAuthRequest = (error.config?.url || '').includes('/auth/login')
    if (error.response?.status === 401 && !isAuthRequest) {
      router.push('/login')
    } else if (error.response?.status === 403) {
      router.push('/')
    } else if (error.response?.status === 404) {
      router.push('/error404')
    }
    // Always reject (even after triggering a redirect above) so callers' own
    // try/catch runs against the real error instead of an incidental crash
    // from treating a router-navigation result as the axios response.
    return Promise.reject(error)
  })

  return {
    provide: {
      api,
    },
  }
})
