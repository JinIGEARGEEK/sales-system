<template>
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
      :loading="loading"
      @edit="onEditRule"
      @delete="requestDeactivateRule"
    />
  </UCard>

  <CrmNotificationRuleModal
    v-model:open="ruleModalOpen"
    :rule="editingRule"
    @submit="onSubmitRule"
  />
  <CrmConfirmDeleteModal
    v-model:open="deactivateRuleOpen"
    :title="t('admin.pipelineConfig.deactivate')"
    :body="t('admin.pipelineConfig.notificationRules.deactivateConfirm')"
    :confirm-label="t('admin.pipelineConfig.deactivate')"
    confirm-color="warning"
    @confirm="confirmDeactivateRule"
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
const notificationRulesStore = useNotificationRulesStore()

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
</script>
