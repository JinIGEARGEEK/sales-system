<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <PageHeader :title="user ? `${user.first_name} ${user.last_name}` : t('admin.users.detail.heading')" @back="goBack()" />

      <ContainerTemplate v-if="user">
        <Form @submit="onSubmit">
          <AdminUserForm v-model:form="form" :is-self="isSelf">
            <AdminReassignRecordsSelect
              v-if="losesRecords"
              v-model="reassignTo"
              :exclude-ids="[user.id]"
            />
          </AdminUserForm>

          <div class="mt-4 flex gap-3">
            <ButtonPrimary :label="t('admin.users.detail.saveChanges')" type="submit" :loading="loading" />
            <ButtonPrimary :label="t('admin.users.form.cancel')" cancel @click="goBack()" />
          </div>
        </Form>
      </ContainerTemplate>

      <DetailSkeleton v-else-if="recordPending" :header="false" />
      <NotFoundState v-else :message="t('admin.users.detail.staffNotFound')" back-to="/admin/users" />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { KEEP_RECORDS, updateLosesRecords } from '~/composables/utils/useUserRecordsReassign'

const { t } = useI18n()

useHead({ title: t('admin.users.detail.pageTitle') })

// Admin-only page — same page-level guard as pages/admin/users/index.vue.
const { canAccess, guardMounted } = usePageAccess('Admin')

const route = useRoute()
const { success, error } = useNotify()
const { notifyLoadError } = useApiErrorNotifier()
const { pending: recordPending, track: trackRecord } = useRecordPending()
const usersStore = useUsersStore()
const userStore = useUserStore()
const { toReassignTo, notifyRecordsResult, userGuardMessage, applyUserFieldErrors } = useUserRecordsReassign()
const goBack = useBackNavigation('/admin/users')

guardMounted(() => {
  trackRecord(usersStore.items.length === 0 ? usersStore.fetchAll().catch(notifyLoadError) : undefined)
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

// The API refuses an Admin changing their own role/status (422), and an
// admin-side password reset of their own account would revoke their session.
const isSelf = computed(() => user.value?.id === userStore.id)

// Deactivating, or moving to Production, takes the user's open records away:
// offer a new owner (optional — the result toast says what's left).
const reassignTo = ref(KEEP_RECORDS)
const losesRecords = computed(() => !!user.value && updateLosesRecords(user.value, form))

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async (_values?: unknown, ctx?: { setErrors: (errors: Record<string, string>) => void }) => {
  if (!user.value) return
  const name = `${form.first_name} ${form.last_name}`.trim()
  try {
    const result = await usersStore.update(user.value.id, {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      tel: form.tel,
      role: form.role,
      status: form.status,
      notes: form.notes,
      password: isSelf.value ? '' : form.password,
      reassign_to: losesRecords.value ? toReassignTo(reassignTo.value) : undefined,
    })
    success(t('admin.users.detail.updateSuccess'))
    notifyRecordsResult(name, result)
  } catch (err) {
    // 422 self-change / bad reassign_to / other fields → on the inputs;
    // 409 last active Admin → toast.
    if (ctx && applyUserFieldErrors(err, ctx.setErrors)) return
    error(userGuardMessage(err) ?? getApiErrorMessage(err, t('global.genericError')))
    return
  }
  markClean()
  navigateTo('/admin/users')
})
</script>
