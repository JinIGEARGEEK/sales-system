<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.addPaymentModal.title') }}</h3>
    </template>
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
        <ButtonPrimary :label="t('crm.components.addPaymentModal.save')" @click="onSave" />
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

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const emptyForm = () => ({
  amount: 0,
  paid_at: '',
  method: 'transfer' as PaymentMethod,
  note: '',
})

const form = reactive(emptyForm())

const onUpdateOpen = (value: boolean) => {
  if (!value) Object.assign(form, emptyForm())
  emit('update:open', value)
}

watch(() => props.open, (value) => {
  if (value) Object.assign(form, emptyForm())
})

const onSubmit = () => {
  emit('submit', {
    amount: form.amount,
    paid_at: new Date(form.paid_at),
    method: form.method,
    note: form.note,
  })
  onUpdateOpen(false)
}

// The footer's Save button lives outside the <Form>'s own slot, and vee-validate's
// Form component doesn't expose submitForm() on its template ref — only validate()
// and the field setters — so trigger validation manually before submitting.
const onSave = async () => {
  const result = await formRef.value?.validate()
  if (result?.valid) onSubmit()
}
</script>
