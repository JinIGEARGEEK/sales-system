<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ title || (project ? t('crm.components.addProjectModal.editTitle') : t('crm.components.addProjectModal.title')) }}</h3>
    </template>
    <template #body>
      <p v-if="description" class="mb-3 text-sm text-[var(--color-gray)]">{{ description }}</p>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputSelect
            v-if="companies && !project"
            v-model="form.company_id"
            :options="companyOptions"
            :label="t('crm.components.addProjectModal.company')"
            :placeholder="t('crm.components.addProjectModal.companyPlaceholder')"
            name="company_id"
            rules="required"
          />
          <InputText v-if="!productionEditor" v-model="form.name" :label="t('crm.components.addProjectModal.name')" name="name" rules="required" />
          <InputSelect v-model="form.status" :options="PROJECT_STATUS_OPTIONS" :label="t('crm.components.addProjectModal.status')" name="status" rules="required" />
          <InputText v-model="form.production_reference" :label="t('crm.components.addProjectModal.productionReference')" name="production_reference" />
          <InputDatePicker v-if="!productionEditor" v-model="form.target_end_date" :label="t('crm.components.addProjectModal.targetEndDate')" name="target_end_date" />
          <InputTextarea v-if="!productionEditor" v-model="form.notes" :label="t('crm.components.addProjectModal.notes')" name="notes" />
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
  // When set, a Company field is shown for a fresh create (e.g. the cross-company
  // Projects list, where there's no company already in context). Omitted entirely
  // in edit mode and wherever the parent already knows the company.
  companies?: { id: number, name: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { status: ProjectStatus, production_reference: string | null, name?: string, target_end_date?: Date | null, notes?: string, company_id?: number }]
}>()

const { hasRole } = useRole()
// Production's PATCH is rejected server-side (internal/handlers/projects.go's
// productionAllowedKeys) if the body contains anything beyond status/
// production_reference — so this role must never even see, let alone submit,
// the other fields on an edit.
const productionEditor = computed(() => hasRole('Production') && !!props.project)

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10)

const companyOptions = computed(() => (props.companies ?? []).map(c => ({ label: c.name, value: String(c.id) })))

const emptyForm = () => ({
  company_id: '',
  name: props.project?.name ?? props.defaultName ?? '',
  status: (props.project?.status ?? 'Not Started') as ProjectStatus,
  production_reference: props.project?.production_reference ?? '',
  target_end_date: props.project?.target_end_date ? toDateInputValue(props.project.target_end_date) : '',
  notes: props.project?.notes ?? '',
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = () => {
  if (productionEditor.value) {
    emit('submit', {
      status: form.status,
      production_reference: form.production_reference || null,
    })
    onUpdateOpen(false)
    return
  }

  emit('submit', {
    name: form.name,
    status: form.status,
    production_reference: form.production_reference || null,
    target_end_date: form.target_end_date ? new Date(form.target_end_date) : null,
    notes: form.notes,
    ...(props.companies && !props.project ? { company_id: Number(form.company_id) } : {}),
  })
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
