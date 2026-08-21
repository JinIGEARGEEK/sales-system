<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ revenueSize ? t('admin.pipelineConfig.revenueSizes.editTitle') : t('admin.pipelineConfig.revenueSizes.addTitle') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('admin.pipelineConfig.revenueSizes.name')" name="name" rules="required" />
          <UCheckbox v-model="form.is_active" :label="t('admin.pipelineConfig.stages.isActive')" />
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
  // Passing an existing RevenueSizeOption switches this into edit mode.
  revenueSize?: RevenueSizeOption | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, is_active: boolean }]
}>()

const emptyForm = () => ({
  name: props.revenueSize?.name ?? '',
  is_active: props.revenueSize?.is_active ?? true,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  emit('submit', { ...form })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
