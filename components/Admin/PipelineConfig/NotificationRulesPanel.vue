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

    <p class="mb-3 text-xs text-(--color-gray)">{{ t('admin.pipelineConfig.notificationRules.help') }}</p>

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
const { activeBadge } = useActiveStatusBadge()
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

const onSubmitRule = async (payload: NotificationRulePayload) => {
  try {
    if (editingRule.value) {
      await notificationRulesStore.update(editingRule.value.id, payload)
    } else {
      await notificationRulesStore.add(payload)
    }
    success(t('admin.pipelineConfig.notificationRules.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
    return false
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

// recipient_role's and entity_type's snake_case values don't match their
// camelCase i18n keys (owner_and_managers -> ownerAndManagers,
// payment_installment -> paymentInstallment), so both go through a lookup
// (entity types via useNotificationEntityType).
const { entityTypeLabel } = useNotificationEntityType()
const RULE_RECIPIENT_ROLE_LABEL_KEY: Record<NotificationRecipientRole, string> = {
  owner: 'owner',
  owner_and_managers: 'ownerAndManagers',
}

const ruleRows = computed(() => notificationRulesStore.items.map(rule => ({
  ...rule,
  entityTypeLabel: entityTypeLabel(rule.entity_type),
  createTaskBadge: rule.create_task
    ? toBadge(t('admin.pipelineConfig.notificationRules.createTaskOn'), 'primary')
    : toBadge(t('admin.pipelineConfig.notificationRules.createTaskOff')),
  recipientRoleLabel: t(`admin.pipelineConfig.notificationRules.recipientRoleOptions.${RULE_RECIPIENT_ROLE_LABEL_KEY[rule.recipient_role]}`),
  statusBadge: activeBadge(rule.is_active, t('admin.pipelineConfig.statusActive'), t('admin.pipelineConfig.statusInactive')),
})))

const ruleColumns = computed<TableDataColumn[]>(() => [
  { label: t('admin.pipelineConfig.notificationRules.columns.name'), align: 'left', field: 'name' },
  { label: t('admin.pipelineConfig.notificationRules.columns.entityType'), align: 'left', field: 'entityTypeLabel' },
  { label: t('admin.pipelineConfig.notificationRules.columns.thresholdDays'), align: 'left', field: 'threshold_days' },
  { label: t('admin.pipelineConfig.notificationRules.columns.recipientRole'), align: 'left', field: 'recipientRoleLabel' },
  { label: t('admin.pipelineConfig.notificationRules.columns.createTask'), align: 'left', field: 'createTaskBadge', type: TABLE_CARD_TYPE.STATUS },
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
])
</script>
