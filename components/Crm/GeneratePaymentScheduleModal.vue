<template>
  <UModal :open="open" :title="t('crm.components.generatePaymentScheduleModal.title')" @update:open="onUpdateOpen">
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <CrmStatusPill v-model="form.mode" :options="modeOptions" class="mb-3" data-cy="payment-schedule-mode" />

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputText v-model.number="form.totalAmount" :label="t('crm.components.generatePaymentScheduleModal.totalAmount')" type="number" name="totalAmount" rules="required" />
          <template v-if="form.mode === 'equal'">
            <InputText v-model.number="form.count" :label="t('crm.components.generatePaymentScheduleModal.count')" type="number" name="count" rules="required|min_value:2" />
            <InputDatePicker v-model="form.firstDueDate" :label="t('crm.components.generatePaymentScheduleModal.firstDueDate')" name="firstDueDate" rules="required" />
            <InputText v-model.number="form.intervalMonths" :label="t('crm.components.generatePaymentScheduleModal.intervalMonths')" type="number" name="intervalMonths" rules="required|min_value:1" />
          </template>
        </div>

        <!-- Milestone split: one editable row per installment. The amount
        column is live, and the last row absorbs the rounding remainder. -->
        <div v-if="form.mode === 'percentage'" class="mt-4 flex flex-col gap-3" data-cy="payment-schedule-milestones">
          <div
            v-for="(row, index) in form.milestones"
            :key="row.key"
            class="grid grid-cols-[1fr_5.5rem] items-start gap-2 rounded-lg border border-(--color-light-gray-2) p-3 sm:grid-cols-[1fr_5.5rem_10rem_auto]"
          >
            <InputText
              v-model="row.label"
              :label="t('crm.components.generatePaymentScheduleModal.milestoneLabel')"
              :name="`milestone-label-${row.key}`"
              :data-cy="`milestone-label-${index}`"
            />
            <InputText
              v-model.number="row.percent"
              :label="t('crm.components.generatePaymentScheduleModal.milestonePercent')"
              type="number"
              min="0"
              max="100"
              :name="`milestone-percent-${row.key}`"
              rules="required|min_value:0.01|max_value:100"
              :data-cy="`milestone-percent-${index}`"
            />
            <InputDatePicker
              v-model="row.dueDate"
              :label="t('crm.components.generatePaymentScheduleModal.milestoneDueDate')"
              :name="`milestone-due-${row.key}`"
              rules="required"
              class="col-span-2 sm:col-span-1"
            />
            <div class="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-end sm:pt-6">
              <span class="text-sm font-medium whitespace-nowrap" :data-cy="`milestone-amount-${index}`">
                {{ t('global.currencySymbol') }}{{ priceFormat(percentagePreview[index]?.amount ?? 0) }}
              </span>
              <UButton
                v-if="form.milestones.length > 1"
                icon="material-symbols:delete-outline"
                variant="ghost"
                color="neutral"
                size="xs"
                :aria-label="t('crm.components.generatePaymentScheduleModal.removeMilestone')"
                @click="removeMilestone(index)"
              />
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <ButtonPrimary
              :label="t('crm.components.generatePaymentScheduleModal.addMilestone')"
              icon="material-symbols:add"
              outline
              small
              @click="addMilestone"
            />
            <span
              class="text-sm"
              :class="percentageValid ? 'text-(--color-gray)' : 'font-medium text-(--color-danger-toast)'"
              data-cy="milestone-percent-total"
            >
              {{ t('crm.components.generatePaymentScheduleModal.percentTotal', { total: milestonePercentTotal }) }}
            </span>
          </div>
          <p v-if="!percentageValid" class="text-sm text-(--color-danger-toast)" role="alert">
            {{ t('crm.components.generatePaymentScheduleModal.percentMustTotal100') }}
          </p>
        </div>

        <!-- Preview — a formula output the rep can sanity-check before
        submitting, not a per-row editable list (that's what the "Add
        Installment" one-at-a-time flow is for). -->
        <div v-if="form.mode === 'equal' && equalPreview.length > 0" class="mt-4">
          <p class="mb-2 text-xs text-(--color-gray)">{{ t('crm.components.generatePaymentScheduleModal.previewHeading') }}</p>
          <div class="max-h-[30vh] overflow-y-auto rounded-lg border border-(--color-light-gray-2)">
            <table class="w-full text-sm">
              <tbody>
                <tr v-for="(row, index) in equalPreview" :key="index" class="border-b border-(--color-light-gray-2) last:border-b-0">
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
        <ButtonPrimary :label="t('crm.components.generatePaymentScheduleModal.save')" :loading="loading" data-cy="payment-schedule-save" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { priceFormat, dateFormat, toDateInputValue } = useFormatter()

const props = defineProps<{
  open: boolean
  // Defaults totalAmount to the Deal's remaining balance when the modal opens.
  defaultTotalAmount: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [installments: { amount: number, due_date: Date, note: string }[]]
}>()

type SplitMode = 'equal' | 'percentage'

const modeOptions = computed<Select[]>(() => [
  { label: t('crm.components.generatePaymentScheduleModal.modeEqual'), value: 'equal' },
  { label: t('crm.components.generatePaymentScheduleModal.modePercentage'), value: 'percentage' },
])

let milestoneKey = 0
// Placeholder due dates a month apart from today, so the rows are usable as
// soon as the mode is picked; each is meant to be edited to the real date.
const milestoneDueDate = (monthsAhead: number) => {
  const date = new Date()
  date.setMonth(date.getMonth() + monthsAhead)
  return toDateInputValue(date)
}
const defaultMilestoneLabel = (index: number, count: number) => {
  if (index === 0) return t('crm.components.generatePaymentScheduleModal.milestoneDeposit')
  if (index === count - 1) return t('crm.components.generatePaymentScheduleModal.milestoneFinal')
  return t('crm.components.generatePaymentScheduleModal.milestoneN', { n: index + 1 })
}
const defaultMilestones = () => DEFAULT_MILESTONE_PERCENTS.map((percent, index) => ({
  key: ++milestoneKey,
  label: defaultMilestoneLabel(index, DEFAULT_MILESTONE_PERCENTS.length),
  percent,
  dueDate: milestoneDueDate(index),
}))

const emptyForm = () => ({
  mode: 'equal' as SplitMode,
  totalAmount: props.defaultTotalAmount,
  count: 3,
  firstDueDate: '',
  intervalMonths: 1,
  milestones: defaultMilestones(),
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const equalPreview = computed(() => {
  if (!form.firstDueDate || form.count < 2) return []
  return splitEqually(form.totalAmount, form.count, new Date(form.firstDueDate), form.intervalMonths)
})

const milestonePercentTotal = computed(() => percentTotal(form.milestones))
const percentageValid = computed(() => isPercentageSplitValid(form.milestones))
const percentagePreview = computed(() => splitByPercentage(form.totalAmount, form.milestones.map(row => ({
  label: row.label,
  percent: row.percent,
  due_date: new Date(row.dueDate),
}))))

const addMilestone = () => {
  const remaining = Math.max(0, Math.round((100 - milestonePercentTotal.value) * 100) / 100)
  form.milestones.push({
    key: ++milestoneKey,
    label: t('crm.components.generatePaymentScheduleModal.milestoneN', { n: form.milestones.length + 1 }),
    percent: remaining,
    dueDate: milestoneDueDate(form.milestones.length),
  })
}
const removeMilestone = (index: number) => form.milestones.splice(index, 1)

// Awaits the caller's save; stays open (form intact) if it resolves false.
const emitSubmit = useAwaitableEmit('submit')
const onSubmit = guard(async () => {
  if (form.mode === 'percentage' && (!percentageValid.value || percentagePreview.value.length === 0)) return
  const results = await emitSubmit(form.mode === 'percentage' ? percentagePreview.value : equalPreview.value)
  if (!results.includes(false)) onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
