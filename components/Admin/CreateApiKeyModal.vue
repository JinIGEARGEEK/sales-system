<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('admin.apiKeys.index.createTitle') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText
            v-model="form.name"
            :label="t('admin.apiKeys.index.name')"
            :placeholder="t('admin.apiKeys.index.namePlaceholder')"
            name="name"
            rules="required"
          />
          <InputSelect
            v-model="form.owner_user_id"
            :label="t('admin.apiKeys.index.owner')"
            :placeholder="t('admin.apiKeys.index.ownerPlaceholder')"
            name="owner_user_id"
            rules="required"
            :options="props.ownerOptions"
          />
          <p class="text-xs text-(--color-gray)">{{ t('admin.apiKeys.index.ownerHelp') }}</p>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('admin.apiKeys.index.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('admin.apiKeys.index.create')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  // Only active Users can own a key (mirrors the backend's own
  // owner.IsActive check on Create) — an inactive/deactivated staff
  // account shouldn't be able to keep integrations running through a key
  // issued in their name.
  ownerOptions: Select[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { name: string, owner_user_id: number }]
}>()

const emptyForm = () => ({
  name: '',
  owner_user_id: '' as number | string,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  emit('submit', { name: form.name, owner_user_id: Number(form.owner_user_id) })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
