<template>
  <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
    <InputText
      v-model="form.first_name"
      :label="t('admin.users.form.firstName')"
      :placeholder="t('admin.users.form.firstNamePlaceholder')"
      name="first_name"
      rules="required"
    />
    <InputText
      v-model="form.last_name"
      :label="t('admin.users.form.lastName')"
      :placeholder="t('admin.users.form.lastNamePlaceholder')"
      name="last_name"
      rules="required"
    />
    <InputText
      v-model="form.email"
      :label="t('admin.users.form.email')"
      :placeholder="t('admin.users.form.emailPlaceholder')"
      name="email"
      rules="required"
    />
    <InputText
      v-model="form.tel"
      :label="t('admin.users.form.phone')"
      :placeholder="t('admin.users.form.phonePlaceholder')"
      name="tel"
    />
    <InputSelect
      v-model="form.role"
      :options="roleOptions"
      :label="t('admin.users.form.role')"
      :placeholder="t('admin.users.form.rolePlaceholder')"
      name="role"
      rules="required"
      :disable="isSelf"
    />
    <InputSelect
      v-model="form.status"
      :options="statusOptions"
      :label="t('admin.users.form.status')"
      :placeholder="t('admin.users.form.statusPlaceholder')"
      name="status"
      rules="required"
      :disable="isSelf"
    />
    <p v-if="isSelf" class="text-xs text-(--color-gray) md:col-span-2" data-cy="user-form-self-hint">
      {{ t('admin.users.errors.selfRowHint') }}
    </p>
    <div class="md:col-span-2">
      <InputTextarea
        v-model="form.notes"
        :label="t('admin.users.form.notes')"
        :placeholder="t('admin.users.form.notesPlaceholder')"
        name="notes"
      />
    </div>
    <!-- An Admin resetting their own password here revokes their own session
    (token_version bump), so their own row points at the self-service page. -->
    <div v-if="isSelf" data-cy="user-form-own-password">
      <p class="mb-1 text-sm font-medium">{{ t('admin.users.ownPassword.label') }}</p>
      <p class="text-xs text-(--color-gray)">{{ t('admin.users.ownPassword.body') }}</p>
      <NuxtLink to="/account/change-password" class="text-sm font-medium text-(--color-primary) hover:underline">
        {{ t('admin.users.ownPassword.link') }}
      </NuxtLink>
    </div>
    <InputPassword
      v-else
      v-model="form.password"
      :label="t('admin.users.form.password')"
      :placeholder="t('admin.users.form.passwordPlaceholder')"
      name="password"
    />
    <div v-if="$slots.default" class="md:col-span-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const form = defineModel<{
  first_name: string
  last_name: string
  email: string
  tel: string
  role: string
  status: string
  notes: string
  password: string
}>('form', { required: true })

withDefaults(defineProps<{
  // The signed-in Admin's own record: the API refuses a change to their own
  // role/status (422), so those inputs are locked.
  isSelf?: boolean
}>(), { isSelf: false })

const roleOptions = [
  { label: t('admin.users.form.roleAdmin'), value: 'Admin' },
  { label: t('admin.users.form.roleSalesRep'), value: 'Sales Rep' },
  { label: t('admin.users.form.roleSalesManager'), value: 'Sales Manager' },
  { label: t('admin.users.form.roleMarketing'), value: 'Marketing' },
  { label: t('admin.users.form.roleProduction'), value: 'Production' },
]

const statusOptions = [
  { label: t('admin.users.form.statusActive'), value: 'active' },
  { label: t('admin.users.form.statusInactive'), value: 'inactive' },
]
</script>
