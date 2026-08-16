<template>
  <div class="p-5">
    <div v-if="deal">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UButton
            icon="material-symbols:arrow-back"
            variant="ghost"
            color="neutral"
            class="cursor-pointer p-0 hover:bg-transparent"
            @click="navigateTo('/crm/deals')"
          />
          <h2 class="text-xl font-black [-webkit-text-stroke:0.6px_currentColor]">{{ deal.title }}</h2>
          <UBadge :color="stageBadgeColor" variant="subtle">{{ deal.stage }}</UBadge>
        </div>
        <ButtonPrimary
          v-if="deal.status === 'open'"
          :label="t('crm.deals.detail.markWon')"
          icon="material-symbols:check-circle-outline"
          @click="onMarkWon"
        />
      </div>

      <UTabs v-model="activeTab" :items="tabItems" class="mb-4" />

      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <ContainerTemplate>
            <Form @submit="onSave">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputText v-model="form.title" :label="t('crm.deals.detail.dealTitle')" name="title" rules="required" />
                <InputText v-model.number="form.value" :label="t('crm.deals.detail.dealValue')" type="number" name="value" rules="required" />
                <InputSelect v-model="form.stage" :options="DEAL_STAGE_OPTIONS" :label="t('crm.deals.detail.stage')" name="stage" rules="required" />
                <InputDatePicker v-model="form.expected_close_date" :label="t('crm.deals.detail.expectedCloseDate')" name="expected_close_date" />
                <CrmTeamMemberSelect v-model="form.assigned_to" name="assigned_to" />
                <InputSelect
                  v-model="form.business_unit"
                  :options="BUSINESS_UNIT_OPTIONS"
                  :label="t('crm.deals.detail.businessUnit')"
                  :placeholder="t('crm.deals.detail.businessUnitPlaceholder')"
                  name="business_unit"
                />
                <InputSelect
                  v-if="form.business_unit"
                  v-model="form.business_unit_item"
                  :options="businessUnitItemOptions"
                  :label="form.business_unit === 'Project' ? t('crm.deals.detail.project') : t('crm.deals.detail.product')"
                  :placeholder="t('crm.deals.detail.businessUnitItemPlaceholder')"
                  name="business_unit_item"
                />
              </div>
              <div class="mt-4 flex gap-3">
                <ButtonPrimary :label="t('crm.deals.detail.saveChanges')" type="submit" />
              </div>
            </Form>
          </ContainerTemplate>
        </div>

        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <h3 class="text-base font-semibold">{{ t('crm.deals.detail.linkedRecords') }}</h3>
            </template>
            <div class="flex flex-col gap-3 text-sm">
              <NuxtLink :to="`/crm/companies/${deal.company_id}`" class="flex justify-between hover:underline">
                <span class="text-[var(--color-gray)]">{{ t('crm.deals.detail.company') }}</span><span>{{ companyName }}</span>
              </NuxtLink>
              <NuxtLink :to="`/crm/contacts/${deal.contact_id}`" class="flex justify-between hover:underline">
                <span class="text-[var(--color-gray)]">{{ t('crm.deals.detail.contact') }}</span><span>{{ contactName }}</span>
              </NuxtLink>
              <NuxtLink v-if="linkedProject" :to="`/crm/companies/${deal.company_id}`" class="flex justify-between hover:underline">
                <span class="text-[var(--color-gray)]">{{ t('crm.deals.detail.project') }}</span><span>{{ linkedProject.name }}</span>
              </NuxtLink>
              <div v-else class="flex justify-between">
                <span class="text-[var(--color-gray)]">{{ t('crm.deals.detail.project') }}</span>
                <span class="text-[var(--color-gray)]">{{ deal.status === 'won' ? t('crm.deals.detail.projectNotCreatedYet') : '-' }}</span>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <div v-else-if="activeTab === 'quotes'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.deals.detail.quotesTitle') }}</h3>
            <div class="flex gap-2">
              <ButtonPrimary
                :label="t('crm.deals.detail.createQuote')"
                icon="material-symbols:add"
                outline
                small
                @click="addQuoteOpen = true"
              />
              <input
                ref="fileInputRef"
                type="file"
                accept="application/pdf"
                class="hidden"
                @change="onFileSelected"
              >
              <ButtonPrimary
                :label="t('crm.deals.detail.uploadQuotation')"
                icon="material-symbols:upload-file-outline"
                small
                @click="fileInputRef?.click()"
              />
            </div>
          </div>

          <div v-if="dealQuotes.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.deals.detail.noQuotes') }}
          </div>
          <div v-else class="flex flex-col gap-3">
            <div v-for="quote in dealQuotes" :key="quote.id" class="rounded-lg border border-[var(--color-light-gray-2)] p-4">
              <div class="mb-2 flex items-center justify-between">
                <UBadge color="neutral" variant="subtle">{{ quote.status }}</UBadge>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-[var(--color-gray)]">{{ t('crm.deals.detail.validUntil', { date: quote.validity_date ? dateFormat(quote.validity_date.toISOString()) : '-' }) }}</span>
                  <UButton
                    v-if="!quote.file_name"
                    icon="material-symbols:download"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    :aria-label="t('crm.deals.detail.downloadPdf')"
                    @click="onExportQuotePdf(quote.id)"
                  />
                </div>
              </div>

              <div v-if="quote.file_name" class="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-light-gray-1)] p-3">
                <div class="flex min-w-0 items-center gap-3">
                  <UIcon name="material-symbols:picture-as-pdf-outline" class="size-8 shrink-0 text-[var(--color-danger-toast)]" />
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">{{ quote.file_name }}</p>
                    <p class="text-xs text-[var(--color-gray)]">
                      {{ formatFileSize(quote.file_size) }} · {{ t('crm.deals.detail.uploadedOn', { date: quote.uploaded_at ? dateTimeFormat(quote.uploaded_at.toISOString()) : '-' }) }}
                    </p>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <UButton
                    :to="quote.file_url"
                    target="_blank"
                    icon="material-symbols:open-in-new"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    :aria-label="t('crm.deals.detail.viewPdf')"
                  />
                  <UButton
                    icon="material-symbols:delete-outline"
                    variant="ghost"
                    color="error"
                    size="xs"
                    :aria-label="t('crm.deals.detail.removeQuotation')"
                    @click="onRemoveQuote(quote)"
                  />
                </div>
              </div>

              <table v-else class="w-full text-sm">
                <tbody>
                  <tr v-for="(item, index) in quote.items" :key="index" class="border-t border-[var(--color-light-gray-2)]">
                    <td class="py-1">{{ item.description }}</td>
                    <td class="py-1 text-right">x{{ item.qty }}</td>
                    <td class="py-1 text-right">{{ priceFormat(item.price * item.qty) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ContainerTemplate>

        <CrmAddQuoteModal
          v-model:open="addQuoteOpen"
          @submit="onAddQuote"
        />
      </div>

      <div v-else-if="activeTab === 'payments'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.deals.detail.paymentsTitle') }}</h3>
            <ButtonPrimary
              :label="t('crm.deals.detail.addPayment')"
              icon="material-symbols:add"
              small
              @click="addPaymentOpen = true"
            />
          </div>

          <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--color-light-gray-2)] p-4">
              <p class="text-xs text-[var(--color-gray)]">{{ t('crm.deals.detail.totalPaid') }}</p>
              <p class="text-lg font-semibold">{{ priceFormat(totalPaid) }}</p>
            </div>
            <div class="rounded-lg border border-[var(--color-light-gray-2)] p-4">
              <p class="text-xs text-[var(--color-gray)]">{{ t('crm.deals.detail.remainingBalance') }}</p>
              <p class="text-lg font-semibold">
                {{ remainingBalance > 0 ? priceFormat(remainingBalance) : t('crm.deals.detail.fullyPaid') }}
              </p>
            </div>
          </div>

          <div v-if="dealPayments.length === 0" class="py-6 text-center text-sm text-[var(--color-gray)]">
            {{ t('crm.deals.detail.noPayments') }}
          </div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--color-light-gray-2)] text-left text-xs text-[var(--color-gray)]">
                <th class="py-2 font-normal">{{ t('crm.deals.detail.columnDate') }}</th>
                <th class="py-2 font-normal">{{ t('crm.deals.detail.columnAmount') }}</th>
                <th class="py-2 font-normal">{{ t('crm.deals.detail.columnMethod') }}</th>
                <th class="py-2 font-normal">{{ t('crm.deals.detail.columnNote') }}</th>
                <th class="py-2" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in dealPayments" :key="payment.id" class="border-b border-[var(--color-light-gray-2)]">
                <td class="py-2">{{ dateFormat(payment.paid_at) }}</td>
                <td class="py-2">{{ priceFormat(payment.amount) }}</td>
                <td class="py-2 capitalize">{{ payment.method }}</td>
                <td class="py-2 text-[var(--color-gray)]">{{ payment.note || '-' }}</td>
                <td class="py-2 text-right">
                  <UButton
                    icon="material-symbols:delete-outline"
                    variant="ghost"
                    color="error"
                    size="xs"
                    :aria-label="t('crm.deals.detail.removePayment')"
                    @click="onRemovePayment(payment.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </ContainerTemplate>

        <CrmAddPaymentModal
          v-model:open="addPaymentOpen"
          @submit="onAddPayment"
        />
      </div>

      <div v-else-if="activeTab === 'tasks'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.deals.detail.tasksTitle') }}</h3>
            <ButtonPrimary
              :label="t('crm.deals.detail.addTask')"
              icon="material-symbols:add"
              small
              @click="openAddTask"
            />
          </div>
          <CrmTaskList :tasks="dealTasks" @toggle="onToggleTask" @remove="onRemoveTask" />
        </ContainerTemplate>

        <CrmAddTaskModal
          v-model:open="addTaskOpen"
          @submit="onSubmitTask"
        />
      </div>

      <div v-else-if="activeTab === 'activity'">
        <ContainerTemplate>
          <h3 class="mb-4 text-base font-semibold">{{ t('crm.deals.detail.activityTitle') }}</h3>
          <CrmActivityTimeline :items="dealActivity" />
        </ContainerTemplate>
      </div>

      <div v-else-if="activeTab === 'attachments'">
        <ContainerTemplate>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ t('crm.deals.detail.attachmentsTitle') }}</h3>
            <ButtonPrimary
              :label="t('crm.deals.detail.addAttachment')"
              icon="material-symbols:add"
              small
              @click="addAttachmentOpen = true"
            />
          </div>
          <CrmAttachmentList :attachments="dealAttachments" @remove="onRemoveAttachment" />
        </ContainerTemplate>

        <CrmAddAttachmentModal
          v-model:open="addAttachmentOpen"
          @submit="onAddAttachment"
        />
      </div>
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.deals.detail.dealNotFound') }}
    </div>

    <CrmAddProjectModal
      v-model:open="wonModal"
      :title="t('crm.deals.detail.createProjectModalTitle')"
      :default-name="deal?.title"
      :description="t('crm.deals.detail.createProjectModalBody')"
      @submit="onCreateProject"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DEAL_STAGE_OPTIONS, BUSINESS_UNIT_OPTIONS, dealStatusForStage, isTaskOverdue } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.deals.detail.pageTitle') })

