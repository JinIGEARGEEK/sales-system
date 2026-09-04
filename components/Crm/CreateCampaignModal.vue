<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.createCampaignModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef">
        <div class="grid grid-cols-1 gap-3">
          <p class="text-sm text-[var(--color-gray)]">
            {{ t('crm.components.createCampaignModal.description', { count: companyCount }) }}
          </p>
          <InputText
            v-model="form.name"
            :label="t('crm.components.createCampaignModal.campaignName')"
            :placeholder="t('crm.components.createCampaignModal.campaignNamePlaceholder')"
            name="name"
            rules="required"
            data-cy="campaign-name-input"
          />
          <InputText v-model="form.title" :label="t('crm.components.addTaskModal.taskTitle')" name="title" rules="required" data-cy="campaign-task-title-input" />
          <InputTextarea v-model="form.description" :label="t('crm.components.addTaskModal.description')" name="description" data-cy="campaign-task-description-input" />
          <InputSelect v-model="form.priority" :options="TASK_PRIORITY_OPTIONS" :label="t('crm.components.addTaskModal.priority')" name="priority" rules="required" data-cy="campaign-task-priority-select" />
          <InputDatePicker v-model="form.due_date" :label="t('crm.components.addTaskModal.dueDate')" name="due_date" rules="required" data-cy="campaign-task-due-date-input" />
          <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.createCampaignModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.createCampaignModal.save')" data-cy="campaign-save-button" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_PRIORITY_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  // Count of currently-selected Companies this campaign's Tasks will be
  // created against — display only, the actual ids are held by the caller
  // (Companies list page) and passed back via 'submit' being handled there.
  companyCount: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }]
}>()

const emptyForm = () => ({
  name: '',
  title: '',
  description: '',
  due_date: '',
  priority: 'medium' as TaskPriority,
  assigned_to: '',
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = () => {
  emit('submit', {
    name: form.name,
    title: form.title,
    description: form.description,
    due_date: new Date(form.due_date),
    priority: form.priority as TaskPriority,
    assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
  })
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
