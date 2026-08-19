<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-black">{{ t('admin.pipelineConfig.heading') }}</h2>
      <p class="text-sm text-[var(--color-gray)]">{{ t('admin.pipelineConfig.subheading') }}</p>
    </div>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.relatedConfig.heading') }}</h3>
          <p class="text-sm text-[var(--color-gray)]">{{ t('admin.pipelineConfig.relatedConfig.tagsHint') }}</p>
        </div>
        <ButtonPrimary
          :label="t('admin.pipelineConfig.relatedConfig.manageTags')"
          icon="material-symbols:sell-outline"
          outline
          fit-content
          @click="navigateTo('/crm/tags')"
        />
      </div>
    </UCard>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.stages.heading') }}</h3>
          <ButtonPrimary
            :label="t('admin.pipelineConfig.stages.addStage')"
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
        :loading="stagesLoading"
        @edit="onEditStage"
        @delete="requestDeactivateStage"
      />
    </UCard>

    <UCard class="mb-4" :ui="GLASS_PANEL_UI">
      <template #header>
        <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.salesQuota.heading') }}</h3>
      </template>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Form ref="salesQuotaFormRef" class="flex-1" @submit="onSubmitSalesQuota">
          <InputText
            v-model.number="salesQuotaForm.quarterly_sales_target"
            type="number"
            :label="t('admin.pipelineConfig.salesQuota.label')"
            name="quarterly_sales_target"
            rules="required"
          />
        </Form>
        <ButtonPrimary :label="t('admin.pipelineConfig.salesQuota.save')" fit-content :loading="salesQuotaLoading" @click="onSaveSalesQuota" />
      </div>
      <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesQuota.help') }}</p>
    </UCard>

    <UCard :ui="GLASS_PANEL_UI">
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
        :loading="sourcesLoading"
        @edit="onEditSource"
        @delete="requestDeactivateSource"
      />
    </UCard>

    <CrmPipelineStageModal
      v-model:open="stageModalOpen"
      :stage="editingStage"
      @submit="onSubmitStage"
    />
    <CrmLeadSourceModal
      v-model:open="sourceModalOpen"
      :source="editingSource"
      @submit="onSubmitSource"
    />

    <CrmConfirmDeleteModal
      v-model:open="deactivateStageOpen"
      :title="t('admin.pipelineConfig.stages.deactivate')"
      :body="t('admin.pipelineConfig.stages.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateStage"
    />
    <CrmConfirmDeleteModal
      v-model:open="deactivateSourceOpen"
      :title="t('admin.pipelineConfig.deactivate')"
      :body="t('admin.pipelineConfig.sources.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateSource"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.pipelineConfig.pageTitle') })

// Admin-only page (gated by layouts/default.vue's nav `roles` filter and this
// route requiring the Admin-only /admin/pipeline-stages + /admin/lead-sources
// backend endpoints, which 403 for anyone else).
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { toBadge } = useFormatter()
const pipelineStagesStore = usePipelineStagesStore()
const leadSourcesStore = useLeadSourcesStore()
const appSettingsStore = useAppSettingsStore()

const stagesLoading = ref(false)
const sourcesLoading = ref(false)

onMounted(async () => {
  stagesLoading.value = true
  pipelineStagesStore.fetchAll().catch(notifyApiError).finally(() => { stagesLoading.value = false })
  sourcesLoading.value = true
  leadSourcesStore.fetchAll().catch(notifyApiError).finally(() => { sourcesLoading.value = false })
  try {
    const settings = await appSettingsStore.fetchAll()
    salesQuotaForm.quarterly_sales_target = settings.quarterly_sales_target
  } catch (err) {
    notifyApiError(err)
  }
})

// ── Sales quota ──────────────────────────────────────────────────

// Not a modal (no "reset on reopen" behavior needed here), but reuses
// useModalForm's formRef typing + validateThenSubmit dance rather than
// re-declaring the same ref<{ validate }> boilerplate — isOpen is a
// constant `false` since the initial value is set once via fetchAll above.
const { form: salesQuotaForm, formRef: salesQuotaFormRef, validateThenSubmit, loading: salesQuotaLoading, guard: guardSalesQuota } = useModalForm(
  () => false,
  () => ({ quarterly_sales_target: 0 }),
)

const onSubmitSalesQuota = guardSalesQuota(async () => {
  try {
    await appSettingsStore.update({ quarterly_sales_target: salesQuotaForm.quarterly_sales_target })
    success(t('admin.pipelineConfig.salesQuota.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
const onSaveSalesQuota = () => validateThenSubmit(onSubmitSalesQuota)

// ── Pipeline stages ──────────────────────────────────────────────

const stageModalOpen = ref(false)
const editingStage = ref<PipelineStage | null>(null)

const openAddStage = () => {
  editingStage.value = null
  stageModalOpen.value = true
}
const onEditStage = (row: PipelineStage) => {
  editingStage.value = pipelineStagesStore.items.find(s => s.id === row.id) || null
  stageModalOpen.value = true
}

const onSubmitStage = async (payload: { name: string, sort_order: number, is_active: boolean, is_won_stage: boolean, is_lost_stage: boolean }) => {
  try {
    if (editingStage.value) {
      await pipelineStagesStore.update(editingStage.value.id, payload)
    } else {
      await pipelineStagesStore.add(payload)
    }
    success(t('admin.pipelineConfig.stages.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateStageOpen, target: stageTarget, requestDelete: requestDeactivateStage, closeDelete: closeDeactivateStage } = useDeleteConfirm<PipelineStage>()
const confirmDeactivateStage = async () => {
  if (stageTarget.value) {
    try {
      await pipelineStagesStore.remove(stageTarget.value.id)
      success(t('admin.pipelineConfig.stages.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateStage()
}

const stageRows = computed(() => [...pipelineStagesStore.items]
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(stage => ({
    ...stage,
    flagsBadge: [
      stage.is_won_stage ? t('admin.pipelineConfig.stages.wonBadge') : '',
      stage.is_lost_stage ? t('admin.pipelineConfig.stages.lostBadge') : '',
    ].filter(Boolean).join(' / ') || '-',
    statusBadge: stage.is_active
      ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
      : toBadge(t('admin.pipelineConfig.statusInactive')),
  })))

const stageColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.stages.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.stages.columns.sortOrder'), align: 'left', field: 'sort_order' },
  { label: t('admin.pipelineConfig.stages.columns.flags'), align: 'left', field: 'flagsBadge' },
  { label: t('admin.pipelineConfig.stages.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.stages.columns.action'),
    align: 'left',
    field: 'action',
    width: 100,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('admin.pipelineConfig.deactivate'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

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
    width: 100,
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: false },
      { label: t('admin.pipelineConfig.deactivate'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]
</script>
