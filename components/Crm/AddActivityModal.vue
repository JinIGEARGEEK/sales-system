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
          <template v-if="canCreateFollowUp">
            <UCheckbox v-model="form.follow_up" :label="t('crm.components.addActivityModal.createFollowUp')" data-cy="activity-follow-up-toggle" />
            <div v-if="form.follow_up" class="grid grid-cols-1 gap-3 rounded-md border border-(--color-card-border) p-3" data-cy="activity-follow-up-fields">
              <InputText v-model="form.follow_up_title" :label="t('crm.components.addActivityModal.followUpTitle')" name="follow_up_title" rules="required" />
              <InputDatePicker v-model="form.follow_up_due_date" :label="t('crm.components.addActivityModal.followUpDueDate')" name="follow_up_due_date" rules="required" />
            </div>
          </template>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addActivityModal.cancel')" cancel data-cy="activity-cancel" @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addActivityModal.save')" :loading="loading" data-cy="activity-save" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TASK_ROLES } from '~/constants/roles'

const { t } = useI18n()
const { activityTypeOptions } = useActivityTypeMeta()
const { toDateInputValue } = useFormatter()
const { hasRole } = useRole()

// Offered to whoever can work Tasks. Every ActivityRelatedType is also a
// TaskRelatedType (the two are the same union in interfaces/crm.d.ts), so
// the follow-up can always attach to the activity's own record.
const canCreateFollowUp = computed(() => hasRole(...TASK_ROLES))
const FOLLOW_UP_DUE_DAYS = 3
const followUpTitleFor = (subject: string) => t('crm.components.addActivityModal.followUpTitleDefault', { subject: subject.trim() })

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
  // Prefills the Relates-to picker (still changeable) — Quick Add passes
  // the record the user is looking at or acting on (useQuickAdd).
  defaultRelatedType?: ActivityRelatedType | null
  defaultRelatedId?: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [activity: ActivityFormSubmit]
}>()

const emptyForm = () => ({
  type: 'call' as ActivityType,
  subject: '',
  notes: '',
  // Defaults to today — logging with today's date is the common case
  // (including "mark as contacted now" from the Company page), backdating
  // is just picking an earlier date here.
  date: toDateInputValue(new Date()),
  related_type: (props.defaultRelatedType ?? '') as ActivityRelatedType | '',
  related_id: props.defaultRelatedId ? String(props.defaultRelatedId) : '',
  follow_up: false,
  follow_up_title: followUpTitleFor(''),
  follow_up_due_date: toDateInputValue(addDays(new Date(), FOLLOW_UP_DUE_DAYS)),
})

const { form, formRef, validateThenSubmit, loading, guard, guardDismiss } = useModalForm(() => props.open, emptyForm)

// The follow-up title tracks the subject ("Follow up: <subject>") until the
// user types their own title.
watch(() => form.subject, (subject, previous) => {
  if (form.follow_up_title === followUpTitleFor(previous ?? '')) form.follow_up_title = followUpTitleFor(subject)
})

const onUpdateOpen = guardDismiss((value: boolean) => emit('update:open', value))

// A date input only carries a calendar day, and `new Date('YYYY-MM-DD')` is
// 00:00 UTC — 07:00 in Bangkok — so every activity used to show 07:00.
// Today's date means "just now", so it gets the current time; a backdated
// day gets local noon (dateOnlyToLocalNoon), "sometime that day".
const toCreatedAt = (value: string) =>
  (value === toDateInputValue(new Date()) ? new Date() : dateOnlyToLocalNoon(value)).toISOString()

// Awaits the caller's save: Save spins until it lands, the guard turns away
// a second click, and the dialog stays open (form intact) if the handler
// resolves `false` or throws.
const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false))
const onSubmit = guard(async () => {
  await submitAndClose({
    type: form.type,
    subject: form.subject,
    notes: form.notes,
    created_at: toCreatedAt(form.date),
    ...(props.showRelatedPicker
      ? { related_type: form.related_type as ActivityRelatedType, related_id: Number(form.related_id) }
      : {}),
    ...(canCreateFollowUp.value && form.follow_up
      ? { followUp: { title: form.follow_up_title.trim(), due_date: new Date(form.follow_up_due_date) } }
      : {}),
  })
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
