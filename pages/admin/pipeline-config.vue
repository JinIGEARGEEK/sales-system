<template>
  <div class="p-5">
    <AccessGate :can-access="canAccess">
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

    <UTabs v-model="activeTab" :items="tabItems" class="mb-4" />

    <div v-if="activeTab === 'stages'">
      <UCard :ui="GLASS_PANEL_UI">
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
    </div>

    <div v-else-if="activeTab === 'revenue'">
      <UCard class="mb-4" :ui="GLASS_PANEL_UI">
        <template #header>
          <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.salesQuota.heading') }}</h3>
        </template>

        <Form ref="salesQuotaFormRef" @submit="onSubmitSalesQuota">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <InputText
              v-model.number="salesQuotaForm.quarterly_sales_target"
              type="number"
              :label="t('admin.pipelineConfig.salesQuota.label')"
              name="quarterly_sales_target"
              rules="required"
              class="flex-1"
            />
            <InputText
              v-model.number="salesQuotaForm.annual_revenue_goal"
              type="number"
              :label="t('admin.pipelineConfig.salesQuota.annualGoalLabel')"
              name="annual_revenue_goal"
              rules="required"
              class="flex-1"
            />
            <InputText
              v-model.number="salesQuotaForm.lead_scoring_mql_threshold"
              type="number"
              :label="t('admin.pipelineConfig.salesQuota.mqlThresholdLabel')"
              name="lead_scoring_mql_threshold"
              rules="required"
              class="flex-1"
            />
            <ButtonPrimary :label="t('admin.pipelineConfig.salesQuota.save')" fit-content :loading="salesQuotaLoading" @click="onSaveSalesQuota" />
          </div>
        </Form>
        <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesQuota.help') }}</p>
        <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesQuota.annualGoalHelp') }}</p>
        <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesQuota.mqlThresholdHelp') }}</p>
        <p v-if="salesQuotaUpdatedAt" class="mt-2 text-xs text-[var(--color-gray)]">
          {{ t('admin.pipelineConfig.salesQuota.lastUpdated', { date: dateTimeFormat(salesQuotaUpdatedAt) }) }}
        </p>
      </UCard>

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
          :loading="targetsLoading"
          @edit="onEditTarget"
          @delete="requestDeleteTarget"
        />
      </UCard>
    </div>

    <div v-else-if="activeTab === 'leads'">
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
          :loading="sourcesLoading"
          @edit="onEditSource"
          @delete="requestDeactivateSource"
        />
      </UCard>

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
          :loading="criteriaLoading"
          @edit="onEditCriterion"
          @delete="requestDeactivateCriterion"
        />
      </UCard>
    </div>

    <div v-else-if="activeTab === 'company'">
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
          :loading="industriesLoading"
          @edit="onEditIndustry"
          @delete="requestDeactivateIndustry"
        />
      </UCard>

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
          :loading="companySizesLoading"
          @edit="onEditCompanySize"
          @delete="requestDeactivateCompanySize"
        />
      </UCard>

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
          :loading="revenueSizesLoading"
          @edit="onEditRevenueSize"
          @delete="requestDeactivateRevenueSize"
        />
      </UCard>

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
          :loading="jobTitlesLoading"
          @edit="onEditJobTitle"
          @delete="requestDeactivateJobTitle"
        />
      </UCard>

      <UCard :ui="GLASS_PANEL_UI">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.productCategories.heading') }}</h3>
            <ButtonPrimary
              :label="t('admin.pipelineConfig.productCategories.addCategory')"
              icon="material-symbols:add"
              small
              fit-content
              @click="openAddProductCategory"
            />
          </div>
        </template>

        <TableData
          :columns="productCategoryColumns"
          :rows="productCategoryRows"
          :total="productCategoryRows.length"
          :total-page="1"
          :per-page="productCategoryRows.length || 1"
          :page="1"
          :loading="productCategoriesLoading"
          @edit="onEditProductCategory"
          @delete="requestDeactivateProductCategory"
        />
      </UCard>
    </div>

    <div v-else-if="activeTab === 'notifications'">
      <UCard :ui="GLASS_PANEL_UI">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.notificationRules.heading') }}</h3>
            <ButtonPrimary
              :label="t('admin.pipelineConfig.notificationRules.addRule')"
              icon="material-symbols:add"
              small
              fit-content
              @click="openAddRule"
            />
          </div>
        </template>

        <p class="mb-3 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.notificationRules.help') }}</p>

        <TableData
          :columns="ruleColumns"
          :rows="ruleRows"
          :total="ruleRows.length"
          :total-page="1"
          :per-page="ruleRows.length || 1"
          :page="1"
          :loading="rulesLoading"
          @edit="onEditRule"
          @delete="requestDeactivateRule"
        />
      </UCard>
    </div>

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
    <CrmSalesTargetModal
      v-model:open="targetModalOpen"
      :target="editingTarget"
      @submit="onSubmitTarget"
    />
    <CrmLeadScoringCriterionModal
      v-model:open="criterionModalOpen"
      :criterion="editingCriterion"
      @submit="onSubmitCriterion"
    />
    <CrmNotificationRuleModal
      v-model:open="ruleModalOpen"
      :rule="editingRule"
      @submit="onSubmitRule"
    />
    <CrmIndustryOptionModal
      v-model:open="industryModalOpen"
      :industry="editingIndustry"
      @submit="onSubmitIndustry"
    />
    <CrmCompanySizeOptionModal
      v-model:open="companySizeModalOpen"
      :size="editingCompanySize"
      @submit="onSubmitCompanySize"
    />
    <CrmRevenueSizeOptionModal
      v-model:open="revenueSizeModalOpen"
      :revenue-size="editingRevenueSize"
      @submit="onSubmitRevenueSize"
    />
    <CrmJobTitleOptionModal
      v-model:open="jobTitleModalOpen"
      :job-title="editingJobTitle"
      @submit="onSubmitJobTitle"
    />
    <CrmProductCategoryOptionModal
      v-model:open="productCategoryModalOpen"
      :category="editingProductCategory"
      @submit="onSubmitProductCategory"
    />

    <CrmConfirmDeleteModal
      v-model:open="deleteTargetOpen"
      :title="t('admin.pipelineConfig.salesTargets.deleteTitle')"
      :body="t('admin.pipelineConfig.salesTargets.deleteConfirm')"
      :confirm-label="t('admin.pipelineConfig.salesTargets.delete')"
      confirm-color="error"
      @confirm="confirmDeleteTarget"
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
    <CrmConfirmDeleteModal
      v-model:open="deactivateCriterionOpen"
      :title="t('admin.pipelineConfig.deactivate')"
      :body="t('admin.pipelineConfig.leadScoring.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateCriterion"
    />
    <CrmConfirmDeleteModal
      v-model:open="deactivateRuleOpen"
      :title="t('admin.pipelineConfig.deactivate')"
      :body="t('admin.pipelineConfig.notificationRules.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateRule"
    />
    <CrmConfirmDeleteModal
      v-model:open="deactivateIndustryOpen"
      :title="t('admin.pipelineConfig.deactivate')"
      :body="t('admin.pipelineConfig.industries.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateIndustry"
    />
    <CrmConfirmDeleteModal
      v-model:open="deactivateCompanySizeOpen"
      :title="t('admin.pipelineConfig.deactivate')"
      :body="t('admin.pipelineConfig.companySizes.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateCompanySize"
    />
    <CrmConfirmDeleteModal
      v-model:open="deactivateRevenueSizeOpen"
      :title="t('admin.pipelineConfig.deactivate')"
      :body="t('admin.pipelineConfig.revenueSizes.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateRevenueSize"
    />
    <CrmConfirmDeleteModal
      v-model:open="deactivateJobTitleOpen"
      :title="t('admin.pipelineConfig.deactivate')"
      :body="t('admin.pipelineConfig.jobTitles.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateJobTitle"
    />
    <CrmConfirmDeleteModal
      v-model:open="deactivateProductCategoryOpen"
      :title="t('admin.pipelineConfig.deactivate')"
      :body="t('admin.pipelineConfig.productCategories.deactivateConfirm')"
      :confirm-label="t('admin.pipelineConfig.deactivate')"
      confirm-color="warning"
      @confirm="confirmDeactivateProductCategory"
    />
    </AccessGate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TABLE_CARD_TYPE from '~/constants/tableCardType'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()

