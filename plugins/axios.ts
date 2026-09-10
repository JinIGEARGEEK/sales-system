import axios from 'axios'

let loading = 0

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const loadingStore = useLoadingStore()
  // useNotify() (built on Nuxt's context-based useState()) is safe to call
  // here in the plugin body. vue-i18n's useI18n() is NOT — it requires
  // getCurrentInstance() (a component's setup()), which a Nuxt plugin never
  // has; calling it here throws synchronously ("Must be called at the top of
  // a `setup` function") and aborts this entire plugin before `$api` is ever
  // provided, breaking every API call in the app. `nuxtApp.$i18n` (injected
  // by @nuxtjs/i18n) exposes the same translator without that restriction.
  const { warning } = useNotify()
  const t = (nuxtApp.$i18n as { t: (key: string) => string }).t

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

  const { getAccessToken, removeAccessToken } = useAuth()
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
      // Otherwise the user is silently bounced to a blank login form with no
      // explanation for why their in-progress work just vanished, and has no
      // way back to where they were once they sign back in.
      // The stale token MUST be cleared before navigating: middleware/auth.global.ts
      // treats any present token as "authenticated" and immediately bounces an
      // authenticated visit to '/login' back to '/' — without this, the redirect
      // below would be undone instantly (and ?redirect= lost) by that guard.
      removeAccessToken()
      warning(t('global.sessionExpired'))
      const redirect = router.currentRoute.value.fullPath
      router.push({ path: '/login', query: redirect !== '/' ? { redirect } : undefined })
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
