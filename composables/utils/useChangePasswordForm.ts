import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'

interface ChangePasswordPayload {
  current_password: string
  new_password: string
  confirm_password: string
}

export const useChangePasswordForm = (onSuccess?: () => unknown) => {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const userStore = useUserStore()
  const { post, loading } = useMutateApi<User, ChangePasswordPayload>('/auth/change-password')

  const state = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const submit = async () => {
    try {
      const response = await post({
        current_password: state.currentPassword,
        new_password: state.newPassword,
        confirm_password: state.confirmPassword,
      })
      userStore.setUser(response.data)
      success(t('global.auth.changePasswordSuccess'))
      await onSuccess?.()
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error?.message : undefined
      error(message || t('global.auth.changePasswordFailed'))
    }
  }

  return {
    state,
    loading,
    submit,
  }
}
