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
          :columns="columns"
          :rows="displayKeys"
          :total="displayKeys.length"
          :total-page="1"
          :per-page="displayKeys.length || 1"
          :page="1"
          :loading="loading"
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
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const apiKeysStore = useApiKeysStore()
const usersStore = useUsersStore()

const loading = ref(false)

guardMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      apiKeysStore.fetchAll(),
      usersStore.items.length === 0 ? usersStore.fetchAll() : Promise.resolve(),
    ])
  } catch (err) {
    notifyApiError(err)
  } finally {
    loading.value = false
  }
})

// A key can act as any active staff User (not just Sales roles) — mirrors
// the backend's own owner.IsActive check on Create, so an inactive account
// never shows up as a pickable owner.
const ownerOptions = computed<Select[]>(() => usersStore.items
  .filter(u => u.is_active)
  .map(u => ({ label: `${u.first_name} ${u.last_name}`, value: String(u.id) })))

const ownerName = (ownerId: number) => {
  const owner = usersStore.items.find(u => u.id === ownerId)
  return owner ? `${owner.first_name} ${owner.last_name}` : '-'
}

const displayKeys = computed(() => apiKeysStore.items.map(key => ({
  ...key,
  ownerName: ownerName(key.owner_user_id),
  keyPrefixDisplay: `${key.key_prefix}···`,
  statusBadge: key.is_active
    ? toBadge(t('admin.apiKeys.index.statusActive'), 'success')
    : toBadge(t('admin.apiKeys.index.statusRevoked')),
  lastUsedDisplay: key.last_used_at ? dateFormat(key.last_used_at.toISOString()) : t('admin.apiKeys.index.neverUsed'),
  createdDate: dateFormat(key.created_at.toISOString()),
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
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: revokeOpen, target: revokeTarget, requestDelete: requestRevoke, closeDelete: closeRevoke } = useDeleteConfirm<APIKey>()

const confirmRevoke = async () => {
  if (revokeTarget.value) {
    try {
      await apiKeysStore.revoke(revokeTarget.value.id)
      success(t('admin.apiKeys.index.revokeSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeRevoke()
}
</script>
