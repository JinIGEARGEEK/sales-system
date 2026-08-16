<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.addProductModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model="form.name" :label="t('crm.components.addProductModal.name')" name="name" rules="required" />
          <InputText v-model="form.category" :label="t('crm.components.addProductModal.category')" name="category" />
          <InputTextarea v-model="form.description" :label="t('crm.components.addProductModal.description')" name="description" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addProductModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addProductModal.save')" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [product: { name: string, category: string, description: string }]
}>()

const emptyForm = () => ({
  name: '',
  category: '',
  description: '',
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = () => {
  emit('submit', { ...form })
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
