<template>
  <div class="p-5">
    <div class="mb-4">
      <UBreadcrumb :items="breadcrumbs" />
      <h2 class="mt-2 text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('admin.users.detail.heading') }}</h2>
    </div>

    <ContainerTemplate v-if="user">
      <Form @submit="onSubmit">
        <AdminUserForm v-model:form="form" />

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('admin.users.detail.saveChanges')" type="submit" />
          <ButtonPrimary :label="t('admin.users.form.cancel')" outline @click="navigateTo('/admin/users')" />
        </div>
      </Form>
    </ContainerTemplate>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('admin.users.detail.staffNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({ title: t('admin.users.detail.pageTitle') })

const route = useRoute()
const { success } = useNotify()
const usersStore = useUsersStore()

const userId = Number(route.params.id)
const user = computed(() => usersStore.items.find(u => u.id === userId))

const breadcrumbs = [
  { label: t('admin.users.detail.breadcrumbStaff'), to: '/admin/users' },
  { label: user.value ? `${user.value.first_name} ${user.value.last_name}` : t('admin.users.detail.breadcrumbEdit') },
]

const form = reactive({
  first_name: user.value?.first_name || '',
  last_name: user.value?.last_name || '',
  email: user.value?.email || '',
  tel: user.value?.tel || '',
  role: user.value?.role || '',
  status: user.value?.is_active ? 'active' : 'inactive',
  notes: '',
  birthDate: '',
})

const onSubmit = () => {
  if (user.value) {
    user.value.first_name = form.first_name
    user.value.last_name = form.last_name
    user.value.email = form.email
    user.value.tel = form.tel
    user.value.role = form.role as AdminUser['role']
    user.value.is_active = form.status === 'active'
    user.value.updated_at = new Date()
  }
  success(t('admin.users.detail.updateSuccess'))
  navigateTo('/admin/users')
}
</script>
