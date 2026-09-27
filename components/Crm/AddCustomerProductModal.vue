<template>
  <UModal :open="open" :title="record ? t('crm.components.addCustomerProductModal.editTitle') : t('crm.components.addCustomerProductModal.title')" @update:open="onUpdateOpen">
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
            :disable="productOptions.length === 0"
            rules="required"
          />
          <div v-else>
            <p class="mb-1 text-xs text-(--color-gray)">{{ t('crm.components.addCustomerProductModal.product') }}</p>
            <p class="text-sm font-medium">{{ record.product.name }}</p>
          </div>
          <InputSelect
            v-model="form.status"
            :options="CUSTOMER_PRODUCT_STATUS_OPTIONS"
            :label="t('crm.components.addCustomerProductModal.status')"
            name="status"
            rules="required"
          />
          <InputSelect
            v-if="!record && dealOptions.length > 0"
            v-model="form.source_deal_id"
            :options="dealOptions"
            :label="t('crm.components.addCustomerProductModal.deal')"
            :placeholder="t('crm.components.addCustomerProductModal.dealPlaceholder')"
            name="source_deal_id"
          />
          <div v-else-if="record?.source_deal_id">
            <p class="mb-1 text-xs text-(--color-gray)">{{ t('crm.components.addCustomerProductModal.deal') }}</p>
            <NuxtLink :to="`/crm/deals/${record.source_deal_id}`" class="text-sm font-medium text-(--color-primary) hover:underline">
              {{ linkedDealTitle }}
            </NuxtLink>
          </div>
          <InputDatePicker v-if="!record" v-model="form.start_date" :label="t('crm.components.addCustomerProductModal.startDate')" name="start_date" />
          <!-- end_date is only ever settable via PATCH /customer-products/:id (edit mode) —
               api-system-spec.md §8.2 doesn't accept it on the create endpoint, so showing
               it during create would silently discard whatever the rep typed in. -->
          <InputDatePicker v-if="record" v-model="form.end_date" :label="t('crm.components.addCustomerProductModal.endDate')" name="end_date" />
          <!-- Renewal (informational — invoicing stays in FlowAccount, charged
               via a Contract). An Active record with a renewal date feeds the
               "Product renewal coming up" notification rule. -->
          <div class="rounded-lg border border-sky-300 bg-sky-50 p-3">
            <p class="mb-2 text-xs text-(--color-dark-gray)">{{ t('crm.components.addCustomerProductModal.renewalHint') }}</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <InputDatePicker
                  v-model="form.renewal_date"
                  :label="t('crm.components.addCustomerProductModal.renewalDate')"
                  name="renewal_date"
                  data-cy="customer-product-renewal-date"
                />
                <UButton v-if="form.renewal_date" class="mt-1 px-0" variant="link" size="xs" @click="form.renewal_date = ''">
                  {{ t('crm.components.addCustomerProductModal.clearRenewalDate') }}
                </UButton>
              </div>
              <InputSelect
                v-model="form.billing_cycle"
                :options="billingCycleOptions"
                :label="t('crm.components.addCustomerProductModal.billingCycle')"
                name="billing_cycle"
                data-cy="customer-product-billing-cycle"
              />
              <InputText
                v-model="form.price"
                :label="t('crm.components.addCustomerProductModal.price')"
                thousands
                :decimals="2"
                name="price"
                data-cy="customer-product-price"
              />
            </div>
          </div>
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addCustomerProductModal.cancel')" cancel data-cy="customer-product-cancel" @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addCustomerProductModal.save')" :loading="loading" data-cy="customer-product-save" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CUSTOMER_PRODUCT_STATUS_OPTIONS } from '~/constants/mockData'
import type { CustomerProductRenewalFields } from '~/stores/customerProducts'

const { t } = useI18n()
const { toDateInputValue } = useFormatter()

const props = defineProps<{
  open: boolean
  products: Product[]
  // Fixed company this record belongs to (the Company detail page's Products
  // tab) — used only to filter the optional Deal picker below, same role as
  // AddProjectModal's `companyId` prop.
  companyId?: number | null
  // Passing an existing record switches this into edit mode — product and its
  // originating Deal are immutable after creation (internal/handlers/products.go's
  // UpdateCustomerProduct: only status/end_date can change), so both show as
  // read-only there.
  record?: CustomerProduct | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { product_id: number, status: CustomerProductStatus, start_date: Date | null, source_deal_id: number | null } & CustomerProductRenewalFields, product: Product]
  update: [payload: { status: CustomerProductStatus, end_date: Date | null } & CustomerProductRenewalFields]
}>()

