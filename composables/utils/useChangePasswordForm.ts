import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'

interface ChangePasswordPayload {
  current_password: string
  new_password: string
  confirm_password: string
}

// A password change revokes every earlier token, the one sending this
// request included, so the response carries a fresh one alongside the user.
// Optional so this still works against an API that predates it.
type ChangePasswordResponse = User & { access_token?: string }

export const useChangePasswordForm = (onSuccess?: () => unknown) => {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const userStore = useUserStore()
  const { setAccessToken } = useAuth()
  const { post } = useMutateApi<ChangePasswordResponse, ChangePasswordPayload>('/auth/change-password')
  const { loading, guard } = useSubmitGuard()

  const state = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Guarded so the shared <Form @submit> (fires on Enter-key) and the
  // footer button's click can never both trigger an in-flight submit.
  const submit = guard(async () => {
    try {
      const response = await post({
        current_password: state.currentPassword,
        new_password: state.newPassword,
        confirm_password: state.confirmPassword,
      })
      const { access_token: accessToken, ...user } = response.data
      if (accessToken) setAccessToken(accessToken)
      userStore.setUser(user)
      success(t('global.auth.changePasswordSuccess'))
      await onSuccess?.()
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error?.message : undefined
      error(message || t('global.auth.changePasswordFailed'))
    }
  })

  return {
    state,
    loading,
    submit,
  }
}