const route = useRoute()
const { priceFormat, dateFormat, dateTimeFormat } = useFormatter()
const { success, error, info } = useNotify()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const dealsStore = useDealsStore()
const paymentsStore = usePaymentsStore()
const tasksStore = useTasksStore()
const activitiesStore = useActivitiesStore()
const projectsStore = useProjectsStore()
const productsStore = useProductsStore()
const attachmentsStore = useAttachmentsStore()

const dealId = Number(route.params.id)
const deal = computed(() => dealsStore.items.find(d => d.id === dealId) ?? null)
const linkedProject = computed(() => projectsStore.forDeal(dealId))

onMounted(() => {
  if (dealsStore.items.length === 0) dealsStore.fetchAll()
  if (companiesStore.items.length === 0) companiesStore.fetchAll()
  if (contactsStore.items.length === 0) contactsStore.fetchAll()
  paymentsStore.fetchForDeal(dealId)
  activitiesStore.fetchForRelated('deal', dealId)
  quotesStore.fetchForDeal(dealId)
  if (productsStore.items.length === 0) productsStore.fetchAll()
  attachmentsStore.fetchForRelated('deal', dealId)
})

// Deal loads asynchronously (dealsStore.fetchAll), so company_id isn't known
// yet at onMounted — fetch this company's projects once the deal resolves.
watch(deal, (value) => {
  if (value) projectsStore.fetchForCompany(value.company_id)
}, { immediate: true })

