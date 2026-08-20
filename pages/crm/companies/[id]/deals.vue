<template>
  <ContainerTemplate>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold">{{ t('crm.companies.detail.dealsHeading') }}</h3>
      <ButtonPrimary :label="t('crm.companies.detail.addDeal')" icon="material-symbols:add" small @click="navigateTo(`/crm/deals/create?company_id=${companyId}`)" />
    </div>
    <div v-if="companyDeals.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
      {{ t('crm.companies.detail.noDeals') }}
    </div>
    <div v-else class="flex flex-col gap-2">
      <NuxtLink
        v-for="deal in companyDeals"
        :key="deal.id"
        :to="`/crm/deals/${deal.id}`"
        class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 hover:bg-[var(--color-light-gray-1)]"
      >
        <div>
          <p class="text-sm font-medium">{{ deal.title }}</p>
          <p class="text-xs text-[var(--color-gray)]">{{ deal.stage }} · {{ t('global.currencySymbol') }}{{ priceFormatCompact(deal.value) }}</p>
        </div>
        <UIcon name="material-symbols:chevron-right" class="size-5 text-[var(--color-gray)]" />
      </NuxtLink>
    </div>
  </ContainerTemplate>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const { priceFormatCompact } = useFormatter()
const { notifyApiError } = useApiErrorNotifier()
const dealsStore = useDealsStore()

const companyId = Number(route.params.id)

onMounted(() => {
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
})

const companyDeals = computed(() => dealsStore.items.filter(d => d.company_id === companyId))
</script>
