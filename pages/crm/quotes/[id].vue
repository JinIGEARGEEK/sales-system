<template>
  <div class="p-5">
    <div v-if="quote && deal">
      <PageHeader :title="quote.number || `#${quote.id}`" @back="navigateTo(`/crm/deals/${deal.id}/quotes`)">
        <UBadge :color="quoteStatusBadgeColor(quote.status)" variant="subtle">{{ quoteStatusLabel(quote.status) }}</UBadge>
        <UBadge v-if="quote.revision_no" color="neutral" variant="outline" data-cy="quote-revision">{{ t('crm.quotes.revision.label', { n: quote.revision_no }) }}</UBadge>
        <NuxtLink
          v-if="quote.revision_of_id"
          :to="`/crm/quotes/${quote.revision_of_id}`"
          class="text-xs text-(--color-primary) hover:underline"
          data-cy="quote-revision-of"
        >
          {{ t('crm.quotes.detail.revisionOf', { number: revisionOfLabel }) }}
        </NuxtLink>
        <template #actions>
          <div class="flex flex-wrap gap-2">
            <ButtonPrimary
              :label="t('crm.quotes.detail.save')"
              outline
              icon="material-symbols:edit-outline"
              :loading="loading"
              :disabled="locked && form.status === storedQuoteStatus(quote.status)"
              data-cy="quote-save"
              @click="onSaveClick"
            />
            <ButtonPrimary
              :label="t('crm.quotes.detail.duplicate')"
              outline
              icon="material-symbols:content-copy-outline"
              :loading="duplicatingId !== null"
              data-cy="quote-duplicate"
              @click="duplicateQuote(quote.id)"
            />
            <ButtonPrimary
              :label="t('crm.quotes.detail.saveAsTemplate')"
              outline
              icon="material-symbols:bookmark-add-outline"
              data-cy="quote-save-template"
              @click="saveTemplateOpen = true"
            />
            <ButtonPrimary
              v-if="canSend"
              :label="t('crm.quotes.detail.sendToCustomer')"
              icon="material-symbols:send-outline"
              :loading="loading"
              data-cy="quote-send"
              @click="onSendClick"
            />
          </div>
        </template>
      </PageHeader>

      <!-- Only right after landing here from Create Quote's own "Step 1 of 2"
      (pages/crm/quotes/create.vue navigates here with ?continue=1) — closes
      the loop on that page's step label so it's clear this editor is step 2
      of the same flow, not a separate page the rep ended up on by mistake.
      Never shown again once the query param is stripped below, including on
      a later visit to edit the same (by-then-finished) Quote. -->
      <UAlert
        v-if="locked"
        class="mb-4"
        color="info"
        variant="subtle"
        icon="material-symbols:lock-outline"
        :title="quote.status === 'rejected' ? t('crm.quotes.detail.rejectedLockedTitle') : t('crm.quotes.detail.acceptedLockedTitle')"
        :description="quote.status === 'rejected' ? t('crm.quotes.detail.rejectedLockedDescription') : t('crm.quotes.detail.acceptedLockedDescription')"
        :actions="[{ label: t('crm.quotes.detail.duplicateToRevise'), icon: 'material-symbols:content-copy-outline', color: 'primary', variant: 'solid', loading: duplicatingId !== null, onClick: () => duplicateQuote(quote!.id) }]"
        data-cy="quote-accepted-locked"
      />

      <UAlert
        v-if="justCreated"
        class="mb-4"
        color="success"
        variant="subtle"
        icon="material-symbols:check-circle-outline"
        :title="t('crm.quotes.detail.continueEditingTitle')"
      />

      <!-- Only for Quotes created via PDF upload (extraction_status is unset
      for every manually-created Quote) — see interfaces/crm.d.ts's Quote
      docblock and api-system-spec.md §7.4's Upload row. 'partial' still
      pre-filled what it could; 'failed' pre-filled nothing, so the fields
      below are exactly as blank as an upload always left them before this
      existed. -->
      <UAlert
        v-if="quote.extraction_status === 'partial'"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="material-symbols:warning-outline"
        :title="t('crm.quotes.detail.extractionPartialTitle')"
      >
        <template #description>
          <ul class="list-disc pl-4">
            <li v-for="(warning, index) in quote.extraction_warnings ?? []" :key="index">{{ warning }}</li>
          </ul>
        </template>
      </UAlert>
      <UAlert
        v-else-if="quote.extraction_status === 'failed'"
        class="mb-4"
        color="neutral"
        variant="subtle"
        icon="material-symbols:info-outline"
        :title="t('crm.quotes.detail.extractionFailedTitle')"
      />

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
                  <p class="text-xs text-(--color-gray)">{{ t('crm.quotes.editor.company') }}</p>
                  <p v-if="company" class="text-sm font-medium" :class="{ 'italic text-(--color-gray)': isUnnamed(company.name) }">{{ companyName(company.name) }}</p>
                  <p v-if="company?.address" class="mt-1 whitespace-pre-wrap text-xs text-(--color-gray)">{{ company.address }}</p>
                </div>
                <div>
                  <p class="text-xs text-(--color-gray)">{{ t('crm.quotes.editor.contactPerson') }}</p>
                  <p class="text-sm font-medium">{{ contact?.name }}</p>
                  <p v-if="contact?.phone" class="text-xs text-(--color-gray)">{{ contact.phone }}</p>
                </div>
                <div>
                  <p class="text-xs text-(--color-gray)">{{ t('crm.quotes.editor.salesRep') }}</p>
                  <p class="text-sm font-medium">{{ teamMembersStore.nameById(deal.assigned_to) }}</p>
                </div>
                <div>
                  <p class="text-xs text-(--color-gray)">{{ t('crm.quotes.editor.currency') }}</p>
                  <p class="text-sm font-medium">THB</p>
                </div>
                <div>
                  <p class="text-xs text-(--color-gray)">{{ t('crm.quotes.editor.project') }}</p>
                  <p class="text-sm font-medium">{{ dealProject?.name ?? t('crm.quotes.editor.projectNone') }}</p>
                </div>
              </div>

              <!-- Status offers only the moves the API allows from the saved
              one (allowedQuoteStatuses) — and is the one thing an
              Accepted/Rejected quote still lets you change. -->
              <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <InputSelect
                    v-model="form.status"
                    :options="quoteStatusOptionsFor(quote.status)"
                    :label="t('crm.quotes.editor.status')"
                    name="status"
                    rules="required"
                    :disable="quote.status === 'rejected'"
                    data-cy="quote-status"
                  />
                  <p v-if="quote.status === 'accepted'" class="mt-1 text-xs text-(--color-gray)">{{ t('crm.quotes.detail.acceptedStatusHint') }}</p>
                </div>
              </div>

              <!-- A disabled <fieldset> disables every control inside it
              (inputs, selects, checkboxes, add/remove buttons): an
              Accepted/Rejected quote is fully read-only (`locked`) — the API
              refuses any change but its status with a 409. -->
              <fieldset class="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2" :disabled="locked" data-cy="quote-details-fieldset">
                <InputText v-model="form.reference_number" :label="t('crm.quotes.editor.referenceNumber')" :placeholder="t('crm.quotes.editor.referenceNumberPlaceholder')" name="reference_number" />
                <InputDatePicker v-model="form.issue_date" :label="t('crm.quotes.editor.issueDate')" name="issue_date" />
                <InputText v-model.number="form.credit_days" type="number" :label="t('crm.quotes.editor.creditDays')" name="credit_days" rules="min_value:0" />
                <InputDatePicker v-model="form.validity_date" :label="t('crm.quotes.editor.dueDate')" name="validity_date" />
                <InputSelect v-model="form.price_type" :options="PRICE_TYPE_OPTIONS" :label="t('crm.quotes.editor.priceType')" name="price_type" :disable="locked" />
              </fieldset>

              <fieldset class="min-w-0" :disabled="locked">
                <InputTextarea
                  v-model="form.scope_of_work"
                  :label="t('crm.quotes.editor.scopeOfWork')"
                  :placeholder="t('crm.quotes.editor.scopeOfWorkPlaceholder')"
                  name="scope_of_work"
                  rows="4"
                  class="mt-3"
                />
              </fieldset>

              <fieldset class="mt-4 min-w-0" :disabled="locked" data-cy="quote-pricing-fieldset">
                <CrmQuoteItemsEditor v-model="items" />
              </fieldset>

              <!-- Discount/VAT/WHT toggles + the live totals breakdown —
              mirrors utils.ComputeQuoteTotals on the backend exactly (see
              useQuoteTotals) so this and the exported PDF never disagree. -->
              <fieldset class="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2" :disabled="locked">
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
              </fieldset>

              <div class="mt-4 flex flex-col gap-1 border-t border-(--color-light-gray-2) pt-3 text-sm">
                <div class="flex justify-between"><span class="text-(--color-gray)">{{ t('crm.quotes.editor.subtotal') }}</span><span>{{ currency(totals.subtotal) }}</span></div>
                <div v-if="form.discount_total > 0" class="flex justify-between"><span class="text-(--color-gray)">{{ t('crm.quotes.editor.discountTotal') }}</span><span>-{{ currency(totals.discountTotal) }}</span></div>
                <div v-if="vatIncluded" class="flex justify-between" data-cy="quote-pre-vat"><span class="text-(--color-gray)">{{ t('crm.quotes.editor.amountBeforeVat') }}</span><span>{{ currency(totals.taxableAmount) }}</span></div>
                <div v-if="form.vat_enabled" class="flex justify-between" data-cy="quote-vat"><span class="text-(--color-gray)">{{ vatIncluded ? t('crm.quotes.editor.vatIncluded') : t('crm.quotes.editor.vatEnabled') }}</span><span>{{ currency(totals.vat) }}</span></div>
                <div v-if="form.wht_enabled" class="flex justify-between"><span class="text-(--color-gray)">{{ t('crm.quotes.editor.whtEnabled') }}</span><span>-{{ currency(totals.wht) }}</span></div>
                <div class="flex justify-between text-base font-semibold"><span>{{ t('crm.quotes.editor.grandTotal') }}</span><span>{{ currency(totals.grandTotal) }}</span></div>
              </div>

              <fieldset class="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2" :disabled="locked">
                <InputTextarea v-model="form.notes" :label="t('crm.quotes.editor.notes')" :placeholder="t('crm.quotes.editor.notesPlaceholder')" name="notes" rows="3" />
                <InputTextarea v-model="form.internal_notes" :label="t('crm.quotes.editor.internalNotes')" :placeholder="t('crm.quotes.editor.internalNotesPlaceholder')" name="internal_notes" rows="3" />
              </fieldset>
            </Form>
          </ContainerTemplate>
        </div>

        <div class="lg:col-span-2">
          <CrmStatCard
            :label="t('crm.quotes.editor.grandTotal')"
            icon="material-symbols:payments-outline"
            icon-class="text-(--color-primary)"
            value-class="text-(--color-primary)"
          >
            {{ currency(totals.grandTotal) }}
          </CrmStatCard>

          <UCard class="mt-4">
            <template #header>
              <div class="flex items-center justify-between">
                <CardTitle>{{ t('crm.quotes.editor.attachments') }}</CardTitle>
                <ButtonPrimary :label="t('crm.quotes.editor.addAttachment')" icon="material-symbols:add" small data-cy="quote-add-attachment" @click="addAttachmentOpen = true" />
              </div>
            </template>
            <CrmAttachmentList :attachments="quoteAttachments" @remove="onRemoveAttachment" />
          </UCard>
        </div>
      </div>

      <CrmAddAttachmentModal v-model:open="addAttachmentOpen" @submit="onAddAttachment" />

      <CrmSaveQuoteTemplateModal v-model:open="saveTemplateOpen" @submit="onSaveTemplate" />

      <CrmConfirmDeleteModal
        v-model:open="sendConfirmOpen"
        :title="t('crm.quotes.detail.sendConfirmTitle')"
        :body="t('crm.quotes.detail.sendConfirmBody')"
        confirm-color="primary"
        :confirm-label="t('crm.quotes.detail.sendToCustomer')"
        @confirm="onConfirmSend"
      />

      <CrmDealValueSyncModal :sync="dealValueSync" />

      <CrmSupersedeAcceptedQuotesModal :supersede="supersede" />
    </div>

    <DetailSkeleton v-else-if="recordPending" />
    <NotFoundState v-else :message="t('crm.quotes.detail.quoteNotFound')" back-to="/crm/deals" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { QuoteUpdatePayload } from '~/stores/quotes'

