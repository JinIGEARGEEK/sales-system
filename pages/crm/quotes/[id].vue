<template>
  <div class="p-5">
    <div v-if="quote && deal">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UButton
            icon="material-symbols:arrow-back"
            variant="ghost"
            color="neutral"
            class="cursor-pointer p-0 hover:bg-transparent"
            :aria-label="t('global.back')"
            @click="navigateTo(`/crm/deals/${deal.id}/quotes`)"
          />
          <h2 class="text-xl font-black">{{ quote.number || `#${quote.id}` }}</h2>
          <UBadge :color="quoteStatusBadgeColor(quote.status)" variant="subtle">{{ quote.status }}</UBadge>
        </div>
        <ButtonPrimary :label="t('crm.quotes.detail.save')" outline icon="material-symbols:edit-outline" :loading="loading" @click="onSaveClick" />
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <ContainerTemplate>
            <Form ref="formRef" @submit="onSave">
              <!-- Read-only, derived from the parent Deal — never duplicated
              as new Quote fields, same rule already established for
              Company/Contact on FR-CRM-046 (the Quote form doesn't need to
              re-store what's already implicit via deal_id). -->
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p class="text-xs text-[var(--color-gray)]">{{ t('crm.quotes.editor.company') }}</p>
                  <p class="text-sm font-medium">{{ company?.name }}</p>
                  <p v-if="company?.address" class="mt-1 whitespace-pre-wrap text-xs text-[var(--color-gray)]">{{ company.address }}</p>
                </div>
                <div>
                  <p class="text-xs text-[var(--color-gray)]">{{ t('crm.quotes.editor.contactPerson') }}</p>
                  <p class="text-sm font-medium">{{ contact?.name }}</p>
                  <p v-if="contact?.phone" class="text-xs text-[var(--color-gray)]">{{ contact.phone }}</p>
                </div>
                <div>
                  <p class="text-xs text-[var(--color-gray)]">{{ t('crm.quotes.editor.salesRep') }}</p>
                  <p class="text-sm font-medium">{{ teamMembersStore.nameById(deal.assigned_to) }}</p>
                </div>
                <div>
                  <p class="text-xs text-[var(--color-gray)]">{{ t('crm.quotes.editor.currency') }}</p>
                  <p class="text-sm font-medium">THB</p>
                </div>
                <div>
                  <p class="text-xs text-[var(--color-gray)]">{{ t('crm.quotes.editor.project') }}</p>
                  <p class="text-sm font-medium">{{ dealProject?.name ?? t('crm.quotes.editor.projectNone') }}</p>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputText v-model="form.reference_number" :label="t('crm.quotes.editor.referenceNumber')" :placeholder="t('crm.quotes.editor.referenceNumberPlaceholder')" name="reference_number" />
                <InputSelect v-model="form.status" :options="QUOTE_STATUS_OPTIONS" :label="t('crm.quotes.editor.status')" name="status" rules="required" />
                <InputDatePicker v-model="form.issue_date" :label="t('crm.quotes.editor.issueDate')" name="issue_date" />
                <InputText v-model.number="form.credit_days" type="number" :label="t('crm.quotes.editor.creditDays')" name="credit_days" rules="min_value:0" />
                <InputDatePicker v-model="form.validity_date" :label="t('crm.quotes.editor.dueDate')" name="validity_date" />
                <InputSelect v-model="form.price_type" :options="PRICE_TYPE_OPTIONS" :label="t('crm.quotes.editor.priceType')" name="price_type" />
              </div>

              <InputTextarea
                v-model="form.scope_of_work"
                :label="t('crm.quotes.editor.scopeOfWork')"
                :placeholder="t('crm.quotes.editor.scopeOfWorkPlaceholder')"
                name="scope_of_work"
                rows="4"
                class="mt-3"
              />

              <div class="mt-4">
                <CrmQuoteItemsEditor v-model="items" />
              </div>

              <!-- Discount/VAT/WHT toggles + the live totals breakdown —
              mirrors utils.ComputeQuoteTotals on the backend exactly (see
              useQuoteTotals) so this and the exported PDF never disagree. -->
              <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputText v-model.number="form.discount_total" type="number" :label="t('crm.quotes.editor.discountTotal')" name="discount_total" rules="min_value:0" />
                <div class="flex items-end gap-4">
                  <UCheckbox v-model="form.vat_enabled" :label="t('crm.quotes.editor.vatEnabled')" />
                  <UCheckbox v-model="form.wht_enabled" :label="t('crm.quotes.editor.whtEnabled')" />
                </div>
                <InputText
                  v-if="form.wht_enabled"
                  v-model.number="form.wht_rate"
                  type="number"
                  :label="t('crm.quotes.editor.whtRateLabel')"
                  :placeholder="t('crm.quotes.editor.whtRatePlaceholder')"
                  name="wht_rate"
                  rules="min_value:0"
                />
              </div>

              <div class="mt-4 flex flex-col gap-1 border-t border-[var(--color-light-gray-2)] pt-3 text-sm">
                <div class="flex justify-between"><span class="text-[var(--color-gray)]">{{ t('crm.quotes.editor.subtotal') }}</span><span>{{ t('global.currencySymbol') }}{{ priceFormat(totals.subtotal) }}</span></div>
                <div v-if="form.discount_total > 0" class="flex justify-between"><span class="text-[var(--color-gray)]">{{ t('crm.quotes.editor.discountTotal') }}</span><span>-{{ t('global.currencySymbol') }}{{ priceFormat(totals.discountTotal) }}</span></div>
                <div v-if="form.vat_enabled" class="flex justify-between"><span class="text-[var(--color-gray)]">{{ t('crm.quotes.editor.vatEnabled') }}</span><span>{{ t('global.currencySymbol') }}{{ priceFormat(totals.vat) }}</span></div>
                <div v-if="form.wht_enabled" class="flex justify-between"><span class="text-[var(--color-gray)]">{{ t('crm.quotes.editor.whtEnabled') }}</span><span>-{{ t('global.currencySymbol') }}{{ priceFormat(totals.wht) }}</span></div>
                <div class="flex justify-between text-base font-semibold"><span>{{ t('crm.quotes.editor.grandTotal') }}</span><span>{{ t('global.currencySymbol') }}{{ priceFormat(totals.grandTotal) }}</span></div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputTextarea v-model="form.notes" :label="t('crm.quotes.editor.notes')" :placeholder="t('crm.quotes.editor.notesPlaceholder')" name="notes" rows="3" />
                <InputTextarea v-model="form.internal_notes" :label="t('crm.quotes.editor.internalNotes')" :placeholder="t('crm.quotes.editor.internalNotesPlaceholder')" name="internal_notes" rows="3" />
              </div>
            </Form>
          </ContainerTemplate>
        </div>

        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold">{{ t('crm.quotes.editor.grandTotal') }}</h3>
              </div>
            </template>
            <p class="text-2xl font-black text-[var(--color-primary)]">{{ t('global.currencySymbol') }}{{ priceFormat(totals.grandTotal) }}</p>
          </UCard>

          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold">{{ t('crm.quotes.editor.attachments') }}</h3>
                <ButtonPrimary :label="t('crm.quotes.editor.addAttachment')" icon="material-symbols:add" small @click="addAttachmentOpen = true" />
              </div>
            </template>
            <CrmAttachmentList :attachments="quoteAttachments" @remove="onRemoveAttachment" />
          </UCard>
        </div>
      </div>

      <CrmAddAttachmentModal v-model:open="addAttachmentOpen" @submit="onAddAttachment" />
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.quotes.detail.quoteNotFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { QUOTE_STATUS_OPTIONS } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.quotes.detail.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { priceFormat } = useFormatter()
const { quoteStatusBadgeColor } = useQuoteStatusColor()

const quotesStore = useQuotesStore()
const dealsStore = useDealsStore()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const teamMembersStore = useTeamMembersStore()
const projectsStore = useProjectsStore()
const attachmentsStore = useAttachmentsStore()

const quoteId = Number(route.params.id)
const quote = computed(() => quotesStore.items.find(q => q.id === quoteId) ?? null)
const deal = computed(() => quote.value ? dealsStore.items.find(d => d.id === quote.value!.deal_id) ?? null : null)
const company = computed(() => deal.value ? companiesStore.items.find(c => c.id === deal.value!.company_id) ?? null : null)
const contact = computed(() => deal.value ? contactsStore.items.find(c => c.id === deal.value!.contact_id) ?? null : null)
// Projects are created downstream of a Deal (typically after Won/Signed —
// FR-CRM-048/068), not picked at Quote-creation time, so this is a read-only
// display of whichever Project already links back to this Quote's Deal (if
// any), not a selectable field — there's no project_id on Quote to store a
// pick in, and adding one wasn't part of this rebuild's scope.
const dealProject = computed(() => deal.value ? projectsStore.items.find(p => p.deal_id === deal.value!.id) ?? null : null)

onMounted(async () => {
  try {
    if (!quote.value) await quotesStore.fetchOne(quoteId)
  } catch (err) {
    notifyApiError(err)
    return
  }
  if (dealsStore.items.length === 0) await dealsStore.fetchAll().catch(notifyApiError)
  if (companiesStore.items.length === 0) companiesStore.fetchAll().catch(notifyApiError)
  if (contactsStore.items.length === 0) contactsStore.fetchAll().catch(notifyApiError)
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
  if (projectsStore.items.length === 0) projectsStore.fetchAll().catch(notifyApiError)
  attachmentsStore.fetchForRelated('quote', quoteId).catch(notifyApiError)
})

const PRICE_TYPE_OPTIONS: Select[] = [
  { label: t('crm.quotes.editor.priceTypeExclTax'), value: 'excl_tax' },
  { label: t('crm.quotes.editor.priceTypeInclTax'), value: 'incl_tax' },
]

// Not a modal (no "reset on reopen" behavior needed — this is an edit page,
// populated once below from the loaded Quote), but reuses useModalForm's
// formRef typing + validateThenSubmit dance anyway, same as
// pages/admin/pipeline-config.vue's salesQuotaForm: the Save button lives
// outside the <Form> (in the page header, next to the back button), so
// without this it would fire the PUT request straight past every field's
// vee-validate rules (status `required`, item qty/price/discount `min_value`,
// credit_days/discount_total/wht_rate `min_value:0`).
const { form, formRef, validateThenSubmit, loading, guard } = useModalForm(() => false, () => ({
  scope_of_work: '',
  validity_date: '',
  status: 'draft' as QuoteStatus,
  reference_number: '',
  issue_date: '',
  credit_days: 0,
  price_type: 'excl_tax' as QuotePriceType,
  vat_enabled: true,
  wht_enabled: false,
  wht_rate: 0,
  discount_total: 0,
  notes: '',
  internal_notes: '',
}))

let nextItemKey = 0
const items = ref<QuoteItemRow[]>([])

// Populate the form/items from the loaded Quote exactly once it's
// available — this is an edit page, not a create form, so there's no
// "reset on open" concern (useModalForm's pattern doesn't apply here).
watch(quote, (value) => {
  if (!value) return
  form.scope_of_work = value.scope_of_work
  form.validity_date = value.validity_date ? value.validity_date.toISOString().slice(0, 10) : ''
  form.status = value.status
  form.reference_number = value.reference_number ?? ''
  form.issue_date = value.issue_date ? value.issue_date.toISOString().slice(0, 10) : ''
  form.credit_days = value.credit_days
  form.price_type = value.price_type
  form.vat_enabled = value.vat_enabled
  form.wht_enabled = value.wht_enabled
  form.wht_rate = value.wht_rate
  form.discount_total = value.discount_total
  form.notes = value.notes ?? ''
  form.internal_notes = value.internal_notes ?? ''
  items.value = value.items.map(item => ({
    key: nextItemKey++,
    description: item.description,
    qty: item.qty,
    price: item.price,
    product_id: item.product_id ? String(item.product_id) : null,
    kind: item.product_id ? 'product' : 'scope',
    discount_percent: item.discount_percent ?? 0,
  }))
}, { immediate: true })

const totals = computed(() => useQuoteTotals(items.value, form.discount_total, form.vat_enabled, form.wht_enabled, form.wht_rate))

const onSave = guard(async () => {
  if (!quote.value) return
  try {
    await quotesStore.update(quote.value.id, {
      items: items.value.map(({ description, qty, price, product_id, discount_percent }) => ({
        description, qty, price, product_id: product_id ? Number(product_id) : null, discount_percent,
      })),
      scope_of_work: form.scope_of_work,
      validity_date: form.validity_date ? new Date(form.validity_date) : null,
      status: form.status,
      reference_number: form.reference_number || null,
      issue_date: form.issue_date ? new Date(form.issue_date) : null,
      credit_days: form.credit_days,
      price_type: form.price_type,
      vat_enabled: form.vat_enabled,
      wht_enabled: form.wht_enabled,
      wht_rate: form.wht_rate,
      discount_total: form.discount_total,
      notes: form.notes || null,
      internal_notes: form.internal_notes || null,
    })
    success(t('crm.quotes.detail.saveSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})

const onSaveClick = () => validateThenSubmit(onSave)

const addAttachmentOpen = ref(false)
const quoteAttachments = computed(() => attachmentsStore.forRelated('quote', quoteId))

const onAddAttachment = async (payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }) => {
  try {
    if ('file' in payload) {
      await attachmentsStore.addFile('quote', quoteId, payload.category, payload.file)
    } else {
      await attachmentsStore.addLink('quote', quoteId, payload.category, payload.fileName, payload.externalUrl)
    }
    success(t('crm.quotes.detail.addAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const onRemoveAttachment = async (id: number) => {
  try {
    await attachmentsStore.remove(id)
    success(t('crm.quotes.detail.removeAttachmentSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}
</script>
