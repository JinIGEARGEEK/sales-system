<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('global.auth.changePasswordTitle') }}</h2>
    </div>

    <UCard class="max-w-md" :ui="GLASS_PANEL_UI">
      <Form class="flex flex-col gap-3" @submit="submit">
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

        <ButtonPrimary
          type="submit"
          class="mt-2"
          :loading="loading"
          :label="t('global.auth.updatePassword')"
        />
      </Form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('global.auth.changePasswordTitle') })

const { state, loading, submit } = useChangePasswordForm(() => {
  state.currentPassword = ''
  state.newPassword = ''
  state.confirmPassword = ''
})
</script>
