<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.prospectSources.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.prospectSources.addSource')"
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

  <CrmProspectSourceModal
    v-model:open="sourceModalOpen"
    :source="editingSource"
    @submit="onSubmitSource"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateSourceOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.prospectSources.deactivateConfirm')"
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
const prospectSourcesStore = useProspectSourcesStore()

const sourceModalOpen = ref(false)
const editingSource = ref<ProspectSourceOption | null>(null)

const openAddSource = () => {
  editingSource.value = null
  sourceModalOpen.value = true
}
const onEditSource = (row: ProspectSourceOption) => {
  editingSource.value = prospectSourcesStore.items.find(s => s.id === row.id) || null
  sourceModalOpen.value = true
}

const onSubmitSource = async (payload: { name: string, is_active: boolean }) => {
  try {
    if (editingSource.value) {
      await prospectSourcesStore.update(editingSource.value.id, payload)
    } else {
      await prospectSourcesStore.add(payload)
    }
    success(t('admin.pipelineConfig.prospectSources.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateSourceOpen, target: sourceTarget, requestDelete: requestDeactivateSource, closeDelete: closeDeactivateSource } = useDeleteConfirm<ProspectSourceOption>()
const confirmDeactivateSource = async () => {
  if (sourceTarget.value) {
    try {
      await prospectSourcesStore.remove(sourceTarget.value.id)
      success(t('admin.pipelineConfig.prospectSources.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateSource()
}

const sourceRows = computed(() => prospectSourcesStore.items.map(source => ({
  ...source,
  statusBadge: source.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const sourceColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.prospectSources.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.prospectSources.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.prospectSources.columns.action'),
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
