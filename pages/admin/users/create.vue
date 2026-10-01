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
            <ButtonPrimary :label="t('admin.users.create.createStaff')" type="submit" :loading="loading" data-cy="user-create-submit" />
            <ButtonPrimary :label="t('admin.users.form.cancel')" cancel data-cy="user-create-cancel" @click="goBack()" />
          </div>
        </Form>
      </ContainerTemplate>
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import type { SubmissionContext } from 'vee-validate'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({ title: t('admin.users.create.pageTitle') })

// Admin-only page — same page-level guard as pages/admin/users/index.vue.
const { canAccess } = usePageAccess('Admin')

const { success } = useNotify()
const showFormErrors = useApiFormErrors()
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

// A 422 (e.g. a taken email) lands on its input; anything else is a toast.
const onSubmit = guard(async (values: Record<string, unknown>, { setErrors }: SubmissionContext) => {
  try {
    await usersStore.add({ ...form })
  } catch (err) {
    showFormErrors(err, setErrors, values)
    return
  }
  success(t('admin.users.create.createSuccess'))
  markClean()
  navigateTo('/admin/users')
})
</script>
