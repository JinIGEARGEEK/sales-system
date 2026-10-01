<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <CardTitle>{{ t('crm.deals.detail.paymentsTitle') }}</CardTitle>
        <ButtonPrimary
          :label="t('crm.deals.detail.addPayment')"
          icon="material-symbols:add"
          small
          data-cy="payment-add"
          @click="openAddPayment"
        />
      </div>

      <!-- Cash received + WHT the customer withheld = settled. WHT counts
           toward the balance as soon as it's recorded, certificate (50 ทวิ)
           or not — the certificate flag is tracked separately, not a gate. -->
      <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CrmStatCard :label="t('crm.deals.detail.totalPaid')" reserve-hint-space>
          <span data-cy="payments-total-paid">{{ currency(totalPaid) }}</span>
        </CrmStatCard>
        <CrmStatCard :label="t('crm.deals.detail.totalWht')" reserve-hint-space>
          <span data-cy="payments-total-wht">{{ currency(totalWht) }}</span>
        </CrmStatCard>
        <CrmStatCard :label="t('crm.deals.detail.totalSettled')" reserve-hint-space>
          <span data-cy="payments-total-settled">{{ currency(totalSettled) }}</span>
        </CrmStatCard>
        <CrmStatCard :label="t('crm.deals.detail.remainingBalance')" reserve-hint-space>
          {{ remainingBalance > 0 ? currency(remainingBalance) : t('crm.deals.detail.fullyPaid') }}
          <template #hint>
            <span data-cy="payments-receivable-source">
              {{ currency(receivable.amount) }} ·
              {{ receivable.fromQuote ? t('crm.reports.outstandingBalance.receivableSource.quote') : t('crm.reports.outstandingBalance.receivableSource.dealValue') }}
            </span>
          </template>
        </CrmStatCard>
      </div>

      <div v-if="paymentsLoading && dealPayments.length === 0" class="flex flex-col gap-2" data-cy="payments-loading">
        <USkeleton v-for="i in 3" :key="`payment-skeleton-${i}`" class="h-10 w-full rounded-lg" />
      </div>
      <TableEmpty
        v-else-if="dealPayments.length === 0"
        :title="t('crm.deals.detail.noPayments')"
        icon="material-symbols:payments-outline"
        data-cy-suffix="-payments"
      />
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-200 text-sm" data-cy="payments-table">
          <thead>
            <tr class="border-b border-(--color-light-gray-2) text-left text-xs text-(--color-gray)">
              <th class="py-2 pr-3 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnDate') }}</th>
              <th class="py-2 pr-3 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnAmount') }}</th>
              <th class="py-2 pr-3 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnWht') }}</th>
              <th class="py-2 pr-3 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnDocumentNumber') }}</th>
              <th class="py-2 pr-3 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnInstallment') }}</th>
              <th class="py-2 pr-3 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnMethod') }}</th>
              <th class="py-2 pr-3 font-normal">{{ t('crm.deals.detail.columnNote') }}</th>
              <th class="py-2"><span class="sr-only">{{ t('global.table.actions') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in dealPayments" :key="payment.id" class="border-b border-(--color-light-gray-2)" :data-cy="`payment-row-${payment.id}`">
              <td class="py-2 pr-3 whitespace-nowrap">{{ dateFormat(payment.paid_at) }}</td>
              <td class="py-2 pr-3 whitespace-nowrap">{{ currency(payment.amount) }}</td>
              <td class="py-2 pr-3 whitespace-nowrap">
                <template v-if="payment.wht_amount > 0">
                  {{ currency(payment.wht_amount) }}
                  <UTooltip v-if="isWhtCertificatePending(payment)" :text="t('crm.deals.detail.whtCertificatePendingHint')">
                    <UBadge size="sm" color="warning" variant="subtle" class="ml-1" icon="material-symbols:pending-actions-outline" data-cy="payment-wht-pending">
                      {{ t('crm.deals.detail.whtCertificatePending') }}
                    </UBadge>
                  </UTooltip>
                  <UBadge v-else size="sm" color="success" variant="subtle" class="ml-1" icon="material-symbols:task-alt">
                    {{ t('crm.deals.detail.whtCertificateReceived') }}
                  </UBadge>
                </template>
                <span v-else class="text-(--color-gray)">-</span>
              </td>
              <td class="py-2 pr-3 whitespace-nowrap">{{ payment.document_number || '-' }}</td>
              <td class="py-2 pr-3 whitespace-nowrap">
                {{ payment.installment_id && installmentNumberById.get(payment.installment_id)
                  ? t('crm.deals.detail.installmentNumber', { number: installmentNumberById.get(payment.installment_id) })
                  : '-' }}
              </td>
              <td class="py-2 pr-3 whitespace-nowrap capitalize">{{ payment.method }}</td>
              <td class="max-w-48 truncate py-2 pr-3 text-(--color-gray)">{{ payment.note || '-' }}</td>
              <td class="py-2 text-right whitespace-nowrap">
                <UButton
                  icon="material-symbols:edit-outline"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :aria-label="t('crm.deals.detail.editPayment')"
                  :data-cy="`payment-edit-${payment.id}`"
                  @click="openEditPayment(payment)"
                />
                <UButton
                  icon="material-symbols:delete-outline"
                  variant="ghost"
                  color="error"
                  size="xs"
                  :aria-label="t('crm.deals.detail.removePayment')"
                  :data-cy="`payment-delete-${payment.id}`"
                  @click="requestDelete(payment)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ContainerTemplate>

    <ContainerTemplate class="mt-4">
      <div class="mb-4 flex items-center justify-between">
        <CardTitle>{{ t('crm.deals.detail.paymentScheduleTitle') }}</CardTitle>
        <div class="flex gap-2">
          <ButtonPrimary
            :label="t('crm.deals.detail.generateSchedule')"
            icon="material-symbols:auto-awesome-outline"
            outline
            small
            @click="generateScheduleOpen = true"
          />
          <ButtonPrimary
            :label="t('crm.deals.detail.addInstallment')"
            icon="material-symbols:add"
            small
            @click="addInstallmentOpen = true"
          />
        </div>
      </div>

      <div v-if="installmentsLoading && dealInstallments.length === 0" class="flex flex-col gap-2" data-cy="installments-loading">
        <USkeleton v-for="i in 3" :key="`installment-skeleton-${i}`" class="h-10 w-full rounded-lg" />
      </div>
      <TableEmpty
        v-else-if="dealInstallments.length === 0"
        :title="t('crm.deals.detail.noInstallments')"
        icon="material-symbols:calendar-month-outline"
        data-cy-suffix="-installments"
      />
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-120 text-sm">
          <thead>
            <tr class="border-b border-(--color-light-gray-2) text-left text-xs text-(--color-gray)">
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnDueDate') }}</th>
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnAmount') }}</th>
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnStatus') }}</th>
              <th class="py-2 font-normal">{{ t('crm.deals.detail.columnNote') }}</th>
              <th class="py-2"><span class="sr-only">{{ t('global.table.actions') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in dealInstallments" :key="s.installment.id" class="border-b border-(--color-light-gray-2)">
              <td class="py-2 whitespace-nowrap">{{ dateFormat(s.installment.due_date) }}</td>
              <td class="py-2 whitespace-nowrap">{{ currency(s.installment.amount) }}</td>
              <td class="py-2 whitespace-nowrap">
                <UBadge size="sm" :color="installmentStatusColor(s.status)" variant="subtle">{{ t(`crm.deals.detail.installmentStatus.${s.status}`) }}</UBadge>
              </td>
              <td class="max-w-48 truncate py-2 text-(--color-gray)">{{ s.installment.note || '-' }}</td>
              <td class="py-2 text-right">
                <UButton
                  icon="material-symbols:delete-outline"
                  variant="ghost"
                  color="error"
                  size="xs"
                  :aria-label="t('crm.deals.detail.removeInstallment')"
                  @click="requestDeleteInstallment(s.installment)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ContainerTemplate>

    <CrmAddPaymentModal
      v-model:open="addPaymentOpen"
      :record="editingPayment"
      :installments="dealInstallments"
      :tax-rates="taxRates"
      @submit="onSubmitPayment"
    />

    <CrmAddPaymentInstallmentModal
      v-model:open="addInstallmentOpen"
      @submit="onAddInstallment"
    />

    <CrmGeneratePaymentScheduleModal
      v-model:open="generateScheduleOpen"
      :default-total-amount="unscheduledAmount"
      :max-total-amount="scheduleLimit"
      @submit="onGenerateSchedule"
    />

    <CrmConfirmDeleteModal
      v-model:open="open"
      :body="target ? t('crm.deals.detail.removePaymentConfirmBody', { amount: currency(target.amount), date: dateFormat(target.paid_at) }) : ''"
      @confirm="confirmRemovePayment"
    />

    <CrmConfirmDeleteModal
      v-model:open="installmentDeleteOpen"
      :body="installmentTarget ? t('crm.deals.detail.removeInstallmentConfirmBody', { amount: currency(installmentTarget.amount), date: dateFormat(installmentTarget.due_date) }) : ''"
      @confirm="confirmRemoveInstallment"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { currency, dateFormat } = useFormatter()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const paymentsStore = usePaymentsStore()
const paymentInstallmentsStore = usePaymentInstallmentsStore()
const quotesStore = useQuotesStore()

const { dealId, deal } = useCurrentDeal()

// Skeletons (not the empty states) until each first fetch settles.
const paymentsLoading = ref(true)
const installmentsLoading = ref(true)
onMounted(() => {
  paymentsStore.fetchForDeal(dealId).catch(notifyApiError).finally(() => { paymentsLoading.value = false })
  paymentInstallmentsStore.fetchForDeal(dealId).catch(notifyApiError).finally(() => { installmentsLoading.value = false })
  quotesStore.fetchForDeal(dealId).catch(notifyApiError)
})

const addPaymentOpen = ref(false)
const editingPayment = ref<Payment | null>(null)
const dealPayments = computed(() => paymentsStore.forDeal(dealId))
const totalPaid = computed(() => paymentsStore.totalForDeal(dealId))
const totalWht = computed(() => paymentsStore.whtForDeal(dealId))
const totalSettled = computed(() => paymentsStore.settledForDeal(dealId))
// What the customer owes — the Outstanding Balance report's rule (dealReceivable).
const receivable = computed(() => dealReceivable(quotesStore.forDeal(dealId), deal.value?.value ?? 0))
// WHT counts as settled, so it comes off the balance like cash does.
const remainingBalance = computed(() => receivable.value.amount - totalSettled.value)
// "Fill WHT" uses the latest Accepted Quote's WHT/VAT settings.
const taxRates = computed(() => paymentTaxRates(quotesStore.forDeal(dealId)))

const openAddPayment = () => {
  editingPayment.value = null
  addPaymentOpen.value = true
}

const openEditPayment = (payment: Payment) => {
  editingPayment.value = payment
  addPaymentOpen.value = true
}

// Installment statuses depend on payments (a linked payment settles its own
// installment first), so they're re-read after every payment change.
const refreshInstallments = () => paymentInstallmentsStore.fetchForDeal(dealId).catch(notifyApiError)

// `report` (from CrmAddPaymentModal) shows a 422/409 on the form itself —
// e.g. the overpayment warning with "Record anyway" — so the dialog stays
// open; anything it doesn't cover is toasted here.
const onSubmitPayment = async (payment: PaymentPayload, report?: PaymentErrorReporter) => {
  try {
    if (editingPayment.value) {
      await paymentsStore.update(editingPayment.value.id, payment)
      success(t('crm.deals.detail.editPaymentSuccess'))
    } else {
      await paymentsStore.add(dealId, payment)
      success(t('crm.deals.detail.addPaymentSuccess'))
    }
    refreshInstallments()
  } catch (err) {
    if (!report?.(err)) notifyApiError(err)
    return false
  }
}

// The API refuses a schedule that would add up to more than the receivable
// (422 installments ["exceeds_receivable"]) — e.g. when an Accepted quote
// changed since this page loaded. Said in words, and the totals re-read.
const notifyInstallmentError = (err: unknown) => {
  if (apiErrorHasFieldCode(err, 'installments', 'exceeds_receivable') || apiErrorHasFieldCode(err, 'amount', 'exceeds_receivable')) {
    error(t('crm.deals.detail.scheduleExceedsReceivable'))
    quotesStore.fetchForDeal(dealId).catch(notifyApiError)
    refreshInstallments()
    return
  }
  notifyApiError(err)
}

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Payment>()

const confirmRemovePayment = async () => {
  if (!target.value) return
  try {
    await paymentsStore.remove(target.value.id)
    success(t('crm.deals.detail.removePaymentSuccess'))
    refreshInstallments()
  } catch (err) {
    notifyApiError(err)
  } finally {
    closeDelete()
  }
}

// Payment Schedule (installments) — reuses the exact same list/summary/modal
// shape as Payments above, with its own store/modal/delete-confirm instances
// since the two are siblings, not the same entity.
const addInstallmentOpen = ref(false)
const dealInstallments = computed(() => paymentInstallmentsStore.forDeal(dealId))
const installmentNumberById = computed(() => installmentNumbers(dealInstallments.value))

const installmentStatusColor = (status: PaymentInstallmentStatusValue) => {
  if (status === 'paid') return 'success'
  if (status === 'overdue') return 'error'
  if (status === 'partial') return 'warning'
  return 'neutral'
}

const onAddInstallment = async (installment: { amount: number, due_date: Date, note: string }) => {
  try {
    await paymentInstallmentsStore.add(dealId, installment)
    success(t('crm.deals.detail.addInstallmentSuccess'))
  } catch (err) {
    notifyInstallmentError(err)
    return false
  }
}

const generateScheduleOpen = ref(false)
// The schedule as a whole (paid installments included) is measured against
// the receivable, the same check the API's bulk endpoint makes: Generate
// defaults to whatever isn't scheduled yet and can't go over it. With no
// receivable at all (no Accepted Quote, Deal value 0) there's no limit.
const scheduledTotal = computed(() => roundSatang(dealInstallments.value.reduce((sum, s) => sum + s.installment.amount, 0)))
const unscheduledAmount = computed(() => Math.max(0, roundSatang(receivable.value.amount - scheduledTotal.value)))
const scheduleLimit = computed(() => receivable.value.amount > 0 ? unscheduledAmount.value : null)

const onGenerateSchedule = async (installments: { amount: number, due_date: Date, note: string }[]) => {
  try {
    await paymentInstallmentsStore.bulkAdd(dealId, installments)
    success(t('crm.deals.detail.generateScheduleSuccess', { count: installments.length }))
  } catch (err) {
    notifyInstallmentError(err)
    return false
  }
}

const {
  open: installmentDeleteOpen,
  target: installmentTarget,
  requestDelete: requestDeleteInstallment,
  closeDelete: closeInstallmentDelete,
} = useDeleteConfirm<PaymentInstallment>()

const confirmRemoveInstallment = async () => {
  if (!installmentTarget.value) return
  try {
    await paymentInstallmentsStore.remove(dealId, installmentTarget.value.id)
    success(t('crm.deals.detail.removeInstallmentSuccess'))
    // Payments linked to it are unlinked server-side (not deleted).
    paymentsStore.fetchForDeal(dealId).catch(notifyApiError)
  } catch (err) {
    notifyApiError(err)
  } finally {
    closeInstallmentDelete()
  }
}
</script>
