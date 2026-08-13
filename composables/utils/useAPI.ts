import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// CREATE / UPDATE / DELETE transactions
export const useMutateApi = <T, D>(path: string) => {
  const { $api } = useNuxtApp()
  const loading = ref(false)
  const data = ref()
  const mutateMiddleware = <E>(
    execute: (path: string, payload?: E) => Promise<AxiosResponse<ApiResponse<T>>>,
  ) => async (payload?: E) => {
      loading.value = true
      try {
        const response = await execute(path, payload)
        data.value = response.data.data
        return response.data
      } finally {
        loading.value = false
      }
    }
  return {
    get: mutateMiddleware<AxiosRequestConfig<D>>($api.get),
    put: mutateMiddleware<D>($api.put),
    post: mutateMiddleware<D>($api.post),
    delete: mutateMiddleware<AxiosRequestConfig<D>>($api.delete),
    data,
    loading,
  }
}

// READ transactions
export const useFetchApi = <T, D>(url: string, config?: AxiosRequestConfig<D>) => {
  const { $api } = useNuxtApp()
  const data = ref<D>()
  const fetch = async (newParams?: T) => {
    const response = await $api.get(url, {
      params: newParams || config?.params,
    })
    data.value = response.data
  }
  onBeforeMount(() => {
    fetch()
  })
  return {
    fetch,
  }
}
