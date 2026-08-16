<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ record ? t('crm.components.addCustomerProductModal.editTitle') : t('crm.components.addCustomerProductModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3">
          <InputSelect
            v-if="!record"
            v-model="form.product_id"
            :options="productOptions"
            :label="t('crm.components.addCustomerProductModal.product')"
            :placeholder="t('crm.components.addCustomerProductModal.productPlaceholder')"
            name="product_id"
            rules="required"
          />
          <div v-else>
            <p class="mb-1 text-xs text-[var(--color-gray)]">{{ t('crm.components.addCustomerProductModal.product') }}</p>
            <p class="text-sm font-medium">{{ record.product.name }}</p>
          </div>
          <InputSelect
            v-model="form.status"
            :options="CUSTOMER_PRODUCT_STATUS_OPTIONS"
            :label="t('crm.components.addCustomerProductModal.status')"
            name="status"
            rules="required"
          />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addCustomerProductModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addCustomerProductModal.save')" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CUSTOMER_PRODUCT_STATUS_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  products: Product[]
  // Passing an existing record switches this into edit mode (status-only,
  // product is immutable after creation) — the parent decides add vs. update
  // on submit based on whether it's holding a record reference.
  record?: CustomerProduct | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { product_id: number, status: CustomerProductStatus }, product: Product]
  update: [payload: { status: CustomerProductStatus, end_date: Date | null }]
}>()

const productOptions = computed(() => props.products.map(p => ({ label: p.name, value: String(p.id) })))

const emptyForm = () => ({
  product_id: props.record ? String(props.record.product_id) : '',
  status: props.record?.status ?? ('Interested' as CustomerProductStatus),
})

const { form, formRef, validateThenSubmit } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = () => {
  if (props.record) {
    emit('update', { status: form.status, end_date: props.record.end_date })
    onUpdateOpen(false)
    return
  }
  const product = props.products.find(p => p.id === Number(form.product_id))
  if (!product) return
  emit('submit', { product_id: product.id, status: form.status }, product)
  onUpdateOpen(false)
}

const onSave = () => validateThenSubmit(onSubmit)
</script>