// InputSelect can't carry an empty-string value (Reka's SelectItem rejects it).
const NO_BILLING_CYCLE = 'none'
const billingCycleOptions = computed<Select[]>(() => [
  { label: t('crm.components.addCustomerProductModal.billingCycleNone'), value: NO_BILLING_CYCLE },
  { label: t('crm.components.addCustomerProductModal.billingCycleOptions.monthly'), value: 'monthly' },
  { label: t('crm.components.addCustomerProductModal.billingCycleOptions.yearly'), value: 'yearly' },
  { label: t('crm.components.addCustomerProductModal.billingCycleOptions.one_time'), value: 'one_time' },
])

const productOptions = computed(() => props.products.map(p => ({ label: p.name, value: String(p.id) })))

const dealsStore = useDealsStore()
const { notifyApiError } = useApiErrorNotifier()

// Scoped to props.companyId, not the global dealsStore cache — fetchAll()
// (wherever the parent warms it) is capped at 200 rows, newest-first (see
// stores/companies.ts's fetchAll doc), so an older Deal belonging to this
// Company could otherwise never appear in this picker at all. useScopedFetch
// also guards against a slow request for a previously-selected Company
// resolving after a faster one for the current selection and overwriting it
// with stale results.
const { result: companyDealResults } = useScopedFetch(
  computed(() => props.companyId),
  async (companyId: number) => (await dealsStore.fetchList({ company_id: companyId, per_page: 200 })).items,
  [] as Deal[],
)
const dealOptions = computed(() => companyDealResults.value.map(d => ({ label: d.title, value: String(d.id) })))

const linkedDealTitle = computed(() => dealsStore.items.find(d => d.id === props.record?.source_deal_id)?.title ?? `#${props.record?.source_deal_id}`)
watch(() => props.record?.source_deal_id, (dealId) => {
  if (dealId && !dealsStore.items.some(d => d.id === dealId)) dealsStore.fetchOne(dealId).catch(notifyApiError)
}, { immediate: true })

const emptyForm = () => ({
  product_id: props.record ? String(props.record.product_id) : '',
  status: props.record?.status ?? ('Interested' as CustomerProductStatus),
  source_deal_id: '',
  start_date: toDateInputValue(new Date()),
  end_date: props.record?.end_date ? toDateInputValue(props.record.end_date) : '',
  // Already 'YYYY-MM-DD' (date-only) — InputDatePicker's own v-model format.
  renewal_date: props.record?.renewal_date ?? '',
  billing_cycle: props.record?.billing_cycle ?? NO_BILLING_CYCLE,
  // '' = blank (the thousands input itself emits null when cleared).
  price: (props.record?.price ?? '') as number | '',
})

const renewalPayload = (): CustomerProductRenewalFields => ({
  renewal_date: form.renewal_date || null,
  billing_cycle: form.billing_cycle === NO_BILLING_CYCLE ? null : form.billing_cycle as CustomerProductBillingCycle,
  price: form.price === '' || (form.price as unknown) === null ? null : Number(form.price),
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// Awaits the caller's save: Save spins until it lands, the guard turns away
// a second click, and the dialog stays open (form intact) if the handler
// resolves `false` or throws.
const submitAndClose = useAwaitableSubmit(() => onUpdateOpen(false))
const updateAndClose = useAwaitableSubmit(() => onUpdateOpen(false), 'update')
const onSubmit = guard(async () => {
  if (props.record) {
    await updateAndClose({ status: form.status, end_date: form.end_date ? new Date(form.end_date) : null, ...renewalPayload() })
    return
  }
  const product = props.products.find(p => p.id === Number(form.product_id))
  if (!product) return
  await submitAndClose({
    product_id: product.id,
    status: form.status,
    start_date: form.start_date ? new Date(form.start_date) : null,
    source_deal_id: form.source_deal_id ? Number(form.source_deal_id) : null,
    ...renewalPayload(),
  }, product)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