const activeTab = ref('overview')
const dealOverdueTaskCount = computed(() => dealTasks.value.filter(task => isTaskOverdue(task)).length)
const tabItems = computed(() => [
  { label: t('crm.deals.detail.tabs.overview'), value: 'overview' },
  { label: t('crm.deals.detail.tabs.quotes'), value: 'quotes' },
  { label: t('crm.deals.detail.tabs.payments'), value: 'payments' },
  { label: dealOverdueTaskCount.value > 0 ? `${t('crm.deals.detail.tabs.tasks')} (${dealOverdueTaskCount.value})` : t('crm.deals.detail.tabs.tasks'), value: 'tasks' },
  { label: t('crm.deals.detail.tabs.activity'), value: 'activity' },
  { label: t('crm.deals.detail.tabs.attachments'), value: 'attachments' },
])

const wonModal = ref(false)

const companyName = computed(() => deal.value ? companiesStore.nameById(deal.value.company_id) : '-')
const contactName = computed(() => deal.value ? contactsStore.items.find(c => c.id === deal.value!.contact_id)?.name || '-' : '-')
const dealActivity = computed(() => activitiesStore.forRelated('deal', dealId))

const quotesStore = useQuotesStore()
const dealQuotes = computed(() => quotesStore.forDeal(dealId))

