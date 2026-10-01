<template>
  <UModal :open="open" :title="t('crm.components.addPaymentInstallmentModal.title')" @update:open="onUpdateOpen">
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model.number="form.amount" :label="t('crm.components.addPaymentInstallmentModal.amount')" type="number" name="amount" rules="required" />
          <InputDatePicker v-model="form.due_date" :label="t('crm.components.addPaymentInstallmentModal.dueDate')" name="due_date" rules="required" />
          <InputText v-model="form.note" :label="t('crm.components.addPaymentInstallmentModal.note')" name="note" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addPaymentInstallmentModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addPaymentInstallmentModal.save')" :loading="loading" @click="onSave" />
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
  submit: [installment: { amount: number, due_date: Date, note: string }]
}>()

const emptyForm = () => ({
  amount: 0,
  due_date: '',
  note: '',
})

const { form, formRef, validateThenSubmit, loading, guard, guardDismiss } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = guardDismiss((value: boolean) => emit('update:open', value))

// Awaits the caller's save; stays open (form intact) if it resolves false.
const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false))
const onSubmit = guard(async () => {
  await submitAndClose({
    amount: form.amount,
    due_date: new Date(form.due_date),
    note: form.note,
  })
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
