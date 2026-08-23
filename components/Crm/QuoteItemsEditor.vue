<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <span class="text-sm font-medium">{{ t('crm.quotes.editor.items') }}</span>
      <ButtonPrimary
        :label="t('crm.quotes.editor.addItem')"
        icon="material-symbols:add"
        outline
        small
        @click="addItemRow"
      />
    </div>

    <p v-if="items.length === 0" class="text-sm text-[var(--color-gray)]">{{ t('crm.quotes.editor.noItems') }}</p>

    <div v-for="(item, index) in items" :key="item.key" class="mb-2 flex items-start gap-2">
      <div class="grid flex-1 grid-cols-1 gap-2">
        <!-- Explicit choice up front, not inferred from whether a product
        happens to be picked: a rep decides what a row *is* before filling
        it in, rather than the Product picker sitting above the
        description on every row looking like a mandatory first step.
        "scope" rows are a custom scope/feature of a Project, priced by
        hand and never show the Product picker at all; "product" rows are
        one of the company's own packaged Products, priced from the
        Catalog. -->
        <URadioGroup
          :model-value="item.kind"
          orientation="horizontal"
          size="sm"
          :ui="{ base: 'ring-2 ring-[var(--color-gray)]' }"
          :items="[
            { label: t('crm.quotes.editor.itemKindScope'), value: 'scope' },
            { label: t('crm.quotes.editor.itemKindProduct'), value: 'product' },
          ]"
          @update:model-value="onItemKindChange(item, $event)"
        />
        <InputSelect
          v-if="item.kind === 'product'"
          :model-value="item.product_id"
          :options="productOptionsFor(item)"
          :placeholder="t('crm.quotes.editor.itemProductPlaceholder')"
          :name="`item-product-${item.key}`"
          :disable="productOptionsFor(item).length === 0"
          @update:model-value="onItemProductChange(item, $event)"
        />
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5rem_7rem_5rem]">
          <!-- Not required: a bare product-linked line item (no free-text
          description) is still a valid row — a blank description just
          renders as an empty cell in the exported PDF's line-items table,
          a rep's own responsibility, not something worth blocking Save. -->
          <InputTextarea
            v-model="item.description"
            :placeholder="t('crm.quotes.editor.itemDescriptionPlaceholder')"
            :name="`item-description-${item.key}`"
            rows="2"
          />
          <InputText
            v-model.number="item.qty"
            type="number"
            :placeholder="t('crm.quotes.editor.itemQtyPlaceholder')"
            :name="`item-qty-${item.key}`"
            rules="required|min_value:1"
          />
          <InputText
            v-model.number="item.price"
            type="number"
            :placeholder="t('crm.quotes.editor.itemPricePlaceholder')"
            :name="`item-price-${item.key}`"
            rules="required|min_value:0"
          />
          <InputText
            v-model.number="item.discount_percent"
            type="number"
            :placeholder="t('crm.quotes.editor.itemDiscountPlaceholder')"
            :name="`item-discount-${item.key}`"
            rules="min_value:0|max_value:100"
          />
        </div>
      </div>
      <UButton
        icon="material-symbols:close"
        variant="ghost"
        color="error"
        size="xs"
        :aria-label="t('crm.quotes.editor.removeItem')"
        @click="removeItemRow(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const items = defineModel<QuoteItemRow[]>({ required: true })

// Optional Product picker per line item — additive on top of the existing
// free-text flow, not a replacement for it. Selecting a product just
// prefills description/price (still editable afterward); leaving it unset
// ("none") behaves exactly as before this field existed.
const { notifyApiError } = useApiErrorNotifier()
const productsStore = useProductsStore()
onMounted(() => {
  if (productsStore.items.length === 0) productsStore.fetchAll().catch(notifyApiError)
})
const activeProductOptions = computed(() => productsStore.items
  .filter(p => p.is_active)
  .map(p => ({ label: p.name, value: String(p.id) })))

// A line item's product_id can end up pointing at a Product that's since
// been deactivated — keep it selectable so an existing Quote never silently
// blanks the field. Mirrors pages/crm/companies/[id].vue's industryOptions/
// companySizeOptions/revenueSizeOptions pattern, applied per-item since
// different rows can each reference a different deactivated Product.
const productOptionsFor = (item: QuoteItemRow) => {
  const current = item.product_id
  if (!current || activeProductOptions.value.some(o => o.value === current)) return activeProductOptions.value
  const inactive = productsStore.items.find(p => String(p.id) === current)
  if (!inactive) return activeProductOptions.value
  return [...activeProductOptions.value, { label: inactive.name, value: String(inactive.id) }]
}

// Computed fresh on every call rather than cached in a counter: the parent
// pages (e.g. pages/crm/quotes/[id].vue) populate `items` asynchronously
// after this component has already mounted with an empty array, so a
// counter seeded once at setup would go stale and could hand out a `key`
// that collides with a row added later by the parent's own watcher.
const nextItemKey = () => Math.max(0, ...items.value.map(i => i.key)) + 1

const addItemRow = () => {
  items.value = [...items.value, { key: nextItemKey(), description: '', qty: 1, price: 0, product_id: null, kind: 'scope', discount_percent: 0 }]
}

const removeItemRow = (index: number) => {
  items.value = items.value.filter((_, i) => i !== index)
}

// Switching back to "scope" drops any product link — a scope row has no
// Product picker visible at all, so a stale product_id must not silently
// ride along to submit. Switching to "product" leaves description/price as
// they are until a Product is actually picked below.
const onItemKindChange = (item: QuoteItemRow, value: string | number | null) => {
  item.kind = value === 'product' ? 'product' : 'scope'
  if (item.kind === 'scope') item.product_id = null
}

const onItemProductChange = (item: QuoteItemRow, value: string | number | null) => {
  item.product_id = value === null ? null : String(value)
  const product = productsStore.items.find(p => String(p.id) === item.product_id)
  if (!product) return
  item.description = product.name
  item.price = product.price
}
</script>
