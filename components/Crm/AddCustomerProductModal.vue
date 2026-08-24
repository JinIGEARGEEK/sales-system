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
            :disable="productOptions.length === 0"
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
          <InputSelect
            v-if="!record && dealOptions.length > 0"
            v-model="form.source_deal_id"
            :options="dealOptions"
            :label="t('crm.components.addCustomerProductModal.deal')"
            :placeholder="t('crm.components.addCustomerProductModal.dealPlaceholder')"
            name="source_deal_id"
          />
          <div v-else-if="record?.source_deal_id">
            <p class="mb-1 text-xs text-[var(--color-gray)]">{{ t('crm.components.addCustomerProductModal.deal') }}</p>
            <NuxtLink :to="`/crm/deals/${record.source_deal_id}`" class="text-sm font-medium text-[var(--color-primary)] hover:underline">
              {{ linkedDealTitle }}
            </NuxtLink>
          </div>
          <InputDatePicker v-if="!record" v-model="form.start_date" :label="t('crm.components.addCustomerProductModal.startDate')" name="start_date" />
          <!-- end_date is only ever settable via PATCH /customer-products/:id (edit mode) —
               api-system-spec.md §8.2 doesn't accept it on the create endpoint, so showing
               it during create would silently discard whatever the rep typed in. -->
          <InputDatePicker v-if="record" v-model="form.end_date" :label="t('crm.components.addCustomerProductModal.endDate')" name="end_date" />
        </div>
      </Form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonPrimary :label="t('crm.components.addCustomerProductModal.cancel')" cancel @click="onUpdateOpen(false)" />
        <ButtonPrimary :label="t('crm.components.addCustomerProductModal.save')" :loading="loading" @click="onSave" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CUSTOMER_PRODUCT_STATUS_OPTIONS } from '~/constants/mockData'

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
  submit: [payload: { product_id: number, status: CustomerProductStatus, start_date: Date | null, source_deal_id: number | null }, product: Product]
  update: [payload: { status: CustomerProductStatus, end_date: Date | null }]
}>()

const productOptions = computed(() => props.products.map(p => ({ label: p.name, value: String(p.id) })))

const dealsStore = useDealsStore()
const { notifyApiError } = useApiErrorNotifier()

// Scoped to props.companyId, not the global dealsStore cache — fetchAll()
// (wherever the parent warms it) is capped at 200 rows, newest-first (see
// stores/companies.ts's fetchAll doc), so an older Deal belonging to this
// Company could otherwise never appear in this picker at all.
const companyDealResults = ref<Deal[]>([])
watch(() => props.companyId, async (companyId) => {
  if (!companyId) {
    companyDealResults.value = []
    return
  }
  const { items } = await dealsStore.fetchList({ company_id: companyId, per_page: 200 }).catch((err) => {
    notifyApiError(err)
    return { items: [] as Deal[] }
  })
  companyDealResults.value = items
}, { immediate: true })
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
})

const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => props.open, emptyForm)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

const onSubmit = guard(async () => {
  if (props.record) {
    emit('update', { status: form.status, end_date: form.end_date ? new Date(form.end_date) : null })
    onUpdateOpen(false)
    return
  }
  const product = props.products.find(p => p.id === Number(form.product_id))
  if (!product) return
  emit('submit', {
    product_id: product.id,
    status: form.status,
    start_date: form.start_date ? new Date(form.start_date) : null,
    source_deal_id: form.source_deal_id ? Number(form.source_deal_id) : null,
  }, product)
  onUpdateOpen(false)
})

const onSave = () => validateThenSubmit(onSubmit)
</script>
