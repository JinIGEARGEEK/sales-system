<template>
  <UCard :ui="GLASS_PANEL_UI">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.salesTargets.heading') }}</h3>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.salesTargets.addTarget')"
          icon="material-symbols:add"
          small
          fit-content
          @click="openAddTarget"
        />
      </div>
    </template>

    <p class="mb-3 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesTargets.help') }}</p>

    <TableData
      :columns="targetColumns"
      :rows="targetRows"
      :total="targetRows.length"
      :total-page="1"
      :per-page="targetRows.length || 1"
      :page="1"
      :loading="loading"
      @edit="onEditTarget"
      @delete="requestDeleteTarget"
    />
  </UCard>

  <CrmSalesTargetModal
    v-model:open="targetModalOpen"
    :target="editingTarget"
    @submit="onSubmitTarget"
  />
  <CrmConfirmDeleteModal
    v-model:open="deleteTargetOpen"
    :title="t('admin.pipelineConfig.salesTargets.deleteTitle')"
    :body="t('admin.pipelineConfig.salesTargets.deleteConfirm')"
    :confirm-label="t('admin.pipelineConfig.salesTargets.delete')"
    confirm-color="error"
    @confirm="confirmDeleteTarget"
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
const { toBadge, numberFormat } = useFormatter()
const salesTargetsStore = useSalesTargetsStore()

// ── Quarterly sales targets (FR-CRM-092) ──────────────────────────
// Per-(year, quarter) overrides of the flat quarterly quota above — an
// Admin can pre-set a future quarter's/year's target without waiting for
// that period to start. A period with no row here just falls back to the
// quarterly quota card above, divided by 4 (unchanged pre-FR-CRM-092
// behavior) — see dashboard.go's currentQuarterTarget.

const targetModalOpen = ref(false)
const editingTarget = ref<SalesTarget | null>(null)

const openAddTarget = () => {
  editingTarget.value = null
  targetModalOpen.value = true
}
const onEditTarget = (row: SalesTarget) => {
  editingTarget.value = salesTargetsStore.items.find(t => t.id === row.id) || null
  targetModalOpen.value = true
}

const onSubmitTarget = async (payload: { year: number, quarter: number, target_value: number }) => {
  try {
    if (editingTarget.value) {
      await salesTargetsStore.update(editingTarget.value.id, payload)
    } else {
      await salesTargetsStore.add(payload)
    }
    success(t('admin.pipelineConfig.salesTargets.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deleteTargetOpen, target: targetToDelete, requestDelete: requestDeleteTarget, closeDelete: closeDeleteTarget } = useDeleteConfirm<SalesTarget>()
const confirmDeleteTarget = async () => {
  if (targetToDelete.value) {
    try {
      await salesTargetsStore.remove(targetToDelete.value.id)
      success(t('admin.pipelineConfig.salesTargets.deleteSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeleteTarget()
}

// A period is "current" when it matches today's calendar year/quarter —
// badged so the Admin can see at a glance which row is live right now vs.
// a pre-scheduled future (or leftover past) period.
const currentPeriod = computed(() => {
  const now = new Date()
  return { year: now.getFullYear(), quarter: Math.floor(now.getMonth() / 3) + 1 }
})

const targetRows = computed(() => salesTargetsStore.sorted.map(target => ({
  ...target,
  quarterLabel: `Q${target.quarter} ${target.year}`,
  targetValueDisplay: numberFormat(target.target_value),
  periodBadge: (target.year === currentPeriod.value.year && target.quarter === currentPeriod.value.quarter)
    ? toBadge(t('admin.pipelineConfig.salesTargets.currentBadge'), 'success')
    : (target.year > currentPeriod.value.year || (target.year === currentPeriod.value.year && target.quarter > currentPeriod.value.quarter))
      ? toBadge(t('admin.pipelineConfig.salesTargets.upcomingBadge'), 'info')
      : toBadge(t('admin.pipelineConfig.salesTargets.pastBadge')),
})))

const targetColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.salesTargets.columns.period'), align: 'left', field: 'quarterLabel' },
  { label: t('admin.pipelineConfig.salesTargets.columns.targetValue'), align: 'left', field: 'targetValueDisplay' },
  { label: t('admin.pipelineConfig.salesTargets.columns.status'), align: 'left', field: 'periodBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.salesTargets.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.pipelineConfig.salesTargets.delete'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]
</script>
