<template>
  <UModal :open="open" :title="task ? t('crm.components.addTaskModal.editTitle') : t('crm.components.addTaskModal.title')" @update:open="onUpdateOpen">
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
            :company-record-placeholder="t('crm.components.addTaskModal.relatesToCompanyPlaceholder')"
          />
          <InputText v-model="form.title" :label="t('crm.components.addTaskModal.taskTitle')" name="title" rules="required" />
          <InputTextarea v-model="form.description" :label="t('crm.components.addTaskModal.description')" name="description" />
          <InputSelect v-model="form.priority" :options="TASK_PRIORITY_OPTIONS" :label="t('crm.components.addTaskModal.priority')" name="priority" rules="required" />
          <InputDatePicker v-model="form.due_date" :label="t('crm.components.addTaskModal.dueDate')" name="due_date" rules="required" />
          <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" for-task />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addTaskModal.cancel')" cancel data-cy="task-cancel" @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addTaskModal.save')" :loading="loading" data-cy="task-save" @click="onSave" />
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
  // Prefills the Relates-to picker in add mode (still changeable) — Quick
  // Add passes the record the user is looking at or acting on (useQuickAdd).
  defaultRelatedType?: TaskRelatedType | null
  defaultRelatedId?: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [task: { title: string, description: string, due_date: Date, priority: CrmTaskPriority, assigned_to: number | null, related_type?: TaskRelatedType, related_id?: number }]
  update: [task: { title: string, description: string, due_date: Date, priority: CrmTaskPriority, assigned_to: number | null }]
}>()

const emptyForm = () => ({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  due_date: props.task?.due_date ? toDateInputValue(props.task.due_date) : '',
  priority: props.task?.priority ?? ('medium' as CrmTaskPriority),
  assigned_to: props.task?.assigned_to ? String(props.task.assigned_to) : '',
  related_type: (props.defaultRelatedType ?? '') as TaskRelatedType | '',
  related_id: props.defaultRelatedId ? String(props.defaultRelatedId) : '',
})

const { form, formRef, validateThenSubmit, showApiFieldErrors, loading, guard, guardDismiss } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = guardDismiss((value: boolean) => emit('update:open', value))

// Awaits the caller's save, so `loading` spins Save until it lands, the
// guard turns away a second click meanwhile, and a failed save (handler
// resolves `false`/submitFailure() or throws) keeps the dialog open — a
// submitFailure's 422 fields also land on the matching inputs.
const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false), 'submit', showApiFieldErrors)
const updateAndClose = useAwaitableSubmit(() => onUpdateOpen(false), 'update', showApiFieldErrors)
const onSubmit = guard(async () => {
  const shared = {
    title: form.title,
    description: form.description,
    due_date: new Date(form.due_date),
    priority: form.priority as CrmTaskPriority,
    assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
  }
  // A handler resolves `false` when its save failed (it has already shown
  // the error), so the dialog stays open with the form intact.
  if (props.task) {
    await updateAndClose(shared)
  } else {
    await submitAndClose({
      ...shared,
      ...(props.showRelatedPicker
        ? { related_type: form.related_type as TaskRelatedType, related_id: Number(form.related_id) }
        : {}),
    })
  }
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
