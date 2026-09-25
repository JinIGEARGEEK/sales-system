<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-black">{{ t('admin.users.index.heading') }}</h2>
        <div class="flex items-center gap-2">
          <ButtonPrimary
            outline
            :label="isSelectMode ? t('crm.components.tableSelect.cancelSelect') : t('crm.components.tableSelect.selectRows')"
            :disabled="!isSelectMode && displayUsers.length === 0"
            @click="toggleSelectMode"
          />
          <ButtonPrimary
            :label="t('admin.users.index.addStaff')"
            icon="material-symbols:add"
            @click="navigateTo('/admin/users/create')"
          />
        </div>
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
            <div class="w-full sm:w-44">
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
        v-model:select-value="selected"
        server-paginated
        :columns="columns"
        :rows="displayUsers"
        :total="total"
        :total-page="totalPage"
        :per-page="perPage"
        :loading="loading"
        :is-show-select="isSelectMode"
        :empty-title="t('admin.users.index.emptyTitle')"
        :empty-description="t('admin.users.index.emptyDescription')"
        empty-icon="material-symbols:group-outline"
        :empty-action-label="t('admin.users.index.addStaff')"
        empty-action-to="/admin/users/create"
        :filtered="hasActiveFilters"
        @clear-filters="clearFilters"
        @change-page="onChangePage"
        @change-per-page="onChangePerPage"
        @view-detail="onViewDetail"
        @edit="onEdit"
        @delete="requestDelete"
      />

      <AdminUserBulkActionBar
        v-if="selectedIds.length > 0"
        :selected-ids="selectedIds"
        @activate="onBulkActivate"
        @deactivate="onBulkDeactivate"
        @cancel="selected = []"
      />

      <CrmConfirmDeleteModal
        v-model:open="open"
        :name="target ? `${target.first_name} ${target.last_name}` : ''"
        @confirm="confirmDelete"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { ROLE_OPTIONS, STATUS_OPTIONS } from '~/constants/mockData'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.users.index.pageTitle') })

// Admin-only page — page-level guard paired with <AccessGate> in the
// template (an explicit "no access" state, not a page full of components
// whose fetches silently 403); the real security boundary is /users'
// RequireRoles(Admin) on the backend.
const { canAccess, guardMounted } = usePageAccess('Admin')

const { dateFormat, toBadge } = useFormatter()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const usersStore = useUsersStore()

// Kept as a full (up to 1000) background cache purely to resolve the
// "updated by" column's name below — there's no per-row "updated by name"
// field on the list endpoint, so this stays separate from the server-paginated
// `rows` the table itself renders, same pattern as Contacts' tag-options fetch.
guardMounted(() => {
  if (usersStore.items.length === 0) usersStore.fetchAll().catch(notifyApiError)
})

// URL-synced so a search/filter survives refresh and a back-button return
// from a user's detail page — see useQuerySyncedRef's own doc comment.
const search = useQuerySyncedRef('search', '', 400)
const roleFilter = useQuerySyncedRef('role')
const statusFilter = useQuerySyncedRef('status')

const hasActiveFilters = computed(() => search.value !== '' || roleFilter.value !== 'all' || statusFilter.value !== 'all')
const clearFilters = () => {
  search.value = ''
  roleFilter.value = 'all'
  statusFilter.value = 'all'
}

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

guardMounted(fetch)

watch(search, () => refetchDebounced())
watch([roleFilter, statusFilter], () => refetchFromStart())

const { isSelectMode, selected, selectedIds, toggleSelectMode } = useBulkSelection<AdminUser>()

// Selection is scoped to the currently visible page — a page/filter change
// invalidates whatever was selected before it, same as Leads' own list page.
watch([page, roleFilter, statusFilter], () => { selected.value = [] })

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

const columns = computed<TableDataColumn[]>(() => [
  ...(isSelectMode.value ? [{ label: '', align: 'left', field: 'select', type: TABLE_CARD_TYPE.SELECTED }] : []),
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
])

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

const onBulkSetActive = async (active: boolean) => {
  const count = selectedIds.value.length
  try {
    await usersStore.bulkSetActive(selectedIds.value, active)
    success(t(active ? 'admin.users.index.bulkActionBar.activateSuccess' : 'admin.users.index.bulkActionBar.deactivateSuccess', { count }))
    selected.value = []
    await fetch()
  } catch (err) {
    notifyApiError(err)
  }
}

const onBulkActivate = () => onBulkSetActive(true)
const onBulkDeactivate = () => onBulkSetActive(false)
</script>
