<template>
  <AuthCard
    icon="material-symbols:lock-reset"
    :title="t('global.auth.changePasswordTitle')"
    :subtitle="t('global.auth.changePasswordSubtitle')"
  >
    <Form class="relative z-10 flex flex-col gap-3" @submit="onSubmit">
      <InputPassword
        v-model="state.currentPassword"
        :label="t('global.auth.currentPasswordLabel')"
        :placeholder="t('global.auth.currentPasswordPlaceholder')"
        name="currentPassword"
        rules="required"
      />
      <InputPassword
        v-model="state.newPassword"
        :label="t('global.auth.newPasswordLabel')"
        :placeholder="t('global.auth.newPasswordPlaceholder')"
        name="newPassword"
        rules="required|min:8"
      />
      <InputPassword
        v-model="state.confirmPassword"
        :label="t('global.auth.confirmPasswordLabel')"
        :placeholder="t('global.auth.confirmPasswordPlaceholder')"
        name="confirmPassword"
        rules="required|confirmed:@newPassword"
      />

      <button
        type="submit"
        :disabled="loading"
        class="mt-2 w-full rounded-lg bg-[#1d2c66] py-2.5 text-sm font-medium text-white transition hover:bg-[#28398a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ loading ? t('global.loading') : t('global.auth.updatePassword') }}
      </button>

      <button
        type="button"
        class="text-xs text-white/70 hover:text-white"
        @click="logout"
      >
        {{ t('layout.logout') }}
      </button>
    </Form>
  </AuthCard>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'

definePageMeta({
  layout: 'blank',
})

useHead({
  title: 'เปลี่ยนรหัสผ่าน',
})

const { t } = useI18n()
const { logout } = useAuth()
const { success, error } = useNotify()
const userStore = useUserStore()
const { post } = useMutateApi<User, { current_password: string, new_password: string, confirm_password: string }>('/auth/change-password')

const state = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const loading = ref(false)
const onSubmit = async () => {
  loading.value = true

  try {
    const response = await post({
      current_password: state.currentPassword,
      new_password: state.newPassword,
      confirm_password: state.confirmPassword,
    })
    userStore.setUser(response.data)
    success(t('global.auth.changePasswordSuccess'))
    await navigateTo('/')
  } catch (err) {
    const message = isAxiosError(err) ? err.response?.data?.error?.message : undefined
    error(message || t('global.auth.changePasswordFailed'))
  } finally {
    loading.value = false
  }
}
</script>
