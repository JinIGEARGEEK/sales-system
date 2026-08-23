<template>
  <!-- Wider than UModal's max-w-lg default: with a Scope of Work textarea
  plus a per-row kind toggle, description, and qty/price columns, the
  narrower default cramped every field in the items section. -->
  <UModal :open="open" :ui="{ content: 'sm:max-w-2xl' }" @update:open="onUpdateOpen">
    <template #header>
      <h3 class="text-lg font-medium">{{ t('crm.components.addQuoteModal.title') }}</h3>
    </template>
    <template #body>
      <Form ref="formRef" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputDatePicker v-model="form.validity_date" :label="t('crm.components.addQuoteModal.validUntil')" name="validity_date" />
          <InputSelect v-model="form.status" :options="QUOTE_STATUS_OPTIONS" :label="t('crm.components.addQuoteModal.status')" name="status" rules="required" />
        </div>

        <!-- Whole-quote narrative (deliverables/phases/terms) — distinct from each
        line item's own short description below, and separate from what actually
        gets priced. Optional; prints as a paragraph above the line-items table
        in the exported PDF. -->
        <InputTextarea
          v-model="form.scope_of_work"
          :label="t('crm.components.addQuoteModal.scopeOfWork')"
          :placeholder="t('crm.components.addQuoteModal.scopeOfWorkPlaceholder')"
          name="scope_of_work"
          rows="4"
          class="mt-3"
        />

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
          <!-- Live sum of qty*price across all rows — the exported PDF has
          always computed this Grand Total, but nothing showed it here while
          a rep is still splitting the deal's value into per-feature/service
          line items, so there was no way to check the breakdown adds back up
          to the intended total without saving first. -->
          <p v-else class="mb-2 text-right text-sm font-medium">
            {{ t('crm.components.addQuoteModal.total') }}: {{ t('global.currencySymbol') }}{{ priceFormat(itemsTotal) }}
          </p>

          <!-- Capped + internally scrolling: an arbitrary number of line items
          shouldn't be able to push the modal's header/footer off-screen. -->
          <div class="max-h-[40vh] overflow-y-auto pr-1">
            <div v-for="(item, index) in items" :key="item.key" class="mb-2 flex items-start gap-2">
              <div class="grid flex-1 grid-cols-1 gap-2">
                <!-- Explicit choice up front, not inferred from whether a
                product happens to be picked: a rep decides what a row *is*
                before filling it in, rather than the Product picker sitting
                above the description on every row looking like a mandatory
                first step. "scope" rows are a custom scope/feature of a
                Project, priced by hand and never show the Product picker at
                all; "product" rows are one of the company's own packaged
                Products, priced from the Catalog. -->
                <URadioGroup
                  :model-value="item.kind"
                  orientation="horizontal"
                  size="sm"
                  :ui="{ base: 'ring-2 ring-[var(--color-gray)]' }"
                  :items="[
                    { label: t('crm.components.addQuoteModal.itemKindScope'), value: 'scope' },
                    { label: t('crm.components.addQuoteModal.itemKindProduct'), value: 'product' },
                  ]"
                  @update:model-value="onItemKindChange(item, $event)"
                />
                <InputSelect
                  v-if="item.kind === 'product'"
                  :model-value="item.product_id"
                  :options="productOptionsFor(item)"
                  :placeholder="t('crm.components.addQuoteModal.itemProductPlaceholder')"
                  :name="`item-product-${item.key}`"
                  :disable="productOptionsFor(item).length === 0"
                  @update:model-value="onItemProductChange(item, $event)"
                />
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_6rem_8rem]">
                  <!-- Not required (unlike qty/price): the deal-prefilled row starts
                  blank now that its narrative lives in Scope of Work above, and a
                  rep should be able to save a quote with a bare product-linked line
                  item too. A blank description just renders as an empty cell in the
                  exported PDF's line-items table — a rep's own responsibility, not
                  something worth blocking Save over. -->
                  <InputTextarea
                    v-model="item.description"
                    :placeholder="t('crm.components.addQuoteModal.itemDescriptionPlaceholder')"
                    :name="`item-description-${item.key}`"
                    rows="2"
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
  deal?: Deal | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [quote: { items: QuoteItem[], scope_of_work: string, validity_date: Date | null, status: QuoteStatus }]
}>()

const emptyForm = () => ({
  // Pre-fill from the parent Deal's title (FR-CRM-046) — this is project-level
  // narrative ("what is this"), so it belongs here, not copied into a line
  // item's own short description (see the items watcher below).
  scope_of_work: props.deal?.title ?? '',
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
const activeProductOptions = computed(() => productsStore.items
  .filter(p => p.is_active)
  .map(p => ({ label: p.name, value: String(p.id) })))

// A line item's product_id can end up pointing at a Product that's since
// been deactivated (e.g. this Quote references a Product picked before it
// was deactivated in the Catalog, or a stale product_id from before this
// modal was reset) — without this, the picker would show the placeholder
// instead of the actual selected product, or silently blank the field.
// Mirrors pages/crm/companies/[id].vue's industryOptions/companySizeOptions/
// revenueSizeOptions pattern for the exact same "deactivated but still
// referenced" case, applied per-item since different rows can each
// reference a different deactivated Product.
const productOptionsFor = (item: QuoteItemRow) => {
  const current = item.product_id
  if (!current || activeProductOptions.value.some(o => o.value === current)) return activeProductOptions.value
  const inactive = productsStore.items.find(p => String(p.id) === current)
  if (!inactive) return activeProductOptions.value
  return [...activeProductOptions.value, { label: inactive.name, value: String(inactive.id) }]
}

const { priceFormat } = useFormatter()

type QuoteItemRow = { key: number, description: string, qty: number, price: number, product_id: string | null, kind: 'scope' | 'product' }

let nextItemKey = 0
const items = ref<QuoteItemRow[]>([])

const itemsTotal = computed(() => items.value.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0))

const addItemRow = () => {
  items.value.push({ key: nextItemKey++, description: '', qty: 1, price: 0, product_id: null, kind: 'scope' })
}

const removeItemRow = (index: number) => {
  items.value.splice(index, 1)
}

// Switching back to "scope" drops any product link — a scope row has no
// Product picker visible at all, so a stale product_id must not silently
// ride along to submit. Switching to "product" leaves description/price as
// they are (typically still blank) until a Product is actually picked below.
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

// items isn't part of `form` (it's a dynamic list, not a fixed field set), so
// it needs its own reset-on-open alongside useModalForm's — same "reset on
// open, not close" rule.
watch(() => props.open, (value) => {
  if (value) {
    // Pre-fill a single line item from the parent Deal (FR-CRM-046) so a
    // simple one-line quote doesn't start from a completely blank form —
    // still fully editable, and skipped entirely if no Deal was passed in.
    // description starts blank (not the Deal's title) since that narrative
    // now lives in scope_of_work above — the item description field is no
    // longer required, so this doesn't block Save the way it briefly did
    // when this was tried before the field's `rules="required"` was removed.
    items.value = props.deal
      ? [{ key: nextItemKey++, description: '', qty: 1, price: props.deal.value, product_id: null, kind: 'scope' }]
      : []
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
    scope_of_work: form.scope_of_work,
    validity_date: form.validity_date ? new Date(form.validity_date) : null,
    status: form.status,
  })
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
