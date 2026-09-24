<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.prospectStages.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.prospectStages.addStage')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddStage"
        />
      </div>
    </template>

    <TableData
      :columns="stageColumns"
      :rows="stageRows"
      :total="stageRows.length"
      :total-page="1"
      :per-page="stageRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditStage"
      @delete="requestDeactivateStage"
    />
  </UCard>

  <CrmProspectStageModal
    v-model:open="stageModalOpen"
    :stage="editingStage"
    @submit="onSubmitStage"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateStageOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.prospectStages.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateStage"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'
import { OVERVIEW_STALE_DAYS as DEFAULT_STALE_DAYS } from '~/composables/utils/usePipelineOverview'

defineProps<{
  loading: boolean
}>()

const { t } = useI18n()
const { success, error } = useNotify()
const { toBadge } = useFormatter()
const prospectStagesStore = useProspectStagesStore()

const stageModalOpen = ref(false)
const editingStage = ref<ProspectStage | null>(null)

const openAddStage = () => {
  editingStage.value = null
  stageModalOpen.value = true
}
const onEditStage = (row: ProspectStage) => {
  editingStage.value = prospectStagesStore.items.find(s => s.id === row.id) || null
  stageModalOpen.value = true
}

const onSubmitStage = async (payload: { name: string, sort_order: number, is_active: boolean, is_disqualified_stage: boolean, stale_days: number | null }) => {
  try {
    if (editingStage.value) {
      await prospectStagesStore.update(editingStage.value.id, payload)
    } else {
      await prospectStagesStore.add(payload)
    }
    success(t('admin.pipelineConfig.prospectStages.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateStageOpen, target: stageTarget, requestDelete: requestDeactivateStage, closeDelete: closeDeactivateStage } = useDeleteConfirm<ProspectStage>()
const confirmDeactivateStage = async () => {
  if (stageTarget.value) {
    try {
      await prospectStagesStore.remove(stageTarget.value.id)
      success(t('admin.pipelineConfig.prospectStages.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateStage()
}

const stageRows = computed(() => [...prospectStagesStore.items]
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(stage => ({
    ...stage,
    flagsBadge: stage.is_disqualified_stage ? t('admin.pipelineConfig.prospectStages.disqualifiedBadge') : '-',
    // A Disqualified stage is closed, so never stale — no threshold to show.
    staleDaysLabel: stage.is_disqualified_stage
      ? '—'
      : t('admin.pipelineConfig.staleDaysValue', { days: stage.stale_days ?? DEFAULT_STALE_DAYS })
        + (stage.stale_days ? '' : ` ${t('admin.pipelineConfig.staleDaysDefaultTag')}`),
    statusBadge: stage.is_active
      ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
      : toBadge(t('admin.pipelineConfig.statusInactive')),
  })))

const stageColumns = computed<TableDataColumn[]>(() => [
  { label: t('admin.pipelineConfig.prospectStages.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.prospectStages.columns.sortOrder'), align: 'left', field: 'sort_order' },
  { label: t('admin.pipelineConfig.prospectStages.columns.flags'), align: 'left', field: 'flagsBadge' },
  { label: t('admin.pipelineConfig.staleDaysColumn'), align: 'left', field: 'staleDaysLabel' },
  { label: t('admin.pipelineConfig.prospectStages.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.prospectStages.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.pipelineConfig.deactivate'), emitName: 'delete', isBorderBottom: false },
    ],
  },
])
</script>
