<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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
    />
    <InputSelect
      v-model="form.status"
      :options="statusOptions"
      :label="t('admin.users.form.status')"
      :placeholder="t('admin.users.form.statusPlaceholder')"
      name="status"
      rules="required"
    />
    <div class="md:col-span-2">
      <InputTextarea
        v-model="form.notes"
        :label="t('admin.users.form.notes')"
        :placeholder="t('admin.users.form.notesPlaceholder')"
        name="notes"
      />
    </div>
    <InputDatePicker
      v-model="form.birthDate"
      :label="t('admin.users.form.birthDate')"
      :placeholder="t('admin.users.form.birthDatePlaceholder')"
      name="birthDate"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  form: {
    first_name: string
    last_name: string
    email: string
    tel: string
    role: string
    status: string
    notes: string
    birthDate: string
  }
}>()

const roleOptions = [
  { label: t('admin.users.form.roleAdmin'), value: 'Admin' },
  { label: t('admin.users.form.roleEditor'), value: 'Editor' },
  { label: t('admin.users.form.roleViewer'), value: 'Viewer' },
]

const statusOptions = [
  { label: t('admin.users.form.statusActive'), value: 'active' },
  { label: t('admin.users.form.statusInactive'), value: 'inactive' },
]
</script>
