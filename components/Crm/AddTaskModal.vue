<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ task ? t('crm.components.addTaskModal.editTitle') : t('crm.components.addTaskModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef">
        <div class="grid grid-cols-1 gap-3">
          <CrmRelatedRecordPicker
            v-if="showRelatedPicker && !task"
            v-model:form="form"
            :type-label="t('crm.components.addTaskModal.relatesToType')"
            :type-placeholder="t('crm.components.addTaskModal.relatesToTypePlaceholder')"
            :record-label="t('crm.components.addTaskModal.relatesToRecord')"
            :record-placeholder="t('crm.components.addTaskModal.relatesToRecordPlaceholder')"
          />
          <InputText v-model="form.title" :label="t('crm.components.addTaskModal.taskTitle')" name="title" rules="required" />
          <InputTextarea v-model="form.description" :label="t('crm.components.addTaskModal.description')" name="description" />
          <InputSelect v-model="form.priority" :options="TASK_PRIORITY_OPTIONS" :label="t('crm.components.addTaskModal.priority')" name="priority" rules="required" />
          <InputDatePicker v-model="form.due_date" :label="t('crm.components.addTaskModal.dueDate')" name="due_date" rules="required" />
          <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addTaskModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addTaskModal.save')" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_PRIORITY_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()
const { toDateInputValue } = useFormatter()

const props = defineProps<{
  open: boolean
  // Passing an existing Task switches this into edit mode (prefilled fields,
  // "Edit Task" title, hides the Relates-to picker since related_type/
  // related_id are immutable after creation) — the parent decides add vs.
  // update on submit based on whether it's holding a task reference, same
  // pattern as AddProjectModal's `project` prop.
  task?: Task | null
  // When true, shows a "Relates to" type + record picker and includes
  // related_type/related_id in the emitted payload — used only by the
  // all-tasks page (/crm/tasks), which has no single record already in
  // context the way the Deal/Contact/Company detail pages' Tasks tabs do
  // (those fix relatedType/relatedId via useTaskList and never pass this).
  // Never shown in edit mode regardless, since the relation can't change.
  showRelatedPicker?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [task: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null, related_type?: TaskRelatedType, related_id?: number }]
  update: [task: { title: string, description: string, due_date: Date, priority: TaskPriority, assigned_to: number | null }]
}>()

const emptyForm = () => ({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  due_date: props.task?.due_date ? toDateInputValue(props.task.due_date) : '',
  priority: props.task?.priority ?? ('medium' as TaskPriority),
  assigned_to: props.task?.assigned_to ? String(props.task.assigned_to) : '',
  related_type: '' as TaskRelatedType | '',
  related_id: '',
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = () => {
  const shared = {
    title: form.title,
    description: form.description,
    due_date: new Date(form.due_date),
    priority: form.priority as TaskPriority,
    assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
  }
  if (props.task) {
    emit('update', shared)
  } else {
    emit('submit', {
      ...shared,
      ...(props.showRelatedPicker
        ? { related_type: form.related_type as TaskRelatedType, related_id: Number(form.related_id) }
        : {}),
    })
  }
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
