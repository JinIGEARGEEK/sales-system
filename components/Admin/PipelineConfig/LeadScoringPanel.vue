<template>
  <UCard :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.leadScoring.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.leadScoring.addCriterion')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddCriterion"
        />
      </div>
    </template>

    <p class="mb-3 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.leadScoring.help') }}</p>

    <TableData
      :columns="criterionColumns"
      :rows="criterionRows"
      :total="criterionRows.length"
      :total-page="1"
      :per-page="criterionRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditCriterion"
      @delete="requestDeactivateCriterion"
    />
  </UCard>

  <CrmLeadScoringCriterionModal
    v-model:open="criterionModalOpen"
    :criterion="editingCriterion"
    @submit="onSubmitCriterion"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateCriterionOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.leadScoring.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateCriterion"
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
const leadScoringCriteriaStore = useLeadScoringCriteriaStore()

// ── Lead Scoring Criteria (FR-CRM-006/007) ────────────────────────

const criterionModalOpen = ref(false)
const editingCriterion = ref<LeadScoringCriterion | null>(null)

const openAddCriterion = () => {
  editingCriterion.value = null
  criterionModalOpen.value = true
}
const onEditCriterion = (row: LeadScoringCriterion) => {
  editingCriterion.value = leadScoringCriteriaStore.items.find(c => c.id === row.id) || null
  criterionModalOpen.value = true
}

const onSubmitCriterion = async (payload: { name: string, field: LeadScoringCriterionField, match_value: string, weight: number, is_active: boolean }) => {
  try {
    if (editingCriterion.value) {
      await leadScoringCriteriaStore.update(editingCriterion.value.id, payload)
    } else {
      await leadScoringCriteriaStore.add(payload)
    }
    success(t('admin.pipelineConfig.leadScoring.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateCriterionOpen, target: criterionTarget, requestDelete: requestDeactivateCriterion, closeDelete: closeDeactivateCriterion } = useDeleteConfirm<LeadScoringCriterion>()
const confirmDeactivateCriterion = async () => {
  if (criterionTarget.value) {
    try {
      await leadScoringCriteriaStore.remove(criterionTarget.value.id)
      success(t('admin.pipelineConfig.leadScoring.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateCriterion()
}

const CRITERION_FIELD_LABEL_KEY: Record<LeadScoringCriterionField, string> = {
  source: 'source',
  has_company_name: 'hasCompanyName',
  has_phone: 'hasPhone',
}

const criterionRows = computed(() => leadScoringCriteriaStore.items.map(criterion => ({
  ...criterion,
  fieldLabel: t(`admin.pipelineConfig.leadScoring.fieldOptions.${CRITERION_FIELD_LABEL_KEY[criterion.field]}`),
  statusBadge: criterion.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const criterionColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.leadScoring.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.leadScoring.columns.field'), align: 'left', field: 'fieldLabel' },
  { label: t('admin.pipelineConfig.leadScoring.columns.matchValue'), align: 'left', field: 'match_value' },
  { label: t('admin.pipelineConfig.leadScoring.columns.weight'), align: 'left', field: 'weight' },
  { label: t('admin.pipelineConfig.leadScoring.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.leadScoring.columns.action'),
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
