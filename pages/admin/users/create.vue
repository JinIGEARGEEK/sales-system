<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('admin.users.create.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('admin.users.create.subheading') }}</p>
    </div>

    <ContainerTemplate>
      <Form @submit="onSubmit">
        <AdminUserForm v-model:form="form" />

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('admin.users.create.createStaff')" type="submit" />
          <ButtonPrimary :label="t('admin.users.form.cancel')" cancel @click="navigateTo('/admin/users')" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({ title: t('admin.users.create.pageTitle') })

const { success } = useNotify()
const usersStore = useUsersStore()

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  tel: '',
  role: '',
  status: 'active',
  notes: '',
  password: '',
})

const onSubmit = async () => {
  await usersStore.add({
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    tel: form.tel,
    role: form.role,
    status: form.status,
    notes: form.notes,
    password: form.password,
  })
  success(t('admin.users.create.createSuccess'))
  navigateTo('/admin/users')
}
</script>
