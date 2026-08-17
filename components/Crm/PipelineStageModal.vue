<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ stage ? t('admin.pipelineConfig.stages.editTitle') : t('admin.pipelineConfig.stages.addTitle') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('admin.pipelineConfig.stages.name')" name="name" rules="required" />
          <InputText v-model.number="form.sort_order" type="number" :label="t('admin.pipelineConfig.stages.sortOrder')" name="sort_order" rules="required" />
          <div class="flex flex-col gap-2">
            <UCheckbox v-model="form.is_won_stage" :label="t('admin.pipelineConfig.stages.isWonStage')" />
            <UCheckbox v-model="form.is_lost_stage" :label="t('admin.pipelineConfig.stages.isLostStage')" />
            <UCheckbox v-model="form.is_active" :label="t('admin.pipelineConfig.stages.isActive')" />
          </div>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('admin.pipelineConfig.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('admin.pipelineConfig.save')" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  // Passing an existing PipelineStage switches this into edit mode.
  stage?: PipelineStage | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, sort_order: number, is_active: boolean, is_won_stage: boolean, is_lost_stage: boolean }]
}>()

const emptyForm = () => ({
  name: props.stage?.name ?? '',
  sort_order: props.stage?.sort_order ?? 0,
  is_active: props.stage?.is_active ?? true,
  is_won_stage: props.stage?.is_won_stage ?? false,
  is_lost_stage: props.stage?.is_lost_stage ?? false,
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = () => {
  emit('submit', { ...form })
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
