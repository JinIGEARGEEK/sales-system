<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.companySizes.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.companySizes.addSize')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddCompanySize"
        />
      </div>
    </template>

    <TableData
      :columns="companySizeColumns"
      :rows="companySizeRows"
      :total="companySizeRows.length"
      :total-page="1"
      :per-page="companySizeRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditCompanySize"
      @delete="requestDeactivateCompanySize"
    />
  </UCard>

  <CrmCompanySizeOptionModal
    v-model:open="companySizeModalOpen"
    :size="editingCompanySize"
    @submit="onSubmitCompanySize"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateCompanySizeOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.companySizes.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateCompanySize"
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
const companySizeOptionsStore = useCompanySizeOptionsStore()

// ── Company Size options ──────────────────────────────────────────

const companySizeModalOpen = ref(false)
const editingCompanySize = ref<CompanySizeOption | null>(null)

const openAddCompanySize = () => {
  editingCompanySize.value = null
  companySizeModalOpen.value = true
}
const onEditCompanySize = (row: CompanySizeOption) => {
  editingCompanySize.value = companySizeOptionsStore.items.find(s => s.id === row.id) || null
  companySizeModalOpen.value = true
}

const onSubmitCompanySize = async (payload: { name: string, is_active: boolean }) => {
  try {
    if (editingCompanySize.value) {
      await companySizeOptionsStore.update(editingCompanySize.value.id, payload)
    } else {
      await companySizeOptionsStore.add(payload)
    }
    success(t('admin.pipelineConfig.companySizes.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateCompanySizeOpen, target: companySizeTarget, requestDelete: requestDeactivateCompanySize, closeDelete: closeDeactivateCompanySize } = useDeleteConfirm<CompanySizeOption>()
const confirmDeactivateCompanySize = async () => {
  if (companySizeTarget.value) {
    try {
      await companySizeOptionsStore.remove(companySizeTarget.value.id)
      success(t('admin.pipelineConfig.companySizes.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateCompanySize()
}

const companySizeRows = computed(() => companySizeOptionsStore.items.map(size => ({
  ...size,
  statusBadge: size.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const companySizeColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.companySizes.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.companySizes.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.companySizes.columns.action'),
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
