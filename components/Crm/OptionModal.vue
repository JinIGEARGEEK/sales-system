<template>
  <UModal
    :open="open"
    :title="option ? t(`${i18nPrefix}.editTitle`) : t(`${i18nPrefix}.addTitle`)"
    @update:open="onUpdateOpen"
  >
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t(`${i18nPrefix}.name`)" name="name" rules="required" />
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

// Generic add/edit modal for the Admin-configurable name + active lists
// (Lead/Prospect sources, Industries, Company/Revenue sizes, Job titles,
// Product categories) — they used to be seven copies of this file differing
// only in i18n keys. `i18nPrefix` is the locale namespace holding that
// list's `addTitle`/`editTitle`/`name` strings, e.g.
// 'admin.pipelineConfig.companySizes'.
const props = defineProps<{
  open: boolean
  i18nPrefix: string
  // Passing an existing option switches this into edit mode.
  option?: { name: string, is_active: boolean } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, is_active: boolean }]
}>()

const { t } = useI18n()

const emptyForm = () => ({
  name: props.option?.name ?? '',
  is_active: props.option?.is_active ?? true,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  emit('submit', { ...form })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
