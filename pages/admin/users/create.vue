<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <PageHeader
        :title="t('admin.users.create.heading')"
        :subtitle="t('admin.users.create.subheading')"
        @back="goBack()"
      />

      <ContainerTemplate>
        <Form @submit="onSubmit">
          <AdminUserForm v-model:form="form" />

          <div class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('admin.users.create.createStaff')" type="submit" :loading="loading" />
            <ButtonPrimary :label="t('admin.users.form.cancel')" cancel @click="goBack()" />
          </div>
        </Form>
      </ContainerTemplate>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({ title: t('admin.users.create.pageTitle') })

// Admin-only page — same page-level guard as pages/admin/users/index.vue.
const { canAccess } = usePageAccess('Admin')

const { success } = useNotify()
const usersStore = useUsersStore()
const goBack = useBackNavigation('/admin/users')

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

const { markClean } = useUnsavedChangesGuard(() => form)

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async () => {
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
  markClean()
  navigateTo('/admin/users')
})
</script>
