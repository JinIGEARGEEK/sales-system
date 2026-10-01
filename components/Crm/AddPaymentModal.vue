<template>
  <UModal
    :open="open"
    :title="record ? t('crm.components.addPaymentModal.editTitle') : t('crm.components.addPaymentModal.title')"
    :description="t('crm.components.addPaymentModal.description')"
    @update:open="onUpdateOpen"
  >
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputText
            v-model="form.amount"
            :label="t('crm.components.addPaymentModal.amount')"
            thousands
            :decimals="2"
            name="amount"
            rules="required"
            data-cy="payment-amount"
          />
          <InputDatePicker v-model="form.paid_at" :label="t('crm.components.addPaymentModal.paidOn')" name="paid_at" rules="required" data-cy="payment-paid-at" />
          <div>
            <InputText
              v-model="form.wht_amount"
              :label="t('crm.components.addPaymentModal.whtAmount')"
              thousands
              :decimals="2"
              name="wht_amount"
              data-cy="payment-wht-amount"
            />
            <UButton
              class="mt-1 px-0"
              variant="link"
              size="xs"
              :disabled="!(Number(form.amount) > 0)"
              data-cy="payment-wht-fill"
              @click="fillWht"
            >
              {{ t('crm.components.addPaymentModal.whtFill') }}
            </UButton>
            <p class="text-xs text-(--color-gray)">{{ t('crm.components.addPaymentModal.whtFillHint') }}</p>
          </div>
          <InputSelect v-model="form.method" :options="PAYMENT_METHOD_OPTIONS" :label="t('crm.components.addPaymentModal.method')" name="method" rules="required" />
          <div v-if="Number(form.wht_amount) > 0" class="sm:col-span-2">
            <UCheckbox
              v-model="form.wht_certificate_received"
              :label="t('crm.components.addPaymentModal.whtCertificateReceived')"
              :description="t('crm.components.addPaymentModal.whtCertificateHint')"
              data-cy="payment-wht-certificate"
            />
          </div>
          <InputText
            v-model="form.document_number"
            :label="t('crm.components.addPaymentModal.documentNumber')"
            :placeholder="t('crm.components.addPaymentModal.documentNumberPlaceholder')"
            name="document_number"
            rules="max:64"
            maxlength="64"
            data-cy="payment-document-number"
          />
          <InputSelect
            v-model="form.installment_id"
            :options="installmentOptions"
            :label="t('crm.components.addPaymentModal.installment')"
            name="installment_id"
            :disable="installmentOptions.length <= 1"
            data-cy="payment-installment"
          />
          <InputText v-model="form.note" class="sm:col-span-2" :label="t('crm.components.addPaymentModal.note')" name="note" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addPaymentModal.cancel')" cancel data-cy="payment-cancel" @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addPaymentModal.save')" :loading="loading" data-cy="payment-save" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PAYMENT_METHOD_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()
const { dateFormat, toDateInputValue, currency } = useFormatter()

const props = defineProps<{
  open: boolean
  // Passing an existing Payment switches this into edit mode (PUT /payments/:id).
  record?: Payment | null
  // The Deal's installment statuses, in due-date order — the link picker
  // offers the unpaid ones (plus whichever one the record is already on).
  installments?: PaymentInstallmentStatus[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payment: PaymentPayload]
}>()

// InputSelect can't carry an empty-string value (Reka's SelectItem rejects it).
const NO_INSTALLMENT = 'none'

const emptyForm = () => ({
  amount: props.record?.amount ?? 0,
  // Defaults to today — most payments are recorded the day they arrive.
  paid_at: toDateInputValue(props.record ? props.record.paid_at : new Date()),
  method: props.record?.method ?? ('transfer' as PaymentMethod),
  note: props.record?.note ?? '',
  wht_amount: props.record?.wht_amount ?? 0,
  wht_certificate_received: props.record?.wht_certificate_received ?? false,
  document_number: props.record?.document_number ?? '',
  installment_id: props.record?.installment_id ? String(props.record.installment_id) : NO_INSTALLMENT,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const installmentOptions = computed<Select[]>(() => {
  const statuses = props.installments ?? []
  const numbers = installmentNumbers(statuses)
  const linkable = statuses.filter(s => s.status !== 'paid' || s.installment.id === props.record?.installment_id)
  return [
    { label: t('crm.components.addPaymentModal.installmentNone'), value: NO_INSTALLMENT },
    ...linkable.map(s => ({
      label: t('crm.components.addPaymentModal.installmentOption', {
        number: numbers.get(s.installment.id),
        date: dateFormat(s.installment.due_date),
        amount: currency(s.installment.amount),
      }),
      value: String(s.installment.id),
    })),
  ]
})

const fillWht = () => {
  form.wht_amount = whtFromNetReceived(Number(form.amount))
}

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// Awaits the caller's save: Save spins until it lands, the guard turns away
// a second click, and the dialog stays open (form intact) if the handler
// resolves `false` or throws.
const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false))
const onSubmit = guard(async () => {
  const wht = Number(form.wht_amount) || 0
  const documentNumber = form.document_number.trim()
  await submitAndClose({
    amount: Number(form.amount),
    paid_at: new Date(form.paid_at),
    method: form.method,
    note: form.note,
    wht_amount: wht,
    wht_certificate_received: wht > 0 ? form.wht_certificate_received : false,
    document_number: documentNumber || null,
    installment_id: form.installment_id === NO_INSTALLMENT ? null : Number(form.installment_id),
  })
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
