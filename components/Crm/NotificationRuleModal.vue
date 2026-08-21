<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ rule ? t('admin.pipelineConfig.notificationRules.editTitle') : t('admin.pipelineConfig.notificationRules.addTitle') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('admin.pipelineConfig.notificationRules.name')" name="name" rules="required" />
          <InputSelect v-model="form.entity_type" :label="t('admin.pipelineConfig.notificationRules.entityType')" name="entity_type" :options="entityTypeOptions" rules="required" />
          <InputText v-model.number="form.threshold_days" type="number" :label="t('admin.pipelineConfig.notificationRules.thresholdDays')" name="threshold_days" rules="required|min_value:1" />
          <InputSelect v-model="form.recipient_role" :label="t('admin.pipelineConfig.notificationRules.recipientRole')" name="recipient_role" :options="recipientRoleOptions" rules="required" />
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
  submit: [payload: { name: string, entity_type: NotificationEntityType, threshold_days: number, recipient_role: NotificationRecipientRole, is_active: boolean }]
}>()

// Small closed set (mirrors the backend's NotificationRule.EntityType
// validation) — not worth an Admin-configurable list of its own.
const entityTypeOptions: Select[] = [
  { label: t('admin.pipelineConfig.notificationRules.entityTypeOptions.deal'), value: 'deal' },
  { label: t('admin.pipelineConfig.notificationRules.entityTypeOptions.quote'), value: 'quote' },
  { label: t('admin.pipelineConfig.notificationRules.entityTypeOptions.contract'), value: 'contract' },
]

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
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  emit('submit', { ...form })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
