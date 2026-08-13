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

  const api = axios.create({
    baseURL: nuxtApp.$config.public.API_URL || '',
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
    if (error.response.status === 401) {
      return router.push('/login')
    } else if (error.response.status === 403) {
      return router.push('/')
    } else if (error.response.status === 404) {
      return router.push('/error404')
    }
    return Promise.reject(error)
  })

  return {
    provide: {
      api,
    },
  }
})
