<template>
  <AuthCard
    icon="material-symbols:lock-reset"
    :title="t('global.auth.changePasswordTitle')"
    :subtitle="t('global.auth.changePasswordSubtitle')"
  >
    <Form class="relative z-10 flex flex-col gap-3" @submit="submit">
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

definePageMeta({
  layout: 'blank',
})

const { t } = useI18n()

useHead({ title: t('global.auth.changePasswordTitle') })

const { logout } = useAuth()
const { state, loading, submit } = useChangePasswordForm(() => navigateTo('/'))
</script>
