<template>
  <div class="p-5">
    <div class="mb-4">
      <div class="flex items-center gap-3">
        <UButton
          icon="material-symbols:arrow-back"
          variant="ghost"
          color="neutral"
          class="cursor-pointer p-0 hover:bg-transparent"
          :aria-label="t('global.back')"
          @click="goBack()"
        />
        <h2 class="text-xl font-black">{{ t('crm.quotes.create.heading') }}</h2>
      </div>
      <p v-if="deal" class="text-sm text-(--color-gray)">{{ t('crm.quotes.create.subheading', { title: deal.title }) }}</p>
      <!-- This form only covers the line items/scope/status/validity date —
      reference number, credit days, price type, VAT/WHT, discounts, and notes
      all live on the full editor this redirects to right after creation. That
      split isn't obvious from "Create Quote" alone, so spell it out rather
      than letting a rep think the quote got cut off partway. -->
      <p v-if="deal" class="mt-1 text-xs font-medium text-(--color-primary)">{{ t('crm.quotes.create.stepLabel') }}</p>
    </div>

    <div v-if="!deal" class="py-12 text-center text-(--color-gray)">
      {{ t('crm.quotes.create.missingDeal') }}
    </div>

    <!-- Deliberately minimal: validity date, status, Scope of Work, and line
    items only — the reference/credit-days/price-type/VAT/WHT/notes/
    attachments fields all live on the full edit page this redirects to
    right after creation (pages/crm/quotes/[id].vue). Mirrors the old
    AddQuoteModal's create surface, just as a full page instead of a modal. -->
    <ContainerTemplate v-else>
      <div v-if="templateOptions.length > 0" class="mb-4 flex items-end gap-2">
        <InputSelect
          v-model="selectedTemplateId"
          :options="templateOptions"
          :label="t('crm.quotes.create.useTemplate')"
          :placeholder="t('crm.quotes.create.useTemplatePlaceholder')"
          name="template_id"
          class="w-full sm:w-72"
        />
        <UButton
          v-if="selectedTemplateId"
          icon="material-symbols:delete-outline"
          variant="ghost"
          color="error"
          :aria-label="t('crm.quotes.create.deleteTemplate')"
          @click="onDeleteTemplate"
        />
      </div>

      <Form @submit="onSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputDatePicker v-model="form.validity_date" :label="t('crm.quotes.editor.dueDate')" name="validity_date" />
          <InputSelect v-model="form.status" :options="QUOTE_STATUS_OPTIONS" :label="t('crm.quotes.editor.status')" name="status" rules="required" />
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

        <div class="mt-4 flex gap-3">
          <ButtonPrimary :label="t('crm.quotes.create.save')" type="submit" :loading="loading" />
          <ButtonPrimary :label="t('crm.quotes.editor.cancel')" cancel @click="goBack()" />
        </div>
      </Form>
    </ContainerTemplate>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { QUOTE_STATUS_OPTIONS } from '~/constants/mockData'
import type { QuoteUpdatePayload } from '~/stores/quotes'

const { t } = useI18n()

useHead({ title: t('crm.quotes.create.pageTitle') })

const route = useRoute()
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const dealsStore = useDealsStore()
const quotesStore = useQuotesStore()
const quoteTemplatesStore = useQuoteTemplatesStore()
const goBack = useBackNavigation('/crm/deals')

const dealId = computed(() => Number(route.query.deal_id))
const deal = computed(() => dealsStore.items.find(d => d.id === dealId.value) ?? null)

onMounted(() => {
  // fetchOne, not fetchAll: this page only ever needs this one Deal (the
  // one it's creating a Quote for), and fetchAll's 200-row cache
  // (newest-first) can miss an older one entirely — the Deal pre-fill below
  // would otherwise silently not happen for an older Deal.
  if (!dealsStore.items.some(d => d.id === dealId.value)) dealsStore.fetchOne(dealId.value).catch(notifyApiError)
  quoteTemplatesStore.fetchAll().catch(notifyApiError)
})

const templateOptions = computed(() => quoteTemplatesStore.items.map(t => ({ label: t.name, value: String(t.id) })))
const selectedTemplateId = ref('')
// Pricing/tax fields a Quote Template carries that this step-1 form has no
// field for (they live on the full editor, step 2) — stashed here and merged
// into the Quote right after creation, in onSubmit below, so applying a
// template doesn't require the rep to re-visit step 2 just to re-enter them.
const appliedTemplateOverrides = ref<Pick<QuoteUpdatePayload, 'price_type' | 'vat_enabled' | 'wht_enabled' | 'wht_rate' | 'discount_total' | 'notes'> | null>(null)

