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
            <InputCompanySelect
              v-if="form.related_type === 'company'"
              v-model="relatedRecordId"
              :label="t('crm.components.addTaskModal.relatesToRecord')"
              :placeholder="t('crm.components.addTaskModal.relatesToRecordPlaceholder')"
              name="related_id"
              rules="required"
            />
            <InputAsyncSelect
              v-else-if="form.related_type === 'deal'"
              v-model="relatedRecordId"
              :search="searchDeals"
              :resolve-selected="resolveDeal"
              :label="t('crm.components.addTaskModal.relatesToRecord')"
              :placeholder="t('crm.components.addTaskModal.relatesToRecordPlaceholder')"
              name="related_id"
              rules="required"
            />
            <InputAsyncSelect
              v-else-if="form.related_type === 'contact'"
              v-model="relatedRecordId"
              :search="searchContacts"
              :resolve-selected="resolveContact"
              :label="t('crm.components.addTaskModal.relatesToRecord')"
              :placeholder="t('crm.components.addTaskModal.relatesToRecordPlaceholder')"
              name="related_id"
              rules="required"
            />
            <InputAsyncSelect
              v-else-if="form.related_type === 'prospect'"
              v-model="relatedRecordId"
              :search="searchProspects"
              :resolve-selected="resolveProspect"
              :label="t('crm.components.addTaskModal.relatesToRecord')"
              :placeholder="t('crm.components.addTaskModal.relatesToRecordPlaceholder')"
              name="related_id"
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
  { label: 'Prospect', value: 'prospect' },
]

// None of Deal/Contact/Company/Prospect are preloaded here anymore — each
// branch above searches the server as the rep types instead of filtering a
// capped preloaded list (fetchAll() is capped at 200 rows, newest-first, and
// can miss an older record entirely — see stores/companies.ts's fetchAll doc
// for the full explanation).
const dealsStore = useDealsStore()
const contactsStore = useContactsStore()
const prospectsStore = useProspectsStore()

// Deal/Contact/Prospect's search+resolve pair for InputAsyncSelect were
// three near-identical copies of "fetchList → map to {label, value}" /
// "fetchOne → {label, value}", differing only in which store and which
// field is the label. Factored into one helper — Company doesn't need this
// (InputCompanySelect above already owns its own combobox-with-create
// behavior, not a plain async select).
function useAsyncRecordPicker<T extends { id: number }> (
  fetchList: (params: { search?: string, per_page: number, sort: string }) => Promise<{ items: T[] }>,
  fetchOne: (id: number) => Promise<T>,
  labelOf: (item: T) => string,
  sortField: string,
) {
  const search = async (term: string): Promise<Select[]> => {
    const { items } = await fetchList({ search: term || undefined, per_page: 20, sort: sortField })
    return items.map(item => ({ label: labelOf(item), value: item.id }))
  }
  const resolve = async (id: number): Promise<Select | null> => {
    const item = await fetchOne(id)
    return { label: labelOf(item), value: item.id }
  }
  return { search, resolve }
}

const { search: searchDeals, resolve: resolveDeal } = useAsyncRecordPicker(dealsStore.fetchList, dealsStore.fetchOne, d => d.title, 'title')
const { search: searchContacts, resolve: resolveContact } = useAsyncRecordPicker(contactsStore.fetchList, contactsStore.fetchOne, c => c.name, 'name')
const { search: searchProspects, resolve: resolveProspect } = useAsyncRecordPicker(prospectsStore.fetchList, prospectsStore.fetchOne, p => p.name, 'name')

// Every branch above resolves to a number, but form.related_id stays a plain
// string — this proxy is the one place that converts between the two, so
// submit's Number(form.related_id) keeps working unchanged regardless of
// which related_type was picked.
const relatedRecordId = computed<number | null>({
  get: () => form.related_id ? Number(form.related_id) : null,
  set: value => { form.related_id = value ? String(value) : '' },
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
