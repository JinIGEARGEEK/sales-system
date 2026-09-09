<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ stage ? t('admin.pipelineConfig.prospectStages.editTitle') : t('admin.pipelineConfig.prospectStages.addTitle') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('admin.pipelineConfig.prospectStages.name')" name="name" rules="required" />
          <InputText v-model.number="form.sort_order" type="number" :label="t('admin.pipelineConfig.prospectStages.sortOrder')" name="sort_order" rules="required" />
          <div class="flex flex-col gap-2">
            <UCheckbox v-model="form.is_disqualified_stage" :label="t('admin.pipelineConfig.prospectStages.isDisqualifiedStage')" />
            <UCheckbox v-model="form.is_active" :label="t('admin.pipelineConfig.stages.isActive')" />
          </div>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('admin.pipelineConfig.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('admin.pipelineConfig.save')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { error } = useNotify()

const props = defineProps<{
  open: boolean
  // Passing an existing ProspectStage switches this into edit mode.
  stage?: ProspectStage | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, sort_order: number, is_active: boolean, is_disqualified_stage: boolean }]
}>()

const emptyForm = () => ({
  name: props.stage?.name ?? '',
  sort_order: props.stage?.sort_order ?? 0,
  is_active: props.stage?.is_active ?? true,
  is_disqualified_stage: props.stage?.is_disqualified_stage ?? false,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// "Converted" is a reserved, system-set stage (see ProspectStage's own doc)
// — the backend rejects it too, but catching it here avoids a round trip
// for a mistake that's cheap to catch client-side.
const onSubmit = guard(async () => {
  if (form.name.trim() === 'Converted') {
    error(t('admin.pipelineConfig.prospectStages.reservedNameError'))
    return
  }
  emit('submit', { ...form })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
