<template>
  <UCard class="mb-4" :ui="GLASS_PANEL_UI">
    <template #header>
      <h3 class="text-base font-semibold">{{ t('admin.pipelineConfig.salesQuota.heading') }}</h3>
    </template>

    <Form ref="salesQuotaFormRef" @submit="onSubmitSalesQuota">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <InputText
          v-model.number="salesQuotaForm.quarterly_sales_target"
          thousands
          :label="t('admin.pipelineConfig.salesQuota.label')"
          name="quarterly_sales_target"
          rules="required"
          class="flex-1"
        />
        <InputText
          v-model.number="salesQuotaForm.annual_revenue_goal"
          thousands
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
        >
          <template #label-suffix>
            <UTooltip
              :text="t('admin.pipelineConfig.salesQuota.mqlThresholdHelp')"
              :content="{ side: 'top' }"
              :open="mqlThresholdTooltipOpen"
              @update:open="mqlThresholdTooltipOpen = $event"
            >
              <UIcon
                name="material-symbols:info-outline"
                class="ml-1 size-3 shrink-0 cursor-pointer align-middle text-[var(--color-gray)]"
                @click="mqlThresholdTooltipOpen = !mqlThresholdTooltipOpen"
              />
            </UTooltip>
          </template>
        </InputText>
        <ButtonPrimary :label="t('admin.pipelineConfig.salesQuota.save')" fit-content :loading="salesQuotaLoading" @click="onSaveSalesQuota" />
      </div>

      <!-- FR-CRM-045 — a Deal-stage policy, not a revenue figure, but
      shares this same AppSettings singleton/save flow rather than
      standing up a second Form+submit for one checkbox. -->
      <div class="mt-4 border-t border-[var(--color-light-gray-2)] pt-4">
        <UCheckbox
          v-model="salesQuotaForm.require_signed_contract_before_won"
          :label="t('admin.pipelineConfig.salesQuota.requireSignedContractLabel')"
        />
        <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesQuota.requireSignedContractHelp') }}</p>
      </div>
    </Form>
    <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesQuota.help') }}</p>
    <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesQuota.annualGoalHelp') }}</p>
    <p class="mt-1 text-xs text-[var(--color-gray)]">{{ t('admin.pipelineConfig.salesQuota.mqlThresholdHelp') }}</p>
    <p v-if="salesQuotaUpdatedAt" class="mt-2 text-xs text-[var(--color-gray)]">
      {{ t('admin.pipelineConfig.salesQuota.lastUpdated', { date: dateTimeFormat(salesQuotaUpdatedAt) }) }}
    </p>
  </UCard>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GLASS_PANEL_UI } from '~/constants/ui'

const { t } = useI18n()
const { success, error } = useNotify()
const { dateTimeFormat } = useFormatter()
const appSettingsStore = useAppSettingsStore()
const { settings: appSettings } = storeToRefs(appSettingsStore)
// Neither the quarterly quota nor the annual goal resets itself on a new
// quarter/year — surfacing when it was last touched is the cheapest guard
// against a stale figure (e.g. last year's annual goal still sitting there
// in February) going unnoticed. Reactive off the store so it updates the
// instant a save succeeds, not just on the next page load.
const salesQuotaUpdatedAt = computed(() => appSettings.value?.updated_at ?? null)

// UTooltip is hover/focus-only by default (reka-ui TooltipRoot) — controlling
// `open` ourselves lets a click toggle it too, on top of the normal hover
// behavior (hovering still fires update:open the same way).
const mqlThresholdTooltipOpen = ref(false)

// ── Sales quota ──────────────────────────────────────────────────

// Not a modal (no "reset on reopen" behavior needed here), but reuses
// useModalForm's formRef typing + validateThenSubmit dance rather than
// re-declaring the same ref<{ validate }> boilerplate — isOpen is a
// constant `false` since the initial value is set once via the store watch
// below (populated once the page's guardMounted fetch resolves).
const { form: salesQuotaForm, formRef: salesQuotaFormRef, validateThenSubmit, loading: salesQuotaLoading, guard: guardSalesQuota } = useModalForm(
  () => false,
  () => ({ quarterly_sales_target: 0, annual_revenue_goal: 0, lead_scoring_mql_threshold: 0, require_signed_contract_before_won: false }),
)

// The page (thin orchestrator) triggers appSettingsStore.fetchAll() as part
// of its shared guardMounted data-fetch — this just reacts to the store's
// settings landing (or already being present, e.g. re-mount after a tab
// switch) to seed the form, mirroring the previous one-shot post-await copy.
watch(appSettings, (settings) => {
  if (!settings) return
  salesQuotaForm.quarterly_sales_target = settings.quarterly_sales_target
  salesQuotaForm.annual_revenue_goal = settings.annual_revenue_goal
  salesQuotaForm.lead_scoring_mql_threshold = settings.lead_scoring_mql_threshold
  salesQuotaForm.require_signed_contract_before_won = settings.require_signed_contract_before_won
}, { immediate: true })

const onSubmitSalesQuota = guardSalesQuota(async () => {
  try {
    await appSettingsStore.update({
      quarterly_sales_target: salesQuotaForm.quarterly_sales_target,
      annual_revenue_goal: salesQuotaForm.annual_revenue_goal,
      lead_scoring_mql_threshold: salesQuotaForm.lead_scoring_mql_threshold,
      require_signed_contract_before_won: salesQuotaForm.require_signed_contract_before_won,
    })
    success(t('admin.pipelineConfig.salesQuota.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
const onSaveSalesQuota = () => validateThenSubmit(onSubmitSalesQuota)
</script>
