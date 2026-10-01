<template>
  <UModal
    :open="open"
    :title="t('crm.components.paymentsExportModal.title')"
    :description="t('crm.components.paymentsExportModal.description')"
    @update:open="onUpdateOpen"
  >
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputDatePicker v-model="form.date_from" :label="t('crm.components.paymentsExportModal.dateFrom')" name="date_from" data-cy="payments-export-date-from" />
          <InputDatePicker v-model="form.date_to" :label="t('crm.components.paymentsExportModal.dateTo')" name="date_to" data-cy="payments-export-date-to" />
          <InputSelect
            v-model="form.method"
            class="sm:col-span-2"
            :options="methodOptions"
            :label="t('crm.components.paymentsExportModal.method')"
            name="method"
            data-cy="payments-export-method"
          />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.paymentsExportModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary
          :label="t('crm.components.paymentsExportModal.export')"
          icon="material-symbols:download"
          :loading="loading"
          data-cy="payments-export-submit"
          @click="onSave"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PAYMENT_METHOD_OPTIONS } from '~/constants/mockData'

// "Export payments (CSV)" with a paid-date range and method — GET
// /payments/export (Admin/Sales Manager). `params` adds fixed filters from
// the opener (deal_id / company_id). A 422 (date_to before date_from, a
// malformed date) goes onto the date inputs and the dialog stays open.
const props = defineProps<{
  open: boolean
  params?: PaymentsExportParams
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const exportPayments = usePaymentsExport()

const methodOptions = computed(() => [
  { label: t('crm.components.paymentsExportModal.allMethods'), value: 'all' },
  ...PAYMENT_METHOD_OPTIONS,
])

const emptyForm = () => ({
  date_from: '',
  date_to: '',
  method: 'all' as PaymentMethod | 'all',
})

const { form, formRef, validateThenSubmit, loading, guard, guardDismiss } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = guardDismiss((value: boolean) => emit('update:open', value))

const onSubmit = guard(async () => {
  const done = await exportPayments({
    ...props.params,
    date_from: form.date_from || undefined,
    date_to: form.date_to || undefined,
    method: form.method !== 'all' ? form.method : undefined,
  }, formRef.value?.setErrors)
  if (done) emit('update:open', false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
