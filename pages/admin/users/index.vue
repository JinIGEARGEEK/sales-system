<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ t('admin.users.index.heading') }}</h2>
      <ButtonPrimary
        :label="t('admin.users.index.addStaff')"
        icon="material-symbols:add"
        @click="navigateTo('/admin/users/create')"
      />
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
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
        <div class="w-full sm:w-40">
          <InputSelect
            v-model="statusFilter"
            :options="STATUS_OPTIONS"
            :placeholder="t('admin.users.index.statusPlaceholder')"
            name="statusFilter"
          />
        </div>
      </div>
    </UCard>

    <TableData
      v-model:page="page"
      :columns="columns"
      :rows="filteredUsers"
      :total="filteredUsers.length"
      :total-page="totalPage"
      :per-page="perPage"
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
const usersStore = useUsersStore()

onMounted(() => {
  if (usersStore.items.length === 0) usersStore.fetchAll()
})

const search = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')

const filteredUsers = computed(() => {
  return usersStore.items.filter((user) => {
    const matchSearch = !search.value
      || `${user.first_name} ${user.last_name}`.toLowerCase().includes(search.value.toLowerCase())
      || user.email.toLowerCase().includes(search.value.toLowerCase())
    const matchRole = roleFilter.value === 'all' || user.role === roleFilter.value
    const matchStatus = statusFilter.value === 'all'
      || (statusFilter.value === 'active' && user.is_active)
      || (statusFilter.value === 'inactive' && !user.is_active)
    return matchSearch && matchRole && matchStatus
  }).map((user) => {
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
  })
})

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
    width: 100,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.users.index.actions.viewDetail'), emitName: 'viewDetail', isBorderBottom: false },
      { label: t('admin.users.index.actions.edit'), emitName: 'edit', isBorderBottom: false },
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

const { page, perPage, totalPage, onChangePage, onChangePerPage } = useTablePagination(() => filteredUsers.value.length)
const { open, target, requestDelete, closeDelete } = useDeleteConfirm<AdminUser>()

const confirmDelete = async () => {
  if (target.value) {
    await usersStore.remove(target.value.id)
    success(t('admin.users.index.deleteSuccess'))
  }
  closeDelete()
}
</script>
