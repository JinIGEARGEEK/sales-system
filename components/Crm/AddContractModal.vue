<template>
  <UModal
    :open="open"
    :title="record ? t('crm.contracts.components.addContractModal.editTitle') : t('crm.contracts.components.addContractModal.title')"
    @update:open="onUpdateOpen"
  >
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputSelect
            v-model="form.quote_id"
            :options="quoteOptions"
            :label="t('crm.contracts.components.addContractModal.quote')"
            :placeholder="t('crm.contracts.components.addContractModal.quotePlaceholder')"
            name="quote_id"
            :disable="quoteOptions.length === 0"
          />
          <!-- Status only on create: an existing contract's status moves via
               the card's confirmed status select (Signed/Expired ask first). -->
          <div v-if="!record">
            <InputSelect
              v-model="form.status"
              :options="contractEditableStatusOptions"
              :label="t('crm.contracts.components.addContractModal.status')"
              name="status"
              rules="required"
            />
            <p class="mt-1 text-xs text-(--color-gray)">{{ t('crm.contracts.detail.signedViaUploadHint') }}</p>
          </div>
          <div :class="{ 'sm:col-span-2': !record }">
            <InputDatePicker
              v-model="form.end_date"
              :label="t('crm.contracts.components.addContractModal.endDate')"
              name="end_date"
              data-cy="contract-end-date"
            />
            <!-- Beside the field it clears, like the Customer Product
                 renewal date — the footer holds only Cancel + Save
                 (ux-ui-guidelines/modal.md). -->
            <UButton v-if="form.end_date" class="mt-1 px-0" variant="link" size="xs" data-cy="contract-clear-end-date" @click="() => { form.end_date = '' }">
              {{ t('crm.contracts.components.addContractModal.clearEndDate') }}
            </UButton>
            <p class="mt-1 text-xs text-(--color-gray)">{{ t('crm.contracts.components.addContractModal.endDateHint') }}</p>
          </div>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.contracts.components.addContractModal.cancel')" cancel data-cy="contract-cancel" @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.contracts.components.addContractModal.save')" :loading="loading" data-cy="contract-save" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { contractEditableStatusOptions } = useContractStatusColor()

const props = defineProps<{
  open: boolean
  quotes?: Quote[]
  // Passing an existing Contract switches this into edit mode (linked quote
  // and end date; PUT /contracts/:id is a real partial merge).
  record?: Contract | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [contract: { status: ContractStatus, quote_id?: number, end_date: string | null }]
  update: [changes: { quote_id?: number, end_date: string | null }]
}>()

const emptyForm = () => ({
  quote_id: (props.record?.quote_id ?? '') as number | '',
  status: 'draft' as ContractStatus,
  // Date-only 'YYYY-MM-DD' — InputDatePicker's own v-model format, sent as-is.
  end_date: props.record?.end_date ?? '',
})

const { form, formRef, validateThenSubmit, loading, guard, guardDismiss } = useModalForm(() => props.open, emptyForm)

const quoteOptions = computed<Select[]>(() => (props.quotes ?? []).map(quote => ({
  label: t('crm.contracts.detail.linkedQuote', { id: quote.id }),
  value: quote.id,
})))

// Pre-fill the quote link (FR-CRM-047) with the most recently accepted quote,
// falling back to the most recent quote overall — still changeable via the
// select, just not starting blank when there's an obvious default.
watch(() => props.open, (value) => {
  if (!value || props.record) return
  const quotes = props.quotes ?? []
  // By id, not array position — the store moves a quote on update.
  const preferred = latestAcceptedQuote(quotes) ?? quotes.reduce<Quote | undefined>((latest, q) => (!latest || q.id > latest.id ? q : latest), undefined)
  if (preferred) form.quote_id = preferred.id
})

const onUpdateOpen = guardDismiss((value: boolean) => emit('update:open', value))

// Awaits the caller's save: Save spins until it lands, the guard turns away
// a second click, and the dialog stays open (form intact) if the handler
// resolves `false` or throws.
const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false))
const updateAndClose = useAwaitableSubmit(() => onUpdateOpen(false), 'update')
const onSubmit = guard(async () => {
  const quoteId = form.quote_id === '' ? undefined : Number(form.quote_id)
  const endDate = form.end_date || null
  if (props.record) await updateAndClose({ quote_id: quoteId, end_date: endDate })
  else await submitAndClose({ status: form.status, quote_id: quoteId, end_date: endDate })
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
