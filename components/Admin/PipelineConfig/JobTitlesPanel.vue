<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.jobTitles.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.jobTitles.addJobTitle')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddJobTitle"
        />
      </div>
    </template>

    <TableData
      :columns="jobTitleColumns"
      :rows="jobTitleRows"
      :total="jobTitleRows.length"
      :total-page="1"
      :per-page="jobTitleRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditJobTitle"
      @delete="requestDeactivateJobTitle"
    />
  </UCard>

  <CrmJobTitleOptionModal
    v-model:open="jobTitleModalOpen"
    :job-title="editingJobTitle"
    @submit="onSubmitJobTitle"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateJobTitleOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.jobTitles.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateJobTitle"
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
const jobTitleOptionsStore = useJobTitleOptionsStore()

// ── Contact Job Title options ─────────────────────────────────────

const jobTitleModalOpen = ref(false)
const editingJobTitle = ref<JobTitleOption | null>(null)

const openAddJobTitle = () => {
  editingJobTitle.value = null
  jobTitleModalOpen.value = true
}
const onEditJobTitle = (row: JobTitleOption) => {
  editingJobTitle.value = jobTitleOptionsStore.items.find(j => j.id === row.id) || null
  jobTitleModalOpen.value = true
}

const onSubmitJobTitle = async (payload: { name: string, is_active: boolean }) => {
  try {
    if (editingJobTitle.value) {
      await jobTitleOptionsStore.update(editingJobTitle.value.id, payload)
    } else {
      await jobTitleOptionsStore.add(payload)
    }
    success(t('admin.pipelineConfig.jobTitles.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateJobTitleOpen, target: jobTitleTarget, requestDelete: requestDeactivateJobTitle, closeDelete: closeDeactivateJobTitle } = useDeleteConfirm<JobTitleOption>()
const confirmDeactivateJobTitle = async () => {
  if (jobTitleTarget.value) {
    try {
      await jobTitleOptionsStore.remove(jobTitleTarget.value.id)
      success(t('admin.pipelineConfig.jobTitles.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateJobTitle()
}

const jobTitleRows = computed(() => jobTitleOptionsStore.items.map(jobTitle => ({
  ...jobTitle,
  statusBadge: jobTitle.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const jobTitleColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.jobTitles.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.jobTitles.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.jobTitles.columns.action'),
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
