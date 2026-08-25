<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.revenueSizes.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.revenueSizes.addSize')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddRevenueSize"
        />
      </div>
    </template>

    <TableData
      :columns="revenueSizeColumns"
      :rows="revenueSizeRows"
      :total="revenueSizeRows.length"
      :total-page="1"
      :per-page="revenueSizeRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditRevenueSize"
      @delete="requestDeactivateRevenueSize"
    />
  </UCard>

  <CrmRevenueSizeOptionModal
    v-model:open="revenueSizeModalOpen"
    :revenue-size="editingRevenueSize"
    @submit="onSubmitRevenueSize"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateRevenueSizeOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.revenueSizes.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateRevenueSize"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'

defineProps<{
  loading: boolean
}>()

const { t } = useI18n()
const { success, error } = useNotify()
const { toBadge } = useFormatter()
const revenueSizeOptionsStore = useRevenueSizeOptionsStore()

// ── Revenue Size options ──────────────────────────────────────────

const revenueSizeModalOpen = ref(false)
const editingRevenueSize = ref<RevenueSizeOption | null>(null)

const openAddRevenueSize = () => {
  editingRevenueSize.value = null
  revenueSizeModalOpen.value = true
}
const onEditRevenueSize = (row: RevenueSizeOption) => {
  editingRevenueSize.value = revenueSizeOptionsStore.items.find(s => s.id === row.id) || null
  revenueSizeModalOpen.value = true
}

const onSubmitRevenueSize = async (payload: { name: string, is_active: boolean }) => {
  try {
    if (editingRevenueSize.value) {
      await revenueSizeOptionsStore.update(editingRevenueSize.value.id, payload)
    } else {
      await revenueSizeOptionsStore.add(payload)
    }
    success(t('admin.pipelineConfig.revenueSizes.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateRevenueSizeOpen, target: revenueSizeTarget, requestDelete: requestDeactivateRevenueSize, closeDelete: closeDeactivateRevenueSize } = useDeleteConfirm<RevenueSizeOption>()
const confirmDeactivateRevenueSize = async () => {
  if (revenueSizeTarget.value) {
    try {
      await revenueSizeOptionsStore.remove(revenueSizeTarget.value.id)
      success(t('admin.pipelineConfig.revenueSizes.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateRevenueSize()
}

const revenueSizeRows = computed(() => revenueSizeOptionsStore.items.map(size => ({
  ...size,
  statusBadge: size.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const revenueSizeColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.revenueSizes.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.revenueSizes.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.revenueSizes.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.pipelineConfig.deactivate'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]
</script>