watch(selectedTemplateId, (id) => {
  if (!id) {
    appliedTemplateOverrides.value = null
    return
  }
  const template = quoteTemplatesStore.items.find(t => t.id === Number(id))
  if (!template) return
  form.scope_of_work = template.scope_of_work
  items.value = template.items.map(item => ({
    key: nextItemKey++,
    description: item.description,
    qty: item.qty,
    price: item.price,
    product_id: item.product_id ? String(item.product_id) : null,
    kind: item.product_id ? 'product' : 'scope',
    discount_percent: item.discount_percent ?? 0,
  }))
  appliedTemplateOverrides.value = {
    price_type: template.price_type,
    vat_enabled: template.vat_enabled,
    wht_enabled: template.wht_enabled,
    wht_rate: template.wht_rate,
    discount_total: template.discount_total,
    notes: template.notes,
  }
})

const onDeleteTemplate = async () => {
  if (!selectedTemplateId.value) return
  try {
    await quoteTemplatesStore.remove(Number(selectedTemplateId.value))
    selectedTemplateId.value = ''
    success(t('crm.quotes.create.deleteTemplateSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
}

const form = reactive({
  validity_date: '',
  status: 'draft' as QuoteStatus,
  scope_of_work: '',
})

let nextItemKey = 0
const items = ref<QuoteItemRow[]>([])

// Declared here (before the Deal pre-fill watch below) so that watch can
// call `markClean()` once it settles — otherwise this page would read as
// "dirty" the instant the Deal resolves, before the rep has touched
// anything, since every quote here is created pre-filled from its Deal.
const { markClean } = useUnsavedChangesGuard(() => [form, items.value])

// Pre-fills from the parent Deal (FR-CRM-046): Scope of Work gets the Deal's
// title (project-level narrative), and one line item seeds qty:1/price:
// deal.value so a simple one-line quote doesn't start from a completely
// blank form — description starts blank since its narrative now lives in
// Scope of Work above. Both fire once, as soon as `deal` resolves (fetchAll
// above may still be in flight on first render).
watch(deal, (value) => {
  if (!value) return
  form.scope_of_work = value.title
  if (items.value.length === 0) {
    items.value = [{ key: nextItemKey++, description: '', qty: 1, price: value.value, product_id: null, kind: 'scope', discount_percent: 0 }]
  }
  markClean()
}, { immediate: true })

// Keyed by dealId: a quote's line items/pricing/scope_of_work are specific
// to the Deal being quoted, so a stale draft left over from creating a quote
// for a *different* Deal must never be offered here — restoring it would
// silently attach that other Deal's pricing/items to this one.
const { discardDraft, offerRestoreIfFound } = useDraftAutosave(
  `crm-quote-create:${dealId.value}`,
  () => ({ form, items: items.value }),
  (saved) => {
    Object.assign(form, saved.form)
    items.value = saved.items
  },
)
onMounted(offerRestoreIfFound)

const { loading, guard } = useSubmitGuard()

const onSubmit = guard(async () => {
  if (!deal.value) return
  try {
    const created = await quotesStore.add(deal.value.id, {
      items: items.value.map(({ description, qty, price, product_id, discount_percent }) => ({
        description, qty, price, product_id: product_id ? Number(product_id) : null, discount_percent,
      })),
      scope_of_work: form.scope_of_work,
      validity_date: form.validity_date ? new Date(form.validity_date) : null,
      status: form.status,
    })
    // A template was applied above (items/scope_of_work only — this step-1
    // form has no fields for price_type/VAT/WHT/discount/notes) — apply the
    // rest of it now via the full-payload PUT, same pattern as
    // stores/quotes.ts's updateStatus (rebuild from the just-loaded Quote),
    // so the rep doesn't have to re-enter them on step 2.
    if (appliedTemplateOverrides.value) {
      const updatePayload: QuoteUpdatePayload = {
        items: created.items,
        scope_of_work: created.scope_of_work,
        validity_date: created.validity_date,
        status: created.status,
        reference_number: created.reference_number ?? null,
        issue_date: created.issue_date,
        credit_days: created.credit_days,
        internal_notes: created.internal_notes ?? null,
        ...appliedTemplateOverrides.value,
      }
      await quotesStore.update(created.id, updatePayload)
    }
    success(t('crm.quotes.create.createSuccess'))
    markClean()
    discardDraft()
    // `continue=1` tells the editor page (pages/crm/quotes/[id].vue) this is
    // a fresh landing from step 1, not a rep coming back to an existing
    // quote later — it shows a one-time "add the rest of the details" banner
    // there only for this navigation, not every time the quote is opened.
    navigateTo(`/crm/quotes/${created.id}?continue=1`)
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
</script>
