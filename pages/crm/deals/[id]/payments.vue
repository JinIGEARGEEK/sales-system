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
        <div class="rounded-lg border border-[var(--color-light-gray-2)] p-4">
          <p class="text-xs text-[var(--color-gray)]">{{ t('crm.deals.detail.totalPaid') }}</p>
          <p class="text-lg font-semibold">{{ priceFormat(totalPaid) }}</p>
        </div>
        <div class="rounded-lg border border-[var(--color-light-gray-2)] p-4">
          <p class="text-xs text-[var(--color-gray)]">{{ t('crm.deals.detail.remainingBalance') }}</p>
          <p class="text-lg font-semibold">
            {{ remainingBalance > 0 ? priceFormat(remainingBalance) : t('crm.deals.detail.fullyPaid') }}
          </p>
        </div>
      </div>

      <div v-if="dealPayments.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.deals.detail.noPayments') }}
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--color-light-gray-2)] text-left text-xs text-[var(--color-gray)]">
            <th class="py-2 font-normal">{{ t('crm.deals.detail.columnDate') }}</th>
            <th class="py-2 font-normal">{{ t('crm.deals.detail.columnAmount') }}</th>
            <th class="py-2 font-normal">{{ t('crm.deals.detail.columnMethod') }}</th>
            <th class="py-2 font-normal">{{ t('crm.deals.detail.columnNote') }}</th>
            <th class="py-2" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in dealPayments" :key="payment.id" class="border-b border-[var(--color-light-gray-2)]">
            <td class="py-2">{{ dateFormat(payment.paid_at) }}</td>
            <td class="py-2">{{ priceFormat(payment.amount) }}</td>
            <td class="py-2 capitalize">{{ payment.method }}</td>
            <td class="py-2 text-[var(--color-gray)]">{{ payment.note || '-' }}</td>
            <td class="py-2 text-right">
              <UButton
                icon="material-symbols:delete-outline"
                variant="ghost"
                color="error"
                size="xs"
                :aria-label="t('crm.deals.detail.removePayment')"
                @click="onRemovePayment(payment.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </ContainerTemplate>

    <CrmAddPaymentModal
      v-model:open="addPaymentOpen"
      @submit="onAddPayment"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { priceFormat, dateFormat } = useFormatter()
const { success } = useNotify()
const paymentsStore = usePaymentsStore()

const { dealId, deal } = useCurrentDeal()

onMounted(() => {
  paymentsStore.fetchForDeal(dealId)
})

const addPaymentOpen = ref(false)
const dealPayments = computed(() => paymentsStore.forDeal(dealId))
const totalPaid = computed(() => paymentsStore.totalForDeal(dealId))
const remainingBalance = computed(() => (deal.value ? deal.value.value - totalPaid.value : 0))

const onAddPayment = async (payment: { amount: number, paid_at: Date, method: PaymentMethod, note: string }) => {
  await paymentsStore.add(dealId, payment)
  success(t('crm.deals.detail.addPaymentSuccess'))
}

const onRemovePayment = async (id: number) => {
  await paymentsStore.remove(id)
  success(t('crm.deals.detail.removePaymentSuccess'))
}
</script>
