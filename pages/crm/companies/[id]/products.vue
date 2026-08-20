<template>
  <div>
    <ContainerTemplate>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold">{{ t('crm.companies.detail.productsHeading') }}</h3>
        <ButtonPrimary :label="t('crm.companies.detail.addProduct')" icon="material-symbols:add" small @click="openAddCustomerProduct" />
      </div>
      <div v-if="companyProducts.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
        {{ t('crm.companies.detail.noProducts') }}
      </div>
      <div v-else class="flex flex-col gap-2">
        <button
          v-for="record in companyProducts"
          :key="record.id"
          type="button"
          class="flex items-center justify-between rounded-lg border border-[var(--color-light-gray-2)] px-4 py-3 text-left hover:bg-[var(--color-light-gray-1)]"
          @click="openEditCustomerProduct(record)"
        >
          <div>
            <p class="text-sm font-medium">{{ record.product.name }}</p>
            <p class="text-xs text-[var(--color-gray)]">{{ record.product.category || '-' }}</p>
          </div>
          <UBadge color="neutral" variant="subtle">{{ record.status }}</UBadge>
        </button>
      </div>
    </ContainerTemplate>

    <CrmAddCustomerProductModal
      v-model:open="addCustomerProductOpen"
      :products="activeProducts"
      :record="editingCustomerProduct"
      @submit="onAddCustomerProduct"
      @update="onUpdateCustomerProduct"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const productsStore = useProductsStore()
const customerProductsStore = useCustomerProductsStore()

const companyId = Number(route.params.id)

onMounted(() => {
  if (productsStore.items.length === 0) productsStore.fetchAll().catch(notifyApiError)
  customerProductsStore.fetchForCompany(companyId).catch(notifyApiError)
})

const companyProducts = computed(() => customerProductsStore.forCompany(companyId))
const activeProducts = computed(() => productsStore.items.filter(p => p.is_active))
const addCustomerProductOpen = ref(false)
const editingCustomerProduct = ref<CustomerProduct | null>(null)

const openAddCustomerProduct = () => {
  editingCustomerProduct.value = null
  addCustomerProductOpen.value = true
}

const openEditCustomerProduct = (record: CustomerProduct) => {
  editingCustomerProduct.value = record
  addCustomerProductOpen.value = true
}

const onAddCustomerProduct = async (payload: { product_id: number, status: CustomerProductStatus }, product: Product) => {
  try {
    await customerProductsStore.add(companyId, payload, product)
    success(t('crm.companies.detail.addProductSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onUpdateCustomerProduct = async (payload: { status: CustomerProductStatus, end_date: Date | null }) => {
  if (!editingCustomerProduct.value) return
  try {
    await customerProductsStore.update(editingCustomerProduct.value.id, payload)
    success(t('crm.companies.detail.updateProductSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
