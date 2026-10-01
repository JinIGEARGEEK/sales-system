import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'
import type { SubmissionContext } from 'vee-validate'

interface ChangePasswordPayload {
  current_password: string
  new_password: string
  confirm_password: string
}

// A password change revokes every earlier token, the one sending this
// request included, so the response carries a fresh one alongside the user.
// Optional so this still works against an API that predates it.
type ChangePasswordResponse = User & { access_token?: string }

// POST /auth/change-password's 422 field names → this form's Field names.
const PASSWORD_FIELD_MAP = {
  current_password: 'currentPassword',
  new_password: 'newPassword',
  confirm_password: 'confirmPassword',
}

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

  const showFieldErrors = useApiFieldErrors()

  // Guarded so the shared <Form @submit> (fires on Enter-key) and the
  // footer button's click can never both trigger an in-flight submit. Bind
  // it as the Form's @submit so a 422 can mark the matching inputs.
  const submit = guard(async (values?: Record<string, unknown>, context?: SubmissionContext) => {
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
      // The toast stays even when the inputs are marked: this endpoint's 422
      // codes are prose ("must be different from current password"), so an
      // input only gets the generic "not valid" text and the reason lives in
      // the API's message.
      if (values && context) showFieldErrors(err, context.setErrors, values, PASSWORD_FIELD_MAP)
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
