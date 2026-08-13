<template>
  <div class="p-5">
    <div class="mb-4">
      <UBreadcrumb :items="breadcrumbs" />
      <h2 class="mt-2 text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('admin.users.detail.heading') }}</h2>
    </div>

    <ContainerTemplate v-if="user">
      <Form @submit="onSubmit">
        <AdminUserForm :form="form" />

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('admin.users.detail.saveChanges')" type="submit" />
          <ButtonPrimary :label="t('admin.users.form.cancel')" outline @click="navigateTo('/admin/users')" />
        </div>
      </Form>
    </ContainerTemplate>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('admin.users.detail.customerNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MOCK_USERS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('admin.users.detail.pageTitle') })

const route = useRoute()
const { success } = useNotify()

const userId = Number(route.params.id)
const user = MOCK_USERS.find(u => u.id === userId)

const breadcrumbs = [
  { label: t('admin.users.detail.breadcrumbCustomers'), to: '/admin/users' },
  { label: user ? `${user.first_name} ${user.last_name}` : t('admin.users.detail.breadcrumbEdit') },
]

const form = reactive({
  first_name: user?.first_name || '',
  last_name: user?.last_name || '',
  email: user?.email || '',
  tel: user?.tel || '',
  role: user?.role || '',
  status: user?.is_active ? 'active' : 'inactive',
  notes: '',
  birthDate: '',
})

const onSubmit = () => {
  success(t('admin.users.detail.updateSuccess'))
  navigateTo('/admin/users')
}
</script>