const MAX_QUOTATION_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const fileInputRef = ref<HTMLInputElement | null>(null)

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (file.type !== 'application/pdf') {
    error(t('crm.deals.detail.invalidFileType'))
    return
  }
  if (file.size > MAX_QUOTATION_FILE_SIZE) {
    error(t('crm.deals.detail.fileTooLarge'))
    return
  }

  await quotesStore.upload(dealId, file)
  success(t('crm.deals.detail.uploadSuccess'))
}

const onRemoveQuote = async (quote: Quote) => {
  await quotesStore.remove(quote.id)
}

// GET /quotes/:id/export-pdf returns a raw PDF byte stream, not JSON, and
// needs the same Authorization header every other API call gets — so it's
// fetched as a blob via $api rather than a plain browser-navigated link.
const onExportQuotePdf = async (quoteId: number) => {
  try {
    const { $api } = useNuxtApp()
    const response = await $api.get(`/quotes/${quoteId}/export-pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `quote-${quoteId}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    error(t('global.genericError'))
  }
}

const addQuoteOpen = ref(false)

const onAddQuote = async (quote: { items: QuoteItem[], validity_date: Date | null, status: QuoteStatus }) => {
  await quotesStore.add(dealId, quote)
  success(t('crm.deals.detail.createQuoteSuccess'))
}

const addPaymentOpen = ref(false)
const dealPayments = computed(() => paymentsStore.forDeal(dealId))
const totalPaid = computed(() => paymentsStore.totalForDeal(dealId))
const remainingBalance = computed(() => (deal.value ? deal.value.value - totalPaid.value : 0))

const onAddPayment = async (payment: { amount: number, paid_at: Date, method: PaymentMethod, note: string }) => {
  await paymentsStore.add(dealId, payment)
  success(t('crm.deals.detail.addPaymentSuccess'))
}

const onRemovePayment = async (id: number) => {
  await paymentsStore.remove(id)
  success(t('crm.deals.detail.removePaymentSuccess'))
}

const { tasks: dealTasks, addTaskOpen, openAddTask, onSubmitTask, onToggleTask, onRemoveTask } = useTaskList('deal', dealId, 'crm.deals.detail.addTaskSuccess')

const stageBadgeColor = computed(() => {
  if (deal.value?.stage === 'Won') return 'success'
  if (deal.value?.stage === 'Lost') return 'error'
  return 'neutral'
})

const form = reactive({
  title: deal.value?.title || '',
  value: deal.value?.value || 0,
  stage: deal.value?.stage || 'Lead',
  expected_close_date: deal.value?.expected_close_date ? deal.value.expected_close_date.toISOString().slice(0, 10) : '',
  assigned_to: deal.value?.assigned_to ? String(deal.value.assigned_to) : '',
  business_unit: (deal.value?.business_unit || '') as BusinessUnit | '',
  business_unit_item: deal.value?.business_unit_item || '',
})

// Deal loads asynchronously now (fetched on mount), so the form is (re)populated
// once the record arrives instead of only at setup time. `hydrating` suppresses
// the business_unit watcher below during this — otherwise setting business_unit
// here would immediately wipe the business_unit_item set two lines later.
let hydrating = false
watch(deal, (value) => {
  if (!value) return
  hydrating = true
  form.title = value.title
  form.value = value.value
  form.stage = value.stage
  form.expected_close_date = value.expected_close_date ? value.expected_close_date.toISOString().slice(0, 10) : ''
  form.assigned_to = value.assigned_to ? String(value.assigned_to) : ''
  form.business_unit = value.business_unit || ''
  form.business_unit_item = value.business_unit_item || ''
  nextTick(() => { hydrating = false })
}, { immediate: true })

const businessUnitItemOptions = useBusinessUnitItemOptions(
  toRef(form, 'business_unit'),
  computed(() => deal.value?.company_id ?? null),
)

// Switching business unit invalidates whichever item was picked under the old
// one — but not during the hydration above, which sets both at once.
watch(() => form.business_unit, () => {
  if (!hydrating) form.business_unit_item = ''
})

// Nudges a rep to take the next concrete step right after a deal closes, instead
// of a won deal silently sitting with no follow-up assigned to anyone.
const WON_FOLLOWUP_DUE_DAYS = 3

const createWonFollowUpTask = () => {
  if (!deal.value) return
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + WON_FOLLOWUP_DUE_DAYS)
  tasksStore.add({
    related_type: 'deal',
    related_id: dealId,
    title: t('crm.deals.detail.wonFollowUpTaskTitle'),
    due_date: dueDate,
    assigned_to: deal.value.assigned_to,
  })
  info(t('crm.deals.detail.wonFollowUpTaskCreated'))
}

