<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.addTaskModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef">
        <div class="grid grid-cols-1 gap-3">
          <template v-if="showRelatedPicker">
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
              :disable="!form.related_type"
              rules="required"
            />
          </template>
          <InputText v-model="form.title" :label="t('crm.components.addTaskModal.taskTitle')" name="title" rules="required" />
          <div>
            <InputDatePicker v-model="form.due_date" :label="t('crm.components.addTaskModal.dueDate')" name="due_date" rules="required" />
            <div class="mt-1.5 flex gap-1.5">
              <UButton
                v-for="preset in DUE_DATE_PRESETS"
                :key="preset.days"
                :label="t(`crm.components.addTaskModal.${preset.labelKey}`)"
                size="xs"
                variant="outline"
                color="neutral"
                @click="applyDueDatePreset(preset.days)"
              />
            </div>
          </div>
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

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  // When true, shows a "Relates to" type + record picker and includes
  // related_type/related_id in the emitted payload — used only by the
  // all-tasks page (/crm/tasks), which has no single record already in
  // context the way the Deal/Contact/Company detail pages' Tasks tabs do
  // (those fix relatedType/relatedId via useTaskList and never pass this).
  showRelatedPicker?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [task: { title: string, due_date: Date, assigned_to: number | null, related_type?: TaskRelatedType, related_id?: number }]
}>()

const DUE_DATE_PRESETS = [
  { labelKey: 'dueToday', days: 0 },
  { labelKey: 'dueTomorrow', days: 1 },
  { labelKey: 'dueNextWeek', days: 7 },
]

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

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10)

const applyDueDatePreset = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  form.due_date = toDateInputValue(date)
}

const emptyForm = () => ({
  title: '',
  due_date: '',
  assigned_to: '',
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
  emit('submit', {
    title: form.title,
    due_date: new Date(form.due_date),
    assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
    ...(props.showRelatedPicker
      ? { related_type: form.related_type as TaskRelatedType, related_id: Number(form.related_id) }
      : {}),
  })
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
