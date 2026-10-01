import { describe, it, expect, vi, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

// Drives the real `$api` instance (plugins/axios.ts) with an adapter that
// answers every request with `status`, so the response interceptor itself
// is what's under test — not a re-implementation of it.
const answerWith = (status: number): AxiosAdapter => (config: InternalAxiosRequestConfig) =>
  Promise.reject(new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status, statusText: '', headers: {}, config, data: { error: { code: 'X', message: 'nope' } },
  }))

describe('plugins/axios error redirects', () => {
  const { $api } = useNuxtApp()
  const originalAdapter = $api.defaults.adapter

  afterEach(() => {
    $api.defaults.adapter = originalAdapter
    clearError()
    vi.restoreAllMocks()
  })

  it('shows the 404 error page for a GET page load, and still rejects', async () => {
    $api.defaults.adapter = answerWith(404)
    await expect($api.get('/companies/999')).rejects.toBeInstanceOf(AxiosError)
    expect(useError().value?.statusCode).toBe(404)
  })

  it('never leaves the page on a failed mutation, so the form keeps its input', async () => {
    const push = vi.spyOn(useRouter(), 'push')
    for (const status of [403, 404]) {
      $api.defaults.adapter = answerWith(status)
      await expect($api.post('/companies', {})).rejects.toBeInstanceOf(AxiosError)
      await expect($api.put('/companies/1', {})).rejects.toBeInstanceOf(AxiosError)
      await expect($api.delete('/companies/1')).rejects.toBeInstanceOf(AxiosError)
    }
    expect(push).not.toHaveBeenCalled()
    expect(useError().value).toBeFalsy()
  })

  it('sends a GET 403 home, unless the request opts out', async () => {
    const push = vi.spyOn(useRouter(), 'push').mockResolvedValue(undefined)
    $api.defaults.adapter = answerWith(403)
    await expect($api.get('/admin/settings')).rejects.toBeInstanceOf(AxiosError)
    expect(push).toHaveBeenCalledWith('/')

    push.mockClear()
    await expect($api.get('/admin/settings', { skipErrorRedirect: true })).rejects.toBeInstanceOf(AxiosError)
    $api.defaults.adapter = answerWith(404)
    await expect($api.get('/companies/999', { skipErrorRedirect: true })).rejects.toBeInstanceOf(AxiosError)
    expect(push).not.toHaveBeenCalled()
    expect(useError().value).toBeFalsy()
  })
})
