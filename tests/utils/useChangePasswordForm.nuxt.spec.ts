import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// Spy on the real $api (see useLogActivity's spec for why not mockNuxtImport).
const mockPost = () => vi.spyOn(useNuxtApp().$api, 'post')

const userRow = { id: 5, first_name: 'Jordan', last_name: 'Lee', email: 'jordan@igeargeek.com', role: 'Sales Rep', must_change_password: false }

const fill = (state: { currentPassword: string, newPassword: string, confirmPassword: string }) => {
  state.currentPassword = 'OldPassword1!'
  state.newPassword = 'NewPassword1!'
  state.confirmPassword = 'NewPassword1!'
}

describe('useChangePasswordForm', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'old-token')
    useUserStore().$reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem('access_token')
  })

  it('stores the fresh token, since the change revokes the old one', async () => {
    mockPost().mockResolvedValue({ data: { data: { ...userRow, access_token: 'new-token' } } })
    const onSuccess = vi.fn()
    const { state, submit } = useChangePasswordForm(onSuccess)
    fill(state)

    await submit()

    expect(localStorage.getItem('access_token')).toBe('new-token')
    expect(useUserStore().id).toBe(5)
    expect(useUserStore().$state).not.toHaveProperty('access_token')
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('keeps the current token when the API returns none', async () => {
    mockPost().mockResolvedValue({ data: { data: userRow } })
    const { state, submit } = useChangePasswordForm()
    fill(state)

    await submit()

    expect(localStorage.getItem('access_token')).toBe('old-token')
  })

  it('leaves the token alone when the change fails', async () => {
    mockPost().mockRejectedValue(new Error('network'))
    const onSuccess = vi.fn()
    const { state, submit } = useChangePasswordForm(onSuccess)
    fill(state)

    await submit()

    expect(localStorage.getItem('access_token')).toBe('old-token')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
