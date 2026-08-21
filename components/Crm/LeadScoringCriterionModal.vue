<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ criterion ? t('admin.pipelineConfig.leadScoring.editTitle') : t('admin.pipelineConfig.leadScoring.addTitle') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('admin.pipelineConfig.leadScoring.name')" name="name" rules="required" />
          <InputSelect v-model="form.field" :label="t('admin.pipelineConfig.leadScoring.field')" name="field" :options="fieldOptions" rules="required" />
          <InputText v-model="form.match_value" :label="t('admin.pipelineConfig.leadScoring.matchValue')" name="match_value" />
          <InputText v-model.number="form.weight" type="number" :label="t('admin.pipelineConfig.leadScoring.weight')" name="weight" rules="required|min_value:1" />
          <UCheckbox v-if="criterion" v-model="form.is_active" :label="t('admin.pipelineConfig.stages.isActive')" />
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

const props = defineProps<{
  open: boolean
  // Passing an existing LeadScoringCriterion switches this into edit mode.
  criterion?: LeadScoringCriterion | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, field: LeadScoringCriterionField, match_value: string, weight: number, is_active: boolean }]
}>()

// Small closed set (mirrors the backend's LeadScoringCriterion.Field
// validation) — not worth an Admin-configurable list of its own.
const fieldOptions: Select[] = [
  { label: t('admin.pipelineConfig.leadScoring.fieldOptions.source'), value: 'source' },
  { label: t('admin.pipelineConfig.leadScoring.fieldOptions.hasCompanyName'), value: 'has_company_name' },
  { label: t('admin.pipelineConfig.leadScoring.fieldOptions.hasPhone'), value: 'has_phone' },
]

const emptyForm = () => ({
  name: props.criterion?.name ?? '',
  field: props.criterion?.field ?? 'source' as LeadScoringCriterionField,
  match_value: props.criterion?.match_value ?? '',
  weight: props.criterion?.weight ?? 0,
  is_active: props.criterion?.is_active ?? true,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  emit('submit', { ...form })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