const onSave = async () => {
  if (!deal.value) return
  const wasWon = deal.value.status === 'won'
  try {
    const updated = await dealsStore.update(deal.value.id, {
      title: form.title,
      value: form.value,
      stage: form.stage as DealStage,
      status: dealStatusForStage(form.stage as DealStage),
      expected_close_date: form.expected_close_date ? new Date(form.expected_close_date) : null,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      business_unit: form.business_unit || null,
      business_unit_item: form.business_unit_item || null,
    })
    if (!wasWon && updated.status === 'won') createWonFollowUpTask()
    success(t('crm.deals.detail.updateSuccess'))
  } catch {
    error(t('global.genericError'))
  }
}

const onMarkWon = async () => {
  if (!deal.value) return
  const wasWon = deal.value.status === 'won'
  try {
    await dealsStore.updateStage(deal.value.id, 'Won')
    form.stage = 'Won'
    if (!wasWon) createWonFollowUpTask()
    success(t('crm.deals.detail.markWonSuccess'))
    wonModal.value = true
  } catch {
    error(t('global.genericError'))
  }
}

const onCreateProject = async (payload: { name: string, status: ProjectStatus, production_reference: string | null, target_end_date: Date | null, notes: string }) => {
  if (!deal.value) return
  try {
    await projectsStore.add(deal.value.company_id, {
      deal_id: deal.value.id,
      start_date: new Date(),
      ...payload,
    })
    success(t('crm.deals.detail.createProjectSuccess'))
  } catch {
    error(t('global.genericError'))
  }
}

const addAttachmentOpen = ref(false)
const dealAttachments = computed(() => attachmentsStore.forRelated('deal', dealId))

const onAddAttachment = async (payload: { category: AttachmentCategory, file: File } | { category: AttachmentCategory, fileName: string, externalUrl: string }) => {
  try {
    if ('file' in payload) {
      await attachmentsStore.addFile('deal', dealId, payload.category, payload.file)
    } else {
      await attachmentsStore.addLink('deal', dealId, payload.category, payload.fileName, payload.externalUrl)
    }
    success(t('crm.deals.detail.addAttachmentSuccess'))
  } catch {
    error(t('global.genericError'))
  }
}

const onRemoveAttachment = async (id: number) => {
  try {
    await attachmentsStore.remove(id)
    success(t('crm.deals.detail.removeAttachmentSuccess'))
  } catch {
    error(t('global.genericError'))
  }
}
</script>
