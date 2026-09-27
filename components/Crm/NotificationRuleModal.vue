<template>
  <UModal :open="open" :title="rule ? t('admin.pipelineConfig.notificationRules.editTitle') : t('admin.pipelineConfig.notificationRules.addTitle')" @update:open="onUpdateOpen">
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('admin.pipelineConfig.notificationRules.name')" name="name" rules="required" />
          <div>
            <InputSelect
              v-model="form.entity_type"
              :label="t('admin.pipelineConfig.notificationRules.entityType')"
              name="entity_type"
              :options="entityTypeOptions"
              rules="required"
              data-cy="notification-rule-entity-type"
            />
            <p v-if="entityTypeHelp(form.entity_type)" class="mt-1 text-xs text-(--color-gray)" data-cy="notification-rule-entity-help">
              {{ entityTypeHelp(form.entity_type) }}
            </p>
          </div>
          <InputText v-model.number="form.threshold_days" type="number" :label="t('admin.pipelineConfig.notificationRules.thresholdDays')" name="threshold_days" rules="required|min_value:1" />
          <InputSelect v-model="form.recipient_role" :label="t('admin.pipelineConfig.notificationRules.recipientRole')" name="recipient_role" :options="recipientRoleOptions" rules="required" />
          <UCheckbox
            v-model="form.create_task"
            :label="t('admin.pipelineConfig.notificationRules.createTask')"
            :description="t('admin.pipelineConfig.notificationRules.createTaskHint')"
            data-cy="notification-rule-create-task"
          />
          <UCheckbox v-if="rule" v-model="form.is_active" :label="t('admin.pipelineConfig.stages.isActive')" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('admin.pipelineConfig.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('admin.pipelineConfig.save')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  // Passing an existing NotificationRule switches this into edit mode.
  rule?: NotificationRule | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: NotificationRulePayload]
}>()

// Small closed set (mirrors the backend's NotificationRule.EntityType
// validation) — not worth an Admin-configurable list of its own.
const { entityTypeLabel, entityTypeHelp } = useNotificationEntityType()
const entityTypeOptions = computed<Select[]>(() => NOTIFICATION_ENTITY_TYPES.map(type => ({ label: entityTypeLabel(type), value: type })))

// Small closed set (mirrors the backend's NotificationRule.RecipientRole
// validation) — not worth an Admin-configurable list of its own.
const recipientRoleOptions: Select[] = [
  { label: t('admin.pipelineConfig.notificationRules.recipientRoleOptions.owner'), value: 'owner' },
  { label: t('admin.pipelineConfig.notificationRules.recipientRoleOptions.ownerAndManagers'), value: 'owner_and_managers' },
]

const emptyForm = () => ({
  name: props.rule?.name ?? '',
  entity_type: props.rule?.entity_type ?? 'deal' as NotificationEntityType,
  threshold_days: props.rule?.threshold_days ?? 0,
  recipient_role: props.rule?.recipient_role ?? 'owner' as NotificationRecipientRole,
  is_active: props.rule?.is_active ?? true,
  // Default on: Tasks (plus the dashboard's Recent Alerts) are the main alert
  // channel — email only goes out when SMTP is configured.
  create_task: props.rule?.create_task ?? true,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// Awaits the caller's save: Save spins until it lands, the guard turns away
// a second click, and the dialog stays open (form intact) if the handler
// resolves `false` or throws.
const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false))
const onSubmit = guard(async () => {
  await submitAndClose({ ...form })
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
