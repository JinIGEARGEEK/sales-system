<template>
  <UModal :open="open" :title="t('crm.components.addPaymentModal.title')" @update:open="onUpdateOpen">
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputText v-model.number="form.amount" :label="t('crm.components.addPaymentModal.amount')" type="number" name="amount" rules="required" />
          <InputDatePicker v-model="form.paid_at" :label="t('crm.components.addPaymentModal.paidOn')" name="paid_at" rules="required" />
          <InputSelect v-model="form.method" :options="PAYMENT_METHOD_OPTIONS" :label="t('crm.components.addPaymentModal.method')" name="method" rules="required" />
          <InputText v-model="form.note" :label="t('crm.components.addPaymentModal.note')" name="note" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addPaymentModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addPaymentModal.save')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PAYMENT_METHOD_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payment: { amount: number, paid_at: Date, method: PaymentMethod, note: string }]
}>()

const emptyForm = () => ({
  amount: 0,
  paid_at: '',
  method: 'transfer' as PaymentMethod,
  note: '',
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// Awaits the caller's save: Save spins until it lands, the guard turns away
// a second click, and the dialog stays open (form intact) if the handler
// resolves `false` or throws.
const emitSubmit = useAwaitableEmit('submit')
const onSubmit = guard(async () => {
  const results = await emitSubmit({
    amount: form.amount,
    paid_at: new Date(form.paid_at),
    method: form.method,
    note: form.note,
  })
  if (!results.includes(false)) onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
