<template>
  <div class="p-5">
    <div v-if="!canAccess" class="p-10 text-center text-sm text-[var(--color-gray)]">
      {{ t('admin.users.noAccess') }}
    </div>
    <template v-else>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black">{{ t('admin.users.index.heading') }}</h2>
      <ButtonPrimary
        :label="t('admin.users.index.addStaff')"
        icon="material-symbols:add"
        @click="navigateTo('/admin/users/create')"
      />
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex flex-col gap-3">
        <CrmStatusPill v-model="statusFilter" :options="STATUS_OPTIONS" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1">
            <InputText
              v-model="search"
              :placeholder="t('admin.users.index.searchPlaceholder')"
              name="search"
            />
          </div>
          <div class="w-full sm:w-40">
            <InputSelect
              v-model="roleFilter"
              :options="ROLE_OPTIONS"
              :placeholder="t('admin.users.index.rolePlaceholder')"
              name="roleFilter"
            />
          </div>
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      server-paginated
      :columns="columns"
      :rows="displayUsers"
      :total="total"
      :total-page="totalPage"
      :per-page="perPage"
      :loading="loading"
      @change-page="onChangePage"
      @change-per-page="onChangePerPage"
      @view-detail="onViewDetail"
      @edit="onEdit"
      @delete="requestDelete"
    />

    <CrmConfirmDeleteModal
      v-model:open="open"
      :name="target ? `${target.first_name} ${target.last_name}` : ''"
      @confirm="confirmDelete"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { ROLE_OPTIONS, STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.users.index.pageTitle') })

const { dateFormat, toBadge } = useFormatter()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { hasRole } = useRole()
const usersStore = useUsersStore()

// Staff management is Admin-only, matching GET /users' backend RBAC.
const canAccess = computed(() => hasRole('Admin'))

// Kept as a full (up to 1000) background cache purely to resolve the
// "updated by" column's name below — there's no per-row "updated by name"
// field on the list endpoint, so this stays separate from the server-paginated
// `rows` the table itself renders, same pattern as Contacts' tag-options fetch.
onMounted(() => {
  if (!canAccess.value) return
  if (usersStore.items.length === 0) usersStore.fetchAll().catch(notifyApiError)
})

const search = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')

const buildParams = () => ({
  search: search.value || undefined,
  role: roleFilter.value !== 'all' ? roleFilter.value : undefined,
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
})

const {
  rows,
  total,
  totalPage,
  page,
  perPage,
  loading,
  fetch,
  refetchFromStart,
  refetchDebounced,
  onChangePage,
  onChangePerPage,
} = useServerListPage<AdminUser>(params => usersStore.fetchList(params), buildParams)

onMounted(() => { if (canAccess.value) fetch() })

watch(search, () => refetchDebounced())
watch([roleFilter, statusFilter], () => refetchFromStart())

const displayUsers = computed(() => rows.value.map((user) => {
  const updater = usersStore.items.find(u => u.id === user.updated_by)
  return {
    ...user,
    name: `${user.first_name} ${user.last_name}`,
    status: toBadge(user.is_active ? t('admin.users.index.statusActive') : t('admin.users.index.statusInactive'), user.is_active ? 'success' : 'neutral'),
    roleBadge: toBadge(user.role),
    createdDate: user.created_at ? dateFormat(user.created_at.toISOString()) : '-',
    updatedAtCell: {
      updatedAt: user.updated_at ? user.updated_at.toISOString() : '',
      updatedById: user.updated_by,
      path: `/admin/users/${user.updated_by}`,
      updatedByName: updater ? `${updater.first_name} ${updater.last_name}`.trim() : '-',
    },
  }
}))

const columns: TableDataColumn[] = [
  { label: t('admin.users.index.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.users.index.columns.email'), align: 'left', field: 'email' },
  { label: t('admin.users.index.columns.role'), align: 'left', field: 'roleBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('admin.users.index.columns.status'), align: 'left', field: 'status', type: TABLE_CARD_TYPE.STATUS },
  { label: t('admin.users.index.columns.created'), align: 'left', field: 'createdDate' },
  { label: t('admin.users.index.columns.updated'), align: 'left', field: 'updatedAtCell', type: TABLE_CARD_TYPE.UPDATED_AT },
  {
    label: t('admin.users.index.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.users.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('admin.users.index.actions.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.users.index.actions.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

const onViewDetail = (row: AdminUser) => {
  navigateTo(`/admin/users/${row.id}`)
}

const onEdit = (row: AdminUser) => {
  navigateTo(`/admin/users/${row.id}`)
}

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<AdminUser>()

const confirmDelete = async () => {
  try {
    if (target.value) {
      await usersStore.remove(target.value.id)
      success(t('admin.users.index.deleteSuccess'))
      await fetch()
    }
  } catch (err) {
    notifyApiError(err)
  } finally {
    closeDelete()
  }
}
</script>
