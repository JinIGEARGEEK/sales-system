<template>
  <UModal :open="open" :title="t('crm.components.generatePaymentScheduleModal.title')" @update:open="onUpdateOpen">
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputText v-model.number="form.totalAmount" :label="t('crm.components.generatePaymentScheduleModal.totalAmount')" type="number" name="totalAmount" rules="required" />
          <InputText v-model.number="form.count" :label="t('crm.components.generatePaymentScheduleModal.count')" type="number" name="count" rules="required|min_value:2" />
          <InputDatePicker v-model="form.firstDueDate" :label="t('crm.components.generatePaymentScheduleModal.firstDueDate')" name="firstDueDate" rules="required" />
          <InputText v-model.number="form.intervalMonths" :label="t('crm.components.generatePaymentScheduleModal.intervalMonths')" type="number" name="intervalMonths" rules="required|min_value:1" />
        </div>

        <!-- Preview — a formula output the rep can sanity-check before
        submitting, not a per-row editable list (that's what the "Add
        Installment" one-at-a-time flow is for). -->
        <div v-if="preview.length > 0" class="mt-4">
          <p class="mb-2 text-xs text-(--color-gray)">{{ t('crm.components.generatePaymentScheduleModal.previewHeading') }}</p>
          <div class="max-h-[30vh] overflow-y-auto rounded-lg border border-(--color-light-gray-2)">
            <table class="w-full text-sm">
              <tbody>
                <tr v-for="(row, index) in preview" :key="index" class="border-b border-(--color-light-gray-2) last:border-b-0">
                  <td class="p-2 text-(--color-gray)">{{ index + 1 }}</td>
                  <td class="p-2">{{ dateFormat(row.due_date) }}</td>
                  <td class="p-2 text-right">{{ t('global.currencySymbol') }}{{ priceFormat(row.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.generatePaymentScheduleModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.generatePaymentScheduleModal.save')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { priceFormat, dateFormat } = useFormatter()

const props = defineProps<{
  open: boolean
  // Defaults totalAmount to the Deal's remaining balance when the modal opens.
  defaultTotalAmount: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [installments: { amount: number, due_date: Date, note: string }[]]
}>()

const emptyForm = () => ({
  totalAmount: props.defaultTotalAmount,
  count: 3,
  firstDueDate: '',
  intervalMonths: 1,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// Equal split, each row rounded to 2 decimals — the last installment absorbs
// whatever rounding remainder is left so the rows always sum to exactly
// totalAmount, rather than silently drifting a few cents off through
// independent rounding.
const preview = computed(() => {
  if (!form.firstDueDate || form.count < 2 || form.totalAmount <= 0) return []
  const firstDue = new Date(form.firstDueDate)
  if (Number.isNaN(firstDue.getTime())) return []

  const perInstallment = Math.round((form.totalAmount / form.count) * 100) / 100
  const rows: { amount: number, due_date: Date }[] = []
  let allocated = 0
  for (let i = 0; i < form.count; i++) {
    const dueDate = new Date(firstDue)
    dueDate.setMonth(dueDate.getMonth() + i * form.intervalMonths)
    const isLast = i === form.count - 1
    const amount = isLast ? Math.round((form.totalAmount - allocated) * 100) / 100 : perInstallment
    allocated += amount
    rows.push({ amount, due_date: dueDate })
  }
  return rows
})

const onSubmit = guard(async () => {
  emit('submit', preview.value.map(row => ({ amount: row.amount, due_date: row.due_date, note: '' })))
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
