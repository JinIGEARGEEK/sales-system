<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.addQuoteModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputDatePicker v-model="form.validity_date" :label="t('crm.components.addQuoteModal.validUntil')" name="validity_date" />
          <InputSelect v-model="form.status" :options="QUOTE_STATUS_OPTIONS" :label="t('crm.components.addQuoteModal.status')" name="status" rules="required" />
        </div>

        <div class="mt-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium">{{ t('crm.components.addQuoteModal.items') }}</span>
            <ButtonPrimary
              :label="t('crm.components.addQuoteModal.addItem')"
              icon="material-symbols:add"
              outline
              small
              @click="addItemRow"
            />
          </div>

          <p v-if="items.length === 0" class="text-sm text-[var(--color-gray)]">{{ t('crm.components.addQuoteModal.noItems') }}</p>

          <!-- Capped + internally scrolling: an arbitrary number of line items
          shouldn't be able to push the modal's header/footer off-screen. -->
          <div class="max-h-[40vh] overflow-y-auto pr-1">
            <div v-for="(item, index) in items" :key="item.key" class="mb-2 flex items-start gap-2">
              <div class="grid flex-1 grid-cols-1 gap-2">
                <InputSelect
                  :model-value="item.product_id"
                  :options="productOptions"
                  :placeholder="t('crm.components.addQuoteModal.itemProductPlaceholder')"
                  :name="`item-product-${item.key}`"
                  :disable="productOptions.length === 0"
                  @update:model-value="onItemProductChange(item, $event)"
                />
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_6rem_8rem]">
                  <InputText
                    v-model="item.description"
                    :placeholder="t('crm.components.addQuoteModal.itemDescriptionPlaceholder')"
                    :name="`item-description-${item.key}`"
                    rules="required"
                  />
                  <InputText
                    v-model.number="item.qty"
                    type="number"
                    :placeholder="t('crm.components.addQuoteModal.itemQtyPlaceholder')"
                    :name="`item-qty-${item.key}`"
                    rules="required|min_value:1"
                  />
                  <InputText
                    v-model.number="item.price"
                    type="number"
                    :placeholder="t('crm.components.addQuoteModal.itemPricePlaceholder')"
                    :name="`item-price-${item.key}`"
                    rules="required|min_value:0"
                  />
                </div>
              </div>
              <UButton
                icon="material-symbols:close"
                variant="ghost"
                color="error"
                size="xs"
                :aria-label="t('crm.components.addQuoteModal.removeItem')"
                @click="removeItemRow(index)"
              />
            </div>
          </div>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addQuoteModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addQuoteModal.save')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { QUOTE_STATUS_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [quote: { items: QuoteItem[], validity_date: Date | null, status: QuoteStatus }]
}>()

const emptyForm = () => ({
  validity_date: '',
  status: 'draft' as QuoteStatus,
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

// Optional Product picker per line item — additive on top of the existing
// free-text flow, not a replacement for it. Selecting a product just
// prefills description/price (still editable afterward); leaving it unset
// ("none") behaves exactly as before this field existed.
const { notifyApiError } = useApiErrorNotifier()
const productsStore = useProductsStore()
const productOptions = computed(() => productsStore.items
  .filter(p => p.is_active)
  .map(p => ({ label: p.name, value: String(p.id) })))

let nextItemKey = 0
const items = ref<{ key: number, description: string, qty: number, price: number, product_id: string | null }[]>([])

const addItemRow = () => {
  items.value.push({ key: nextItemKey++, description: '', qty: 1, price: 0, product_id: null })
}

const removeItemRow = (index: number) => {
  items.value.splice(index, 1)
}

const onItemProductChange = (item: { description: string, price: number, product_id: string | null }, value: string | number | null) => {
  item.product_id = value === null ? null : String(value)
  const product = productsStore.items.find(p => String(p.id) === item.product_id)
  if (!product) return
  item.description = product.name
  item.price = product.price
}

// items isn't part of `form` (it's a dynamic list, not a fixed field set), so
// it needs its own reset-on-open alongside useModalForm's — same "reset on
// open, not close" rule.
watch(() => props.open, (value) => {
  if (value) {
    items.value = []
    if (productsStore.items.length === 0) productsStore.fetchAll().catch(notifyApiError)
  }
})

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  emit('submit', {
    items: items.value.map(({ description, qty, price, product_id }) => ({
      description,
      qty,
      price,
      product_id: product_id ? Number(product_id) : null,
    })),
    validity_date: form.validity_date ? new Date(form.validity_date) : null,
    status: form.status,
  })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
