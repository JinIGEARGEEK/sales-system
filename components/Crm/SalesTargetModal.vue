<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ target ? t('admin.pipelineConfig.salesTargets.editTitle') : t('admin.pipelineConfig.salesTargets.addTitle') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputText
            v-model.number="form.year"
            type="number"
            :label="t('admin.pipelineConfig.salesTargets.year')"
            name="year"
            rules="required"
          />
          <InputSelect
            v-model="form.quarter"
            :label="t('admin.pipelineConfig.salesTargets.quarter')"
            name="quarter"
            rules="required"
            :options="QUARTER_OPTIONS"
          />
          <InputText
            v-model.number="form.target_value"
            thousands
            :label="t('admin.pipelineConfig.salesTargets.targetValue')"
            name="target_value"
            rules="required"
            class="col-span-2"
          />
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

const QUARTER_OPTIONS: Select[] = [
  { label: 'Q1', value: 1 },
  { label: 'Q2', value: 2 },
  { label: 'Q3', value: 3 },
  { label: 'Q4', value: 4 },
]

const props = defineProps<{
  open: boolean
  // Passing an existing SalesTarget switches this into edit mode.
  target?: SalesTarget | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { year: number, quarter: number, target_value: number }]
}>()

const currentYear = new Date().getFullYear()

const emptyForm = () => ({
  year: props.target?.year ?? currentYear,
  quarter: props.target?.quarter ?? (Math.floor(new Date().getMonth() / 3) + 1),
  target_value: props.target?.target_value ?? 0,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  emit('submit', { ...form })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
