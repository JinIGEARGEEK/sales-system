<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.deals.detail.paymentsTitle') }}</h3>
        <ButtonPrimary
          :label="t('crm.deals.detail.addPayment')"
          icon="material-symbols:add"
          small
          @click="addPaymentOpen = true"
        />
      </div>

      <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="rounded-lg border border-(--color-light-gray-2) p-4">
          <p class="text-xs text-(--color-gray)">{{ t('crm.deals.detail.totalPaid') }}</p>
          <p class="text-lg font-semibold">{{ t('global.currencySymbol') }}{{ priceFormat(totalPaid) }}</p>
        </div>
        <div class="rounded-lg border border-(--color-light-gray-2) p-4">
          <p class="text-xs text-(--color-gray)">{{ t('crm.deals.detail.remainingBalance') }}</p>
          <p class="text-lg font-semibold">
            {{ remainingBalance > 0 ? `${t('global.currencySymbol')}${priceFormat(remainingBalance)}` : t('crm.deals.detail.fullyPaid') }}
          </p>
        </div>
      </div>

      <div v-if="dealPayments.length === 0" class="py-6 text-center text-sm text-(--color-gray)">
        {{ t('crm.deals.detail.noPayments') }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-120 text-sm">
          <thead>
            <tr class="border-b border-(--color-light-gray-2) text-left text-xs text-(--color-gray)">
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnDate') }}</th>
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnAmount') }}</th>
              <th class="py-2 font-normal whitespace-nowrap">{{ t('crm.deals.detail.columnMethod') }}</th>
              <th class="py-2 font-normal">{{ t('crm.deals.detail.columnNote') }}</th>
              <th class="py-2" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in dealPayments" :key="payment.id" class="border-b border-(--color-light-gray-2)">
              <td class="py-2 whitespace-nowrap">{{ dateFormat(payment.paid_at) }}</td>
              <td class="py-2 whitespace-nowrap">{{ t('global.currencySymbol') }}{{ priceFormat(payment.amount) }}</td>
              <td class="py-2 whitespace-nowrap capitalize">{{ payment.method }}</td>
              <td class="max-w-48 truncate py-2 text-(--color-gray)">{{ payment.note || '-' }}</td>
              <td class="py-2 text-right">
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
              <td class="py-2 whitespace-nowrap">{{ t('global.currencySymbol') }}{{ priceFormat(s.installment.amount) }}</td>
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
      @submit="onAddPayment"
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
      :body="target ? t('crm.deals.detail.removePaymentConfirmBody', { amount: `${t('global.currencySymbol')}${priceFormat(target.amount)}`, date: dateFormat(target.paid_at) }) : ''"
      @confirm="confirmRemovePayment"
    />

    <CrmConfirmDeleteModal
      v-model:open="installmentDeleteOpen"
      :body="installmentTarget ? t('crm.deals.detail.removeInstallmentConfirmBody', { amount: `${t('global.currencySymbol')}${priceFormat(installmentTarget.amount)}`, date: dateFormat(installmentTarget.due_date) }) : ''"
      @confirm="confirmRemoveInstallment"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { priceFormat, dateFormat } = useFormatter()
const { success } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const paymentsStore = usePaymentsStore()
const paymentInstallmentsStore = usePaymentInstallmentsStore()

const { dealId, deal } = useCurrentDeal()

onMounted(() => {
  paymentsStore.fetchForDeal(dealId).catch(notifyApiError)
  paymentInstallmentsStore.fetchForDeal(dealId).catch(notifyApiError)
})

const addPaymentOpen = ref(false)
const dealPayments = computed(() => paymentsStore.forDeal(dealId))
const totalPaid = computed(() => paymentsStore.totalForDeal(dealId))
const remainingBalance = computed(() => (deal.value ? deal.value.value - totalPaid.value : 0))

const onAddPayment = async (payment: { amount: number, paid_at: Date, method: PaymentMethod, note: string }) => {
  try {
    await paymentsStore.add(dealId, payment)
    success(t('crm.deals.detail.addPaymentSuccess'))
  } catch (err) {
    notifyApiError(err)
  }
}

const { open, target, requestDelete, closeDelete } = useDeleteConfirm<Payment>()

const confirmRemovePayment = async () => {
  if (!target.value) return
  try {
    await paymentsStore.remove(target.value.id)
    success(t('crm.deals.detail.removePaymentSuccess'))
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
  }
}

const generateScheduleOpen = ref(false)

const onGenerateSchedule = async (installments: { amount: number, due_date: Date, note: string }[]) => {
  try {
    await paymentInstallmentsStore.bulkAdd(dealId, installments)
    success(t('crm.deals.detail.generateScheduleSuccess', { count: installments.length }))
  } catch (err) {
    notifyApiError(err)
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
  } catch (err) {
    notifyApiError(err)
  } finally {
    closeInstallmentDelete()
  }
}
</script>