useHead({ title: t('admin.pipelineConfig.pageTitle') })

// Admin-only page — gated by layouts/default.vue's nav `roles` filter, this
// page's own `canAccess` guard below (paired with <AccessGate> in the
// template, so a non-Admin who navigates here directly sees an explicit "no
// access" state instead of a page full of components whose data-fetches
// silently 403), and — the real security boundary — every underlying
// /admin/* backend endpoint requiring Admin via RequireRoles.
const { canAccess, guardMounted } = usePageAccess('Admin')

const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { toBadge, dateTimeFormat } = useFormatter()
const pipelineStagesStore = usePipelineStagesStore()
const leadSourcesStore = useLeadSourcesStore()
const appSettingsStore = useAppSettingsStore()
const salesTargetsStore = useSalesTargetsStore()
const leadScoringCriteriaStore = useLeadScoringCriteriaStore()
const notificationRulesStore = useNotificationRulesStore()
const industryOptionsStore = useIndustryOptionsStore()
const companySizeOptionsStore = useCompanySizeOptionsStore()
const revenueSizeOptionsStore = useRevenueSizeOptionsStore()
const jobTitleOptionsStore = useJobTitleOptionsStore()
const productCategoryOptionsStore = useProductCategoryOptionsStore()
const { settings: appSettings } = storeToRefs(appSettingsStore)
// Neither the quarterly quota nor the annual goal resets itself on a new
// quarter/year — surfacing when it was last touched is the cheapest guard
// against a stale figure (e.g. last year's annual goal still sitting there
// in February) going unnoticed. Reactive off the store so it updates the
// instant a save succeeds, not just on the next page load.
const salesQuotaUpdatedAt = computed(() => appSettings.value?.updated_at ?? null)