const { t } = useI18n()
const showFieldErrors = useApiFieldErrors()

useHead({ title: t('crm.quotes.detail.pageTitle') })

const route = useRoute()
const router = useRouter()
// Captured once before the query param is stripped below — read directly off
// the initial route rather than a reactive route.query lookup, since the
// whole point is to notice only the landing from Create Quote's redirect,
// not any subsequent state.
const justCreated = ref(route.query.continue === '1')
if (justCreated.value) {
  const { continue: _continue, ...rest } = route.query
  router.replace({ query: rest })
}
const { success, error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const { pending: recordPending, track: trackRecord } = useRecordPending()
const { currency } = useFormatter()
const { quoteStatusBadgeColor, quoteStatusLabel, quoteStatusOptionsFor } = useQuoteStatusColor()
const notifyQuoteError = useQuoteErrorNotifier()
const { companyName, isUnnamed } = useCompanyName()

const quotesStore = useQuotesStore()
const quoteTemplatesStore = useQuoteTemplatesStore()
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

// The page renders once both the Quote and its Deal are in. Resolves false
// when the Quote itself couldn't be loaded.
const loadQuoteAndDeal = async () => {
  try {
    if (!quote.value) await quotesStore.fetchOne(quoteId)
  } catch (err) {
    notifyApiError(err)
    return false
  }
  // Targeted fetchOne for this Quote's own Deal/Company/Contact, not a blanket
  // fetchAll() — those stores' fetchAll caches are capped at 200 rows,
  // newest-first (see stores/companies.ts's fetchAll doc), so an older
  // Deal/Company/Contact linked to this Quote could otherwise never resolve
  // here even though the Quote itself loaded fine.
  if (!dealsStore.items.some(d => d.id === quote.value!.deal_id)) {
    await dealsStore.fetchOne(quote.value!.deal_id).catch(notifyApiError)
  }
  return true
}

onMounted(async () => {
  const loaded = loadQuoteAndDeal()
  trackRecord(loaded)
  if (!(await loaded)) return
  if (deal.value) {
    if (!companiesStore.items.some(c => c.id === deal.value!.company_id)) {
      companiesStore.fetchOne(deal.value.company_id).catch(notifyApiError)
    }
    if (!contactsStore.items.some(c => c.id === deal.value!.contact_id)) {
      contactsStore.fetchOne(deal.value.contact_id).catch(notifyApiError)
    }
    projectsStore.fetchForCompany(deal.value.company_id).catch(notifyApiError)
  }
  if (teamMembersStore.items.length === 0) teamMembersStore.fetchAll().catch(notifyApiError)
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

// Tracks both the header fields and the line items. Re-baselined (markClean)
// at the end of each populate below — the snapshot taken here is the still-
// empty form — and after every successful in-place save/send, so neither
// loading the Quote nor saving it ever reads as an unsaved edit.
const { markClean } = useUnsavedChangesGuard(() => [form, items.value])

// Populate the form/items from the loaded Quote exactly once it's
// available — this is an edit page, not a create form, so there's no
// "reset on open" concern (useModalForm's pattern doesn't apply here).
watch(quote, (value) => {
  if (!value) return
  form.scope_of_work = value.scope_of_work
  form.validity_date = value.validity_date ? value.validity_date.toISOString().slice(0, 10) : ''
  // 'expired' is read-derived (the API's EffectiveStatus: a Sent quote past
  // its validity date), never a value PUT accepts — edit it as the Sent it's
  // stored as. The header badge still shows Expired.
  form.status = value.status === 'expired' ? 'sent' : value.status
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
  markClean()
}, { immediate: true })

const totals = computed(() => useQuoteTotals(items.value, form.discount_total, form.price_type, form.vat_enabled, form.wht_enabled, form.wht_rate))
// Tax-inclusive prices with VAT on: VAT is backed out of them, so the
// breakdown shows the pre-VAT amount and the VAT it contains.
const vatIncluded = computed(() => form.vat_enabled && form.price_type === 'incl_tax')

// An Accepted or Rejected Quote is final — the Deal's receivable and revenue
// come from the Accepted one, and the API refuses (409) any change to either
// but an allowed status move (Accepted → Rejected). To revise it, duplicate
// it. Keyed on the saved status.
const locked = computed(() => !!quote.value && isQuoteLocked(quote.value.status))

// "Revision of QT…" — the root's number when it's loaded (the Deal's quotes
// are fetched below once this one turns out to be a revision).
const revisionOfLabel = computed(() => {
  const rootId = quote.value?.revision_of_id
  if (!rootId) return ''
  return quotesStore.items.find(q => q.id === rootId)?.number || `#${rootId}`
})
watch(() => quote.value?.revision_of_id, (rootId) => {
  if (rootId && quote.value && !quotesStore.items.some(q => q.id === rootId)) {
    quotesStore.fetchForDeal(quote.value.deal_id, quoteId).catch(notifyApiError)
  }
}, { immediate: true })

// Re-reads the saved Quote (the conflict toast's Reload); the populate
// watcher above refills the form from it.
const reloadQuote = () => quotesStore.fetchOne(quoteId).catch(notifyApiError)

// A save failure: a 422's fields onto their inputs (item rows by key), a
// 409 in words with Reload, anything else as the API's message.
const reportSaveError = (err: unknown) => {
  const setErrors = (formRef.value as { setErrors?: (errors: Record<string, string>) => void } | null)?.setErrors
  if (setErrors && showFieldErrors(err, setErrors, quoteFormFieldNames(items.value), {
    fieldMap: quoteItemFieldMap(items.value),
  })) return
  notifyQuoteError(err, reloadQuote)
}

const buildUpdatePayload = (statusOverride?: QuoteStatus): QuoteUpdatePayload => ({
  items: serializeQuoteItems(items.value),
  scope_of_work: form.scope_of_work,
  validity_date: form.validity_date ? new Date(form.validity_date) : null,
  status: statusOverride ?? form.status,
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

// Moving the Quote to Accepted offers to update the Deal's value to match it
// (pre-VAT — see quoteRevenueAmount).
const dealValueSync = useQuoteDealValueSync()

const supersede = useSupersedeAcceptedQuotes()

const onSave = guard(async () => {
  if (!quote.value) return
  const current = quote.value
  const wasAccepted = current.status === 'accepted'
  try {
    // Accepting while another quote on the Deal is Accepted: offer to reject
    // those first (then accept this one).
    if (!wasAccepted && form.status === 'accepted') {
      const others = await supersede.loadOtherAccepted(current.deal_id, current.id)
      if (!(await supersede.resolveOthers(others))) return
    }
    // Read-only quotes send their status alone (quotesStore.updateStatus).
    const updated = isQuoteLocked(current.status)
      ? await quotesStore.updateStatus(current.id, form.status)
      : await quotesStore.update(current.id, buildUpdatePayload())
    markClean()
    success(t('crm.quotes.detail.saveSuccess'))
    if (!wasAccepted && updated.status === 'accepted') dealValueSync.offer(updated, deal.value)
  } catch (err) {
    reportSaveError(err)
  }
})

const onSaveClick = () => validateThenSubmit(onSave)

// Copies the SAVED quote — unsaved edits here stay behind (the leave guard
// still asks before navigating to the copy).
const { duplicatingId, duplicateQuote } = useDuplicateQuote()

const saveTemplateOpen = ref(false)

const onSaveTemplate = async ({ name }: { name: string }) => {
  try {
    await quoteTemplatesStore.add({
      name,
      items: serializeQuoteItems(items.value),
      scope_of_work: form.scope_of_work,
      price_type: form.price_type,
      vat_enabled: form.vat_enabled,
      wht_enabled: form.wht_enabled,
      wht_rate: form.wht_rate,
      discount_total: form.discount_total,
      notes: form.notes,
    })
    success(t('crm.quotes.detail.saveAsTemplateSuccess'))
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
    return false
  }
}

// "Send to Customer" is kept separate from the generic Save button —
// transitioning a Quote to `sent` is a one-way, customer-facing action (once
// sent, this Quote is presumably in the customer's inbox) and deserves its
// own confirmation rather than being one more field a rep can silently flip
// via the Status dropdown + Save.
const canSend = computed(() => quote.value?.status === 'draft')
// Same useConfirmGate composable as Prospect/Lead detail's own Convert
// confirmation — a single already-known record on a detail page, not a
// list-row target to track (that's useDeleteConfirm's case instead).
const { open: sendConfirmOpen, request: requestSend, close: closeSendConfirm } = useConfirmGate()
const onSendClick = () => validateThenSubmit(requestSend)

const onConfirmSend = guard(async () => {
  if (!quote.value) return
  try {
    await quotesStore.update(quote.value.id, buildUpdatePayload('sent'))
    form.status = 'sent'
    markClean()
    success(t('crm.quotes.detail.sendSuccess'))
  } catch (err) {
    reportSaveError(err)
  } finally {
    closeSendConfirm()
  }
})

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
    return false
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
