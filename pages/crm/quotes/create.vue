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
      <p v-if="deal" class="text-sm text-[var(--color-gray)]">{{ t('crm.quotes.create.subheading', { title: deal.title }) }}</p>
    </div>

    <div v-if="!deal" class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.quotes.create.missingDeal') }}
    </div>

    <!-- Deliberately minimal: validity date, status, Scope of Work, and line
    items only — the reference/credit-days/price-type/VAT/WHT/notes/
    attachments fields all live on the full edit page this redirects to
    right after creation (pages/crm/quotes/[id].vue). Mirrors the old
    AddQuoteModal's create surface, just as a full page instead of a modal. -->
    <ContainerTemplate v-else>
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

const { t } = useI18n()

useHead({ title: t('crm.quotes.create.pageTitle') })

const route = useRoute()
const { error } = useNotify()
const { notifyApiError } = useApiErrorNotifier()
const dealsStore = useDealsStore()
const quotesStore = useQuotesStore()
const goBack = useBackNavigation('/crm/deals')

onMounted(() => {
  if (dealsStore.items.length === 0) dealsStore.fetchAll().catch(notifyApiError)
})

const dealId = computed(() => Number(route.query.deal_id))
const deal = computed(() => dealsStore.items.find(d => d.id === dealId.value) ?? null)

const form = reactive({
  validity_date: '',
  status: 'draft' as QuoteStatus,
  scope_of_work: '',
})

let nextItemKey = 0
const items = ref<QuoteItemRow[]>([])

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
}, { immediate: true })

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
    navigateTo(`/crm/quotes/${created.id}`)
  } catch (err) {
    error(getApiErrorMessage(err, t('global.genericError')))
  }
})
</script>
