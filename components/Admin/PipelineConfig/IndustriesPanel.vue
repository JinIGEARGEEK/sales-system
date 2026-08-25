<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.industries.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.industries.addIndustry')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddIndustry"
        />
      </div>
    </template>

    <TableData
      :columns="industryColumns"
      :rows="industryRows"
      :total="industryRows.length"
      :total-page="1"
      :per-page="industryRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditIndustry"
      @delete="requestDeactivateIndustry"
    />
  </UCard>

  <CrmIndustryOptionModal
    v-model:open="industryModalOpen"
    :industry="editingIndustry"
    @submit="onSubmitIndustry"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateIndustryOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.industries.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateIndustry"
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
const industryOptionsStore = useIndustryOptionsStore()

// ── Company Industry options ──────────────────────────────────────

const industryModalOpen = ref(false)
const editingIndustry = ref<IndustryOption | null>(null)

const openAddIndustry = () => {
  editingIndustry.value = null
  industryModalOpen.value = true
}
const onEditIndustry = (row: IndustryOption) => {
  editingIndustry.value = industryOptionsStore.items.find(i => i.id === row.id) || null
  industryModalOpen.value = true
}

const onSubmitIndustry = async (payload: { name: string, is_active: boolean }) => {
  try {
    if (editingIndustry.value) {
      await industryOptionsStore.update(editingIndustry.value.id, payload)
    } else {
      await industryOptionsStore.add(payload)
    }
    success(t('admin.pipelineConfig.industries.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateIndustryOpen, target: industryTarget, requestDelete: requestDeactivateIndustry, closeDelete: closeDeactivateIndustry } = useDeleteConfirm<IndustryOption>()
const confirmDeactivateIndustry = async () => {
  if (industryTarget.value) {
    try {
      await industryOptionsStore.remove(industryTarget.value.id)
      success(t('admin.pipelineConfig.industries.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateIndustry()
}

const industryRows = computed(() => industryOptionsStore.items.map(industry => ({
  ...industry,
  statusBadge: industry.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const industryColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.industries.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.industries.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.industries.columns.action'),
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
