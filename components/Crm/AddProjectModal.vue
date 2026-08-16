<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ title || (project ? t('crm.components.addProjectModal.editTitle') : t('crm.components.addProjectModal.title')) }}</h3>
    </template>
    <template #body>
      <p v-if="description" class="mb-3 text-sm text-[var(--color-gray)]">{{ description }}</p>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('crm.components.addProjectModal.name')" name="name" rules="required" />
          <InputSelect v-model="form.status" :options="PROJECT_STATUS_OPTIONS" :label="t('crm.components.addProjectModal.status')" name="status" rules="required" />
          <InputDatePicker v-model="form.target_end_date" :label="t('crm.components.addProjectModal.targetEndDate')" name="target_end_date" />
          <InputTextarea v-model="form.notes" :label="t('crm.components.addProjectModal.notes')" name="notes" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addProjectModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addProjectModal.save')" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PROJECT_STATUS_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  // Passing an existing Project switches this into edit mode (prefilled fields,
  // "Update Project" title) — the parent decides add vs. update on submit based
  // on whether it's holding a project reference.
  project?: Project | null
  // Only used for a fresh create (e.g. pre-filling from the originating Deal's title).
  defaultName?: string
  // Optional context text shown above the form (e.g. explaining this project
  // links back to the Deal that's being marked Won).
  description?: string
  // Overrides the default "Add Project"/"Edit Project" header.
  title?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, status: ProjectStatus, target_end_date: Date | null, notes: string }]
}>()

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10)

const emptyForm = () => ({
  name: props.project?.name ?? props.defaultName ?? '',
  status: (props.project?.status ?? 'Not Started') as ProjectStatus,
  target_end_date: props.project?.target_end_date ? toDateInputValue(props.project.target_end_date) : '',
  notes: props.project?.notes ?? '',
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = () => {
  emit('submit', {
    name: form.name,
    status: form.status,
    target_end_date: form.target_end_date ? new Date(form.target_end_date) : null,
    notes: form.notes,
  })
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
