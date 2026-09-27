<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.deals.detail.paymentsTitle') }}</h3>
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
        <div class="rounded-lg border border-(--color-light-gray-2) p-4">
          <p class="text-xs text-(--color-gray)">{{ t('crm.deals.detail.totalPaid') }}</p>
          <p class="text-lg font-semibold" data-cy="payments-total-paid">{{ currency(totalPaid) }}</p>
        </div>
        <div class="rounded-lg border border-(--color-light-gray-2) p-4">
          <p class="text-xs text-(--color-gray)">{{ t('crm.deals.detail.totalWht') }}</p>
          <p class="text-lg font-semibold" data-cy="payments-total-wht">{{ currency(totalWht) }}</p>
        </div>
        <div class="rounded-lg border border-(--color-light-gray-2) p-4">
          <p class="text-xs text-(--color-gray)">{{ t('crm.deals.detail.totalSettled') }}</p>
          <p class="text-lg font-semibold" data-cy="payments-total-settled">{{ currency(totalSettled) }}</p>
        </div>
        <div class="rounded-lg border border-(--color-light-gray-2) p-4">
          <p class="text-xs text-(--color-gray)">{{ t('crm.deals.detail.remainingBalance') }}</p>
          <p class="text-lg font-semibold">
            {{ remainingBalance > 0 ? currency(remainingBalance) : t('crm.deals.detail.fullyPaid') }}
          </p>
          <p class="text-xs text-(--color-gray)" data-cy="payments-receivable-source">
            {{ currency(receivable.amount) }} ·
            {{ receivable.fromQuote ? t('crm.reports.outstandingBalance.receivableSource.quote') : t('crm.reports.outstandingBalance.receivableSource.dealValue') }}
          </p>
        </div>
      </div>

      <div v-if="dealPayments.length === 0" class="py-6 text-center text-sm text-(--color-gray)">
        {{ t('crm.deals.detail.noPayments') }}
      </div>
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
              <th class="py-2" />
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
        <h3 class="text-base font-semibold">{{ t('crm.deals.detail.paymentScheduleTitle') }}</h3>
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

      <div v-if="dealInstallments.length === 0" class="py-6 text-center text-sm text-(--color-gray)">
        {{ t('crm.deals.detail.noInstallments') }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-120 text-sm">
          <thead>
            <tr class="border-b border-(--color-light-gray-2) text-left text-xs text-(--color-gray)">
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnDueDate') }}</th>
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnAmount') }}</th>
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnStatus') }}</th>
              <th class="py-2 font-normal">{{ t('crm.deals.detail.columnNote') }}</th>
              <th class="py-2" />
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
      @submit="onSubmitPayment"
    />

    <CrmAddPaymentInstallmentModal
      v-model:open="addInstallmentOpen"
      @submit="onAddInstallment"
    />

    <CrmGeneratePaymentScheduleModal
      v-model:open="generateScheduleOpen"
      :default-total-amount="remainingBalance"
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
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const paymentsStore = usePaymentsStore()
const paymentInstallmentsStore = usePaymentInstallmentsStore()
const quotesStore = useQuotesStore()

const { dealId, deal } = useCurrentDeal()

onMounted(() => {
  paymentsStore.fetchForDeal(dealId).catch(notifyApiError)
  paymentInstallmentsStore.fetchForDeal(dealId).catch(notifyApiError)
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

const onSubmitPayment = async (payment: PaymentPayload) => {
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
    notifyApiError(err)
    return false
  }
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
    notifyApiError(err)
    return false
  }
}

const generateScheduleOpen = ref(false)

const onGenerateSchedule = async (installments: { amount: number, due_date: Date, note: string }[]) => {
  try {
    await paymentInstallmentsStore.bulkAdd(dealId, installments)
    success(t('crm.deals.detail.generateScheduleSuccess', { count: installments.length }))
  } catch (err) {
    notifyApiError(err)
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
