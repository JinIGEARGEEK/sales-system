<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ task ? t('crm.components.addTaskModal.editTitle') : t('crm.components.addTaskModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef">
        <div class="grid grid-cols-1 gap-3">
          <template v-if="showRelatedPicker && !task">
            <InputSelect
              v-model="form.related_type"
              :label="t('crm.components.addTaskModal.relatesToType')"
              :placeholder="t('crm.components.addTaskModal.relatesToTypePlaceholder')"
              name="related_type"
              :options="RELATED_TYPE_OPTIONS"
              rules="required"
            />
            <InputSelect
              v-model="form.related_id"
              :label="t('crm.components.addTaskModal.relatesToRecord')"
              :placeholder="t('crm.components.addTaskModal.relatesToRecordPlaceholder')"
              name="related_id"
              :options="relatedRecordOptions"
              :disable="!form.related_type || relatedRecordOptions.length === 0"
              rules="required"
            />
          </template>
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

// Plain hardcoded labels, matching this codebase's convention for
// enum-value option lists (e.g. PROJECT_STATUS_OPTIONS) — not localized.
const RELATED_TYPE_OPTIONS: Select[] = [
  { label: 'Deal', value: 'deal' },
  { label: 'Contact', value: 'contact' },
  { label: 'Company', value: 'company' },
]

// Only fetched when the picker is actually shown — the 3 detail-page call
// sites that don't pass showRelatedPicker have no reason to pull these.
const dealsStore = useDealsStore()
const contactsStore = useContactsStore()
const companiesStore = useCompaniesStore()
const { notifyApiError } = useApiErrorNotifier()

onMounted(() => {
  if (!props.showRelatedPicker) return
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
})

const relatedRecordOptions = computed<Select[]>(() => {
  if (form.related_type === 'deal') return dealsStore.items.map(d => ({ label: d.title, value: String(d.id) }))
  if (form.related_type === 'contact') return contactsStore.items.map(c => ({ label: c.name, value: String(c.id) }))
  if (form.related_type === 'company') return companiesStore.items.map(c => ({ label: c.name, value: String(c.id) }))
  return []
})

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

// A record picked before switching type would otherwise submit as e.g. a
// Deal id under related_type: 'contact' — clear it so the field always
// reflects only the currently-selected type's records.
watch(() => form.related_type, () => {
  form.related_id = ''
})

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
