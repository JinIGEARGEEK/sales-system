<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.addActivityModal.title') }}</h3>
    </template>
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
          />
          <InputSelect v-model="form.type" :options="ACTIVITY_TYPE_OPTIONS" :label="t('crm.components.addActivityModal.type')" name="type" rules="required" />
          <InputText v-model="form.subject" :label="t('crm.components.addActivityModal.subject')" name="subject" rules="required" />
          <InputTextarea v-model="form.notes" :label="t('crm.components.addActivityModal.notes')" name="notes" />
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
import { ACTIVITY_TYPE_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

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
  submit: [activity: { type: ActivityType, subject: string, notes: string, related_type?: ActivityRelatedType, related_id?: number }]
}>()

const emptyForm = () => ({
  type: 'call' as ActivityType,
  subject: '',
  notes: '',
  related_type: '' as ActivityRelatedType | '',
  related_id: '',
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  emit('submit', {
    type: form.type,
    subject: form.subject,
    notes: form.notes,
    ...(props.showRelatedPicker
      ? { related_type: form.related_type as ActivityRelatedType, related_id: Number(form.related_id) }
      : {}),
  })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
