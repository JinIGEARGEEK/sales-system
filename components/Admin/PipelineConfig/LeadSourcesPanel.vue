<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.sources.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.sources.addSource')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddSource"
        />
      </div>
    </template>

    <TableData
      :columns="sourceColumns"
      :rows="sourceRows"
      :total="sourceRows.length"
      :total-page="1"
      :per-page="sourceRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditSource"
      @delete="requestDeactivateSource"
    />
  </UCard>

  <CrmLeadSourceModal
    v-model:open="sourceModalOpen"
    :source="editingSource"
    @submit="onSubmitSource"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateSourceOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.sources.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateSource"
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
const leadSourcesStore = useLeadSourcesStore()

// ── Lead / Deal sources ──────────────────────────────────────────

const sourceModalOpen = ref(false)
const editingSource = ref<LeadSourceOption | null>(null)

const openAddSource = () => {
  editingSource.value = null
  sourceModalOpen.value = true
}
const onEditSource = (row: LeadSourceOption) => {
  editingSource.value = leadSourcesStore.items.find(s => s.id === row.id) || null
  sourceModalOpen.value = true
}

const onSubmitSource = async (payload: { name: string, is_active: boolean }) => {
  try {
    if (editingSource.value) {
      await leadSourcesStore.update(editingSource.value.id, payload)
    } else {
      await leadSourcesStore.add(payload)
    }
    success(t('admin.pipelineConfig.sources.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateSourceOpen, target: sourceTarget, requestDelete: requestDeactivateSource, closeDelete: closeDeactivateSource } = useDeleteConfirm<LeadSourceOption>()
const confirmDeactivateSource = async () => {
  if (sourceTarget.value) {
    try {
      await leadSourcesStore.remove(sourceTarget.value.id)
      success(t('admin.pipelineConfig.sources.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateSource()
}

const sourceRows = computed(() => leadSourcesStore.items.map(source => ({
  ...source,
  statusBadge: source.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const sourceColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.sources.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.sources.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.sources.columns.action'),
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