// Local-state tabs (no child routes, resets to the default on reload) —
// same convention as pages/crm/companies/[id].vue/pages/admin/trash.vue,
// used instead of one long scrolling page of stacked UCards now that this
// page has grown to 6 config sections.
const activeTab = ref('stages')
const tabItems = computed(() => [
  { label: t('admin.pipelineConfig.tabs.stages'), value: 'stages' },
  { label: t('admin.pipelineConfig.tabs.revenue'), value: 'revenue' },
  { label: t('admin.pipelineConfig.tabs.leads'), value: 'leads' },
  { label: t('admin.pipelineConfig.tabs.company'), value: 'company' },
  { label: t('admin.pipelineConfig.tabs.notifications'), value: 'notifications' },
])

const stagesLoading = ref(false)
const sourcesLoading = ref(false)
const targetsLoading = ref(false)
const criteriaLoading = ref(false)
const rulesLoading = ref(false)
const industriesLoading = ref(false)
const companySizesLoading = ref(false)
const revenueSizesLoading = ref(false)
const jobTitlesLoading = ref(false)
const productCategoriesLoading = ref(false)

guardMounted(async () => {
  stagesLoading.value = true
  pipelineStagesStore.fetchAll().catch(notifyApiError).finally(() => { stagesLoading.value = false })
  sourcesLoading.value = true
  leadSourcesStore.fetchAll().catch(notifyApiError).finally(() => { sourcesLoading.value = false })
  targetsLoading.value = true
  salesTargetsStore.fetchAll().catch(notifyApiError).finally(() => { targetsLoading.value = false })
  criteriaLoading.value = true
  leadScoringCriteriaStore.fetchAll().catch(notifyApiError).finally(() => { criteriaLoading.value = false })
  rulesLoading.value = true
  notificationRulesStore.fetchAll().catch(notifyApiError).finally(() => { rulesLoading.value = false })
  industriesLoading.value = true
  industryOptionsStore.fetchAll().catch(notifyApiError).finally(() => { industriesLoading.value = false })
  companySizesLoading.value = true
  companySizeOptionsStore.fetchAll().catch(notifyApiError).finally(() => { companySizesLoading.value = false })
  revenueSizesLoading.value = true
  revenueSizeOptionsStore.fetchAll().catch(notifyApiError).finally(() => { revenueSizesLoading.value = false })
  jobTitlesLoading.value = true
  jobTitleOptionsStore.fetchAll().catch(notifyApiError).finally(() => { jobTitlesLoading.value = false })
  productCategoriesLoading.value = true
  productCategoryOptionsStore.fetchAll().catch(notifyApiError).finally(() => { productCategoriesLoading.value = false })
  try {
    const settings = await appSettingsStore.fetchAll()
    salesQuotaForm.quarterly_sales_target = settings.quarterly_sales_target
    salesQuotaForm.annual_revenue_goal = settings.annual_revenue_goal
    salesQuotaForm.lead_scoring_mql_threshold = settings.lead_scoring_mql_threshold
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
  () => ({ quarterly_sales_target: 0, annual_revenue_goal: 0, lead_scoring_mql_threshold: 0 }),
)

const onSubmitSalesQuota = guardSalesQuota(async () => {
  try {
    await appSettingsStore.update({
      quarterly_sales_target: salesQuotaForm.quarterly_sales_target,
      annual_revenue_goal: salesQuotaForm.annual_revenue_goal,
      lead_scoring_mql_threshold: salesQuotaForm.lead_scoring_mql_threshold,
    })
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
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.pipelineConfig.deactivate'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

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
  periodBadge: (target.year === currentPeriod.value.year && target.quarter === currentPeriod.value.quarter)
    ? toBadge(t('admin.pipelineConfig.salesTargets.currentBadge'), 'success')
    : (target.year > currentPeriod.value.year || (target.year === currentPeriod.value.year && target.quarter > currentPeriod.value.quarter))
      ? toBadge(t('admin.pipelineConfig.salesTargets.upcomingBadge'), 'info')
      : toBadge(t('admin.pipelineConfig.salesTargets.pastBadge')),
})))

const targetColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.salesTargets.columns.period'), align: 'left', field: 'quarterLabel' },
  { label: t('admin.pipelineConfig.salesTargets.columns.targetValue'), align: 'left', field: 'target_value' },
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

// ── Workflow Notification Rules (FR-CRM-100/101/102) ──────────────

const ruleModalOpen = ref(false)
const editingRule = ref<NotificationRule | null>(null)

const openAddRule = () => {
  editingRule.value = null
  ruleModalOpen.value = true
}
const onEditRule = (row: NotificationRule) => {
  editingRule.value = notificationRulesStore.items.find(r => r.id === row.id) || null
  ruleModalOpen.value = true
}

const onSubmitRule = async (payload: { name: string, entity_type: NotificationEntityType, threshold_days: number, recipient_role: NotificationRecipientRole, is_active: boolean }) => {
  try {
    if (editingRule.value) {
      await notificationRulesStore.update(editingRule.value.id, payload)
    } else {
      await notificationRulesStore.add(payload)
    }
    success(t('admin.pipelineConfig.notificationRules.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateRuleOpen, target: ruleTarget, requestDelete: requestDeactivateRule, closeDelete: closeDeactivateRule } = useDeleteConfirm<NotificationRule>()
const confirmDeactivateRule = async () => {
  if (ruleTarget.value) {
    try {
      await notificationRulesStore.remove(ruleTarget.value.id)
      success(t('admin.pipelineConfig.notificationRules.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateRule()
}

// recipient_role's snake_case value doesn't match its camelCase i18n key
// (owner_and_managers -> ownerAndManagers), so that one still needs a lookup
// table; entity_type's values (deal/quote/contract) already match their i18n
// keys exactly, so no equivalent map is needed there.
const RULE_RECIPIENT_ROLE_LABEL_KEY: Record<NotificationRecipientRole, string> = {
  owner: 'owner',
  owner_and_managers: 'ownerAndManagers',
}

const ruleRows = computed(() => notificationRulesStore.items.map(rule => ({
  ...rule,
  entityTypeLabel: t(`admin.pipelineConfig.notificationRules.entityTypeOptions.${rule.entity_type}`),
  recipientRoleLabel: t(`admin.pipelineConfig.notificationRules.recipientRoleOptions.${RULE_RECIPIENT_ROLE_LABEL_KEY[rule.recipient_role]}`),
  statusBadge: rule.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const ruleColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.notificationRules.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.notificationRules.columns.entityType'), align: 'left', field: 'entityTypeLabel' },
  { label: t('admin.pipelineConfig.notificationRules.columns.thresholdDays'), align: 'left', field: 'threshold_days' },
  { label: t('admin.pipelineConfig.notificationRules.columns.recipientRole'), align: 'left', field: 'recipientRoleLabel' },
  { label: t('admin.pipelineConfig.notificationRules.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.notificationRules.columns.action'),
    align: 'left',
    field: 'action',
    type: TABLE_CARD_TYPE.ACTION,
    actions: [
      { label: t('admin.pipelineConfig.edit'), emitName: 'edit', isBorderBottom: true },
      { label: t('admin.pipelineConfig.deactivate'), emitName: 'delete', isBorderBottom: false },
    ],
  },
]

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

// ── Product Category options ──────────────────────────────────────

const productCategoryModalOpen = ref(false)
const editingProductCategory = ref<ProductCategoryOption | null>(null)

const openAddProductCategory = () => {
  editingProductCategory.value = null
  productCategoryModalOpen.value = true
}
const onEditProductCategory = (row: ProductCategoryOption) => {
  editingProductCategory.value = productCategoryOptionsStore.items.find(c => c.id === row.id) || null
  productCategoryModalOpen.value = true
}

const onSubmitProductCategory = async (payload: { name: string, is_active: boolean }) => {
  try {
    if (editingProductCategory.value) {
      await productCategoryOptionsStore.update(editingProductCategory.value.id, payload)
    } else {
      await productCategoryOptionsStore.add(payload)
    }
    success(t('admin.pipelineConfig.productCategories.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const { open: deactivateProductCategoryOpen, target: productCategoryTarget, requestDelete: requestDeactivateProductCategory, closeDelete: closeDeactivateProductCategory } = useDeleteConfirm<ProductCategoryOption>()
const confirmDeactivateProductCategory = async () => {
  if (productCategoryTarget.value) {
    try {
      await productCategoryOptionsStore.remove(productCategoryTarget.value.id)
      success(t('admin.pipelineConfig.productCategories.deactivateSuccess'))
    } catch (err) {
      error(getApiErrorMessage(err, t('global.genericError')))
    }
  }
  closeDeactivateProductCategory()
}

const productCategoryRows = computed(() => productCategoryOptionsStore.items.map(category => ({
  ...category,
  statusBadge: category.is_active
    ? toBadge(t('admin.pipelineConfig.statusActive'), 'success')
    : toBadge(t('admin.pipelineConfig.statusInactive')),
})))

const productCategoryColumns: TableDataColumn[] = [
  { label: t('admin.pipelineConfig.productCategories.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.productCategories.columns.status'), align: 'left', field: 'statusBadge', type: TABLE_CARD_TYPE.STATUS },
  {
    label: t('admin.pipelineConfig.productCategories.columns.action'),
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
