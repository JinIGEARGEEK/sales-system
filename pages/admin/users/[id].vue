<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <PageHeader :title="user ? `${user.first_name} ${user.last_name}` : t('admin.users.detail.heading')" @back="goBack()" />

      <ContainerTemplate v-if="user">
        <Form @submit="onSubmit">
          <AdminUserForm v-model:form="form" />

          <div class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('admin.users.detail.saveChanges')" type="submit" :loading="loading" />
            <ButtonPrimary :label="t('admin.users.form.cancel')" cancel @click="goBack()" />
          </div>
        </Form>
      </ContainerTemplate>

      <NotFoundState v-else :message="t('admin.users.detail.staffNotFound')" back-to="/admin/users" />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({ title: t('admin.users.detail.pageTitle') })

// Admin-only page — same page-level guard as pages/admin/users/index.vue.
const { canAccess, guardMounted } = usePageAccess('Admin')

const route = useRoute()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const usersStore = useUsersStore()
const goBack = useBackNavigation('/admin/users')

guardMounted(() => {
  if (usersStore.items.length === 0) usersStore.fetchAll().catch(notifyApiError)
})

const userId = Number(route.params.id)
const user = computed(() => usersStore.items.find(u => u.id === userId))

const form = reactive({
  first_name: user.value?.first_name || '',
  last_name: user.value?.last_name || '',
  email: user.value?.email || '',
  tel: user.value?.tel || '',
  role: user.value?.role || '',
  status: user.value?.is_active ? 'active' : 'inactive',
  notes: user.value?.notes || '',
  password: '',
})

// Declared before the populate-watch below so its callback can re-baseline
// the snapshot — otherwise the still-empty initial form would make the page
// read as dirty the moment the record loads in.
const { markClean } = useUnsavedChangesGuard(() => form)

// User loads asynchronously now (fetched on mount), so the form is (re)populated
// once the record arrives instead of only at setup time.
watch(user, (value) => {
  if (!value) return
  form.first_name = value.first_name
  form.last_name = value.last_name
  form.email = value.email
  form.tel = value.tel
  form.role = value.role
  form.status = value.is_active ? 'active' : 'inactive'
  form.notes = value.notes
  markClean()
}, { immediate: true })

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async () => {
  if (user.value) {
    await usersStore.update(user.value.id, {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      tel: form.tel,
      role: form.role,
      status: form.status,
      notes: form.notes,
      password: form.password,
    })
  }
  success(t('admin.users.detail.updateSuccess'))
  markClean()
  navigateTo('/admin/users')
})
</script>
