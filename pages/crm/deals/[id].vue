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
              <div class="flex justify-between">
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
            <div>
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
                <span class="text-xs text-[var(--color-gray)]">{{ t('crm.deals.detail.validUntil', { date: quote.validity_date ? dateFormat(quote.validity_date.toISOString()) : '-' }) }}</span>
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
      </div>

      <div v-else-if="activeTab === 'activity'">
        <ContainerTemplate>
          <h3 class="mb-4 text-base font-semibold">{{ t('crm.deals.detail.activityTitle') }}</h3>
          <CrmActivityTimeline :items="dealActivity" />
        </ContainerTemplate>
      </div>
    </div>

    <div v-else class="py-12 text-center text-[var(--color-gray)]">
      {{ t('crm.deals.detail.dealNotFound') }}
    </div>

    <UModal v-model:open="wonModal">
      <template #header>
        <h3 class="text-lg font-medium">{{ t('crm.deals.detail.createProjectModalTitle') }}</h3>
      </template>
      <template #body>
        <p class="text-sm text-[var(--color-gray)]">
          {{ t('crm.deals.detail.createProjectModalBody') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <ButtonPrimary :label="t('crm.deals.detail.close')" outline @click="wonModal = false" />
          <ButtonPrimary :label="t('crm.deals.detail.ok')" disabled />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MOCK_QUOTES, MOCK_ACTIVITIES, DEAL_STAGE_OPTIONS, dealStatusForStage } from '~/constants/mockData'

const { t } = useI18n()

useHead({ title: t('crm.deals.detail.pageTitle') })

const route = useRoute()
const { priceFormat, dateFormat, dateTimeFormat } = useFormatter()
const { success, error } = useNotify()
const companiesStore = useCompaniesStore()
const contactsStore = useContactsStore()
const dealsStore = useDealsStore()

const dealId = Number(route.params.id)
const deal = computed(() => dealsStore.items.find(d => d.id === dealId) ?? null)

const activeTab = ref('overview')
const tabItems = [
  { label: t('crm.deals.detail.tabs.overview'), value: 'overview' },
  { label: t('crm.deals.detail.tabs.quotes'), value: 'quotes' },
  { label: t('crm.deals.detail.tabs.activity'), value: 'activity' },
]

const wonModal = ref(false)

const companyName = computed(() => deal.value ? companiesStore.nameById(deal.value.company_id) : '-')
const contactName = computed(() => deal.value ? contactsStore.items.find(c => c.id === deal.value!.contact_id)?.name || '-' : '-')
const dealActivity = computed(() => MOCK_ACTIVITIES.filter(a => a.related_type === 'deal' && a.related_id === dealId))

const quotes = ref<Quote[]>([...MOCK_QUOTES])
const dealQuotes = computed(() => quotes.value.filter(q => q.deal_id === dealId))

const MAX_QUOTATION_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const fileInputRef = ref<HTMLInputElement | null>(null)

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const onFileSelected = (event: Event) => {
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

  quotes.value.push({
    id: Math.max(0, ...quotes.value.map(q => q.id)) + 1,
    deal_id: dealId,
    items: [],
    validity_date: null,
    status: 'sent',
    file_name: file.name,
    file_url: URL.createObjectURL(file),
    file_size: file.size,
    uploaded_at: new Date(),
  })
  success(t('crm.deals.detail.uploadSuccess'))
}

const onRemoveQuote = (quote: Quote) => {
  if (quote.file_url) URL.revokeObjectURL(quote.file_url)
  quotes.value = quotes.value.filter(q => q.id !== quote.id)
}

onUnmounted(() => {
  quotes.value.forEach(q => q.file_url && URL.revokeObjectURL(q.file_url))
})

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
})

const onSave = () => {
  if (deal.value) {
    deal.value.title = form.title
    deal.value.value = form.value
    deal.value.stage = form.stage as DealStage
    deal.value.status = dealStatusForStage(deal.value.stage)
    deal.value.expected_close_date = form.expected_close_date ? new Date(form.expected_close_date) : null
    deal.value.assigned_to = form.assigned_to ? Number(form.assigned_to) : null
  }
  success(t('crm.deals.detail.updateSuccess'))
}

const onMarkWon = () => {
  if (deal.value) {
    deal.value.stage = 'Won'
    deal.value.status = dealStatusForStage(deal.value.stage)
    form.stage = 'Won'
    success(t('crm.deals.detail.markWonSuccess'))
    wonModal.value = true
  }
}
</script>
