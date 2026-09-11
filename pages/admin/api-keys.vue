<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black">{{ t('admin.apiKeys.index.heading') }}</h2>
          <p class="text-sm text-(--color-gray)">{{ t('admin.apiKeys.index.subheading') }}</p>
        </div>
        <ButtonPrimary
          :label="t('admin.apiKeys.index.addKey')"
          icon="material-symbols:add"
          @click="createModalOpen = true"
        />
      </div>

      <UCard :ui="GLASS_PANEL_UI">
        <TableData
          v-model:page="page"
          server-paginated
          :columns="columns"
          :rows="displayKeys"
          :total="total"
          :total-page="totalPage"
          :per-page="perPage"
          :loading="loading"
          @change-page="onChangePage"
          @change-per-page="onChangePerPage"
          @revoke="requestRevoke"
        />
      </UCard>

      <AdminCreateApiKeyModal
        v-model:open="createModalOpen"
        :owner-options="ownerOptions"
        @submit="onCreate"
      />

      <AdminRevealApiKeyModal
        v-model:open="revealModalOpen"
        :api-key="revealedKey"
      />

      <CrmConfirmDeleteModal
        v-model:open="revokeOpen"
        :title="t('admin.apiKeys.index.revokeTitle')"
        :body="t('admin.apiKeys.index.revokeConfirm', { name: revokeTarget?.name ?? '' })"
        :confirm-label="t('admin.apiKeys.index.revoke')"
        confirm-color="error"
        @confirm="confirmRevoke"
      />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.apiKeys.index.pageTitle') })

// Admin-only page — same page-level guard + <AccessGate> pairing as
// pages/admin/users/index.vue; the real security boundary is
// /admin/api-keys' RequireRoles(Admin) on the backend.
const { canAccess, guardMounted } = usePageAccess('Admin')

const { dateFormat, toBadge } = useFormatter()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const apiKeysStore = useApiKeysStore()
const usersStore = useUsersStore()

const {
  rows,
  total,
  totalPage,
  page,
  perPage,
  loading,
  fetch,
  onChangePage,
  onChangePerPage,
} = useServerListPage<APIKey>(params => apiKeysStore.fetchList(params), () => ({}))

guardMounted(() => {
  fetch()
  if (usersStore.items.length === 0) usersStore.fetchAll().catch(notifyApiError)
})

// A key can act as any active staff User (not just Sales roles) — mirrors
// the backend's own owner.IsActive check on Create, so an inactive account
// never shows up as a pickable owner.
const ownerOptions = computed<Select[]>(() => usersStore.items
  .filter(u => u.is_active)
  .map(u => ({ label: `${u.first_name} ${u.last_name}`, value: String(u.id) })))

// A Map, not a per-row `.find()` — this page's own row count is small, but
// there's no reason to rescan the full Users array once per row on every
// recompute when a single id -> name lookup built once does the same job.
const ownerNameById = computed(() => new Map(usersStore.items.map(u => [u.id, `${u.first_name} ${u.last_name}`])))

const displayKeys = computed(() => rows.value.map(key => ({
  ...key,
  ownerName: ownerNameById.value.get(key.owner_user_id) ?? '-',
  keyPrefixDisplay: `${key.key_prefix}···`,
  statusBadge: key.is_active
    ? toBadge(t('admin.apiKeys.index.statusActive'), 'success')
    : toBadge(t('admin.apiKeys.index.statusRevoked')),
  lastUsedDisplay: key.last_used_at ? dateFormat(key.last_used_at) : t('admin.apiKeys.index.neverUsed'),
  createdDate: dateFormat(key.created_at),
})))

const columns: TableDataColumn[] = [
  { label: t('admin.apiKeys.index.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.apiKeys.index.columns.keyPrefix'), align: 'left', field: 'keyPrefixDisplay' },
  { label: t('admin.apiKeys.index.columns.owner'), align: 'left', field: 'ownerName' },
  { label: t('admin.apiKeys.index.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  { label: t('admin.apiKeys.index.columns.lastUsed'), align: 'left', field: 'lastUsedDisplay' },
  { label: t('admin.apiKeys.index.columns.created'), align: 'left', field: 'createdDate' },
  {
    label: t('admin.apiKeys.index.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      // Hidden once already revoked — nothing left to do to a dead key.
      { label: t('admin.apiKeys.index.revoke'), emitName: 'revoke', isBorderBottom: false, hideIf: row => !row.is_active },
    ],
  },
]

const createModalOpen = ref(false)
const revealModalOpen = ref(false)
const revealedKey = ref('')

const onCreate = async (payload: { name: string, owner_user_id: number }) => {
  try {
    const { key } = await apiKeysStore.add(payload)
    revealedKey.value = key
    revealModalOpen.value = true
    success(t('admin.apiKeys.index.createSuccess'))
    await fetch()
  } catch (err) {
    notifyApiError(err)
  }
}

const { open: revokeOpen, target: revokeTarget, requestDelete: requestRevoke, closeDelete: closeRevoke } = useDeleteConfirm<APIKey>()

const confirmRevoke = async () => {
  if (revokeTarget.value) {
    try {
      await apiKeysStore.revoke(revokeTarget.value.id)
      success(t('admin.apiKeys.index.revokeSuccess'))
      await fetch()
    } catch (err) {
      notifyApiError(err)
    }
  }
  closeRevoke()
}
</script>
