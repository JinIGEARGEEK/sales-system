<template>
  <UModal :open="open" :title="t('crm.components.addActivityModal.title')" @update:open="onUpdateOpen">
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <CrmRelatedRecordPicker
            v-if="showRelatedPicker"
            v-model:form="form"
            :type-label="t('crm.components.addActivityModal.relatesToType')"
            :type-placeholder="t('crm.components.addActivityModal.relatesToTypePlaceholder')"
            :record-label="t('crm.components.addActivityModal.relatesToRecord')"
            :record-placeholder="t('crm.components.addActivityModal.relatesToRecordPlaceholder')"
            :company-record-placeholder="t('crm.components.addActivityModal.relatesToCompanyPlaceholder')"
          />
          <InputSelect v-model="form.type" :options="activityTypeOptions" :label="t('crm.components.addActivityModal.type')" name="type" rules="required" />
          <InputText v-model="form.subject" :label="t('crm.components.addActivityModal.subject')" name="subject" rules="required" />
          <InputTextarea v-model="form.notes" :label="t('crm.components.addActivityModal.notes')" name="notes" />
          <InputDatePicker v-model="form.date" :label="t('crm.components.addActivityModal.date')" name="date" rules="required" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addActivityModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addActivityModal.save')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { activityTypeOptions } = useActivityTypeMeta()
const { toDateInputValue } = useFormatter()

const props = defineProps<{
  open: boolean
  // When true, shows a "Relates to" type + record picker and includes
  // related_type/related_id in the emitted payload — used only by the
  // all-activities page (/crm/activities), which has no single record
  // already in context the way the Deal/Contact/Company detail pages' own
  // Activity sections do (those fix relatedType/relatedId via
  // useActivityList and never pass this) — mirrors AddTaskModal's own
  // showRelatedPicker.
  showRelatedPicker?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [activity: { type: ActivityType, subject: string, notes: string, created_at?: string, related_type?: ActivityRelatedType, related_id?: number }]
}>()

const emptyForm = () => ({
  type: 'call' as ActivityType,
  subject: '',
  notes: '',
  // Defaults to today — logging with today's date is the common case
  // (including "mark as contacted now" from the Company page), backdating
  // is just picking an earlier date here.
  date: toDateInputValue(new Date()),
  related_type: '' as ActivityRelatedType | '',
  related_id: '',
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// A date input only carries a calendar day, and `new Date('YYYY-MM-DD')` is
// 00:00 UTC — 07:00 in Bangkok — so every activity used to show 07:00.
// Today's date means "just now", so it gets the current time; a backdated
// day gets local noon, which reads as "sometime that day" and can't slip to
// a neighbouring day in any timezone within ±12h.
const toCreatedAt = (value: string) => {
  if (value === toDateInputValue(new Date())) return new Date().toISOString()
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year!, month! - 1, day!, 12).toISOString()
}

// Awaits the caller's save: Save spins until it lands, the guard turns away
// a second click, and the dialog stays open (form intact) if the handler
// resolves `false` or throws.
const emitSubmit = useAwaitableEmit('submit')
const onSubmit = guard(async () => {
  const results = await emitSubmit({
    type: form.type,
    subject: form.subject,
    notes: form.notes,
    created_at: toCreatedAt(form.date),
    ...(props.showRelatedPicker
      ? { related_type: form.related_type as ActivityRelatedType, related_id: Number(form.related_id) }
      : {}),
  })
  if (!results.includes(false)) onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
