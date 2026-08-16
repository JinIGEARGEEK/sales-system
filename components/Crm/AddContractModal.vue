<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.contracts.components.addContractModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputSelect
            v-model="form.quote_id"
            :options="quoteOptions"
            :label="t('crm.contracts.components.addContractModal.quote')"
            :placeholder="t('crm.contracts.components.addContractModal.quotePlaceholder')"
            name="quote_id"
          />
          <InputSelect
            v-model="form.status"
            :options="CONTRACT_STATUS_OPTIONS"
            :label="t('crm.contracts.components.addContractModal.status')"
            name="status"
            rules="required"
          />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.contracts.components.addContractModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.contracts.components.addContractModal.save')" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CONTRACT_STATUS_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  quotes?: Quote[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [contract: { status: ContractStatus, quote_id?: number }]
}>()

const emptyForm = () => ({
  quote_id: '' as number | '',
  status: 'draft' as ContractStatus,
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

const quoteOptions = computed<Select[]>(() => (props.quotes ?? []).map(quote => ({
  label: t('crm.contracts.detail.linkedQuote', { id: quote.id }),
  value: quote.id,
})))

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = () => {
  emit('submit', {
    status: form.status,
    quote_id: form.quote_id === '' ? undefined : Number(form.quote_id),
  })
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
